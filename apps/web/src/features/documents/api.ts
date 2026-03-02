import type { DocumentRecord, SyncJob, TextOperationResult, VariantKey } from "./model";
import { normalizeDocumentRecord } from "./helpers";

const API_BASE_STORAGE_KEY = "docmanager.api-base-url.v1";
const API_TOKEN_STORAGE_KEY = "docmanager.api-token.v1";

const normalizeApiBaseUrl = (value: string) => value.trim().replace(/\/+$/, "");

export const getStoredApiBaseUrl = () => {
  if (typeof window === "undefined") {
    return normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL ?? "");
  }

  const stored = window.localStorage.getItem(API_BASE_STORAGE_KEY);
  return normalizeApiBaseUrl(stored || import.meta.env.VITE_API_BASE_URL || "");
};

export const setStoredApiBaseUrl = (value: string) => {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeApiBaseUrl(value);

  if (!normalized) {
    window.localStorage.removeItem(API_BASE_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(API_BASE_STORAGE_KEY, normalized);
};

export const getStoredApiToken = () => {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(API_TOKEN_STORAGE_KEY) ?? "";
};

export const setStoredApiToken = (value: string) => {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = value.trim();

  if (!normalized) {
    window.localStorage.removeItem(API_TOKEN_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(API_TOKEN_STORAGE_KEY, normalized);
};

export const clearStoredApiToken = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(API_TOKEN_STORAGE_KEY);
};

const createApiError = async (response: Response) => {
  let message = `Request failed with status ${response.status}.`;

  try {
    const payload = (await response.json()) as { message?: string };
    message = payload.message ?? message;
  } catch {
    // Ignore JSON parsing errors and keep the generic message.
  }

  return new Error(message);
};

const createRequestHeaders = (
  headers: HeadersInit | undefined,
  options: {
    authToken?: string;
    includeStoredToken?: boolean;
  } = {}
) => {
  const nextHeaders = new Headers(headers);

  if (!nextHeaders.has("Content-Type")) {
    nextHeaders.set("Content-Type", "application/json");
  }

  const token = options.authToken ?? (options.includeStoredToken === false ? "" : getStoredApiToken());

  if (token) {
    nextHeaders.set("Authorization", `Bearer ${token}`);
  }

  return nextHeaders;
};

const requestJson = async <T>(
  path: string,
  init?: RequestInit,
  options?: {
    authToken?: string;
    includeStoredToken?: boolean;
  }
): Promise<T> => {
  const baseUrl = getStoredApiBaseUrl();

  if (!baseUrl) {
    throw new Error("No API base URL is configured.");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: createRequestHeaders(init?.headers, options)
  });

  if (!response.ok) {
    throw await createApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export const getAuthStatusFromApi = () => requestJson<{ authRequired: boolean }>("/api/auth/status", undefined, {
  includeStoredToken: false
});

export const authenticateWithApiToken = (token: string) =>
  requestJson<{ authenticated: boolean; authRequired: boolean }>(
    "/api/auth/session",
    {
      method: "POST"
    },
    {
      authToken: token,
      includeStoredToken: false
    }
  );

export const listDocumentsFromApi = async () => {
  const response = await requestJson<{ items: DocumentRecord[] }>("/api/documents");
  return response.items.map((document) => normalizeDocumentRecord(document));
};

export const createDocumentOnApi = async (document: DocumentRecord) => {
  const saved = await requestJson<DocumentRecord>("/api/documents", {
    method: "POST",
    body: JSON.stringify(document)
  });

  return normalizeDocumentRecord(saved);
};

export const updateDocumentOnApi = async (document: DocumentRecord) => {
  const saved = await requestJson<DocumentRecord>(`/api/documents/${document.id}`, {
    method: "PUT",
    body: JSON.stringify(document)
  });

  return normalizeDocumentRecord(saved);
};

export const deleteDocumentOnApi = async (documentId: string) => {
  await requestJson<void>(`/api/documents/${documentId}`, {
    method: "DELETE"
  });
};

export const listJobsFromApi = async () => {
  const response = await requestJson<{ items: SyncJob[] }>("/api/jobs");
  return response.items;
};

export const queueVariantSyncOnApi = async (documentId: string, variantKey?: VariantKey) =>
  requestJson<SyncJob>(`/api/documents/${documentId}/sync`, {
    method: "POST",
    body: JSON.stringify({ variantKey: variantKey ?? null })
  });

export const translateTextViaApi = async (text: string, sourceVariant: VariantKey, targetVariant: VariantKey) =>
  requestJson<TextOperationResult>("/api/translation/translate", {
    method: "POST",
    body: JSON.stringify({ text, sourceVariant, targetVariant })
  });

export const convertTextViaApi = async (text: string, sourceVariant: VariantKey, targetVariant: VariantKey) => {
  if (sourceVariant === targetVariant) {
    return {
      text,
      warnings: []
    } satisfies TextOperationResult;
  }

  if (sourceVariant === "ne-preeti" && targetVariant === "ne-unicode") {
    return requestJson<TextOperationResult>("/api/conversion/preeti-to-unicode", {
      method: "POST",
      body: JSON.stringify({ text })
    });
  }

  if (sourceVariant === "ne-unicode" && targetVariant === "ne-preeti") {
    return requestJson<TextOperationResult>("/api/conversion/unicode-to-preeti", {
      method: "POST",
      body: JSON.stringify({ text })
    });
  }

  return translateTextViaApi(text, sourceVariant, targetVariant);
};
