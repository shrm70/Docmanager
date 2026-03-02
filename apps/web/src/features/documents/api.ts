import type { DocumentRecord, SyncJob, TextOperationResult, VariantKey } from "./model";
import { normalizeDocumentRecord } from "./helpers";

const API_BASE_STORAGE_KEY = "docmanager.api-base-url.v1";

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

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const baseUrl = getStoredApiBaseUrl();

  if (!baseUrl) {
    throw new Error("No API base URL is configured.");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw await createApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

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
