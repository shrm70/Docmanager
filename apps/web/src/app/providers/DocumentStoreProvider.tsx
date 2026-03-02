/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import type { PropsWithChildren } from "react";
import type { DocumentRecord, SyncJob, TextOperationResult, VariantKey } from "../../features/documents/model";
import {
  convertTextViaApi,
  createDocumentOnApi,
  deleteDocumentOnApi,
  getStoredApiBaseUrl,
  listDocumentsFromApi,
  listJobsFromApi,
  queueVariantSyncOnApi,
  setStoredApiBaseUrl,
  translateTextViaApi,
  updateDocumentOnApi
} from "../../features/documents/api";
import {
  markDocumentEdited,
  markVariantFresh,
  normalizeDocumentRecord,
  setDocumentMasterVariant
} from "../../features/documents/helpers";
import { createNewDocument } from "../../features/documents/sampleData";
import { createDocumentFromText, loadDocuments, persistDocuments } from "../../features/documents/storage";

type StorageMode = "local" | "api";

interface DocumentStoreValue {
  documents: DocumentRecord[];
  jobs: SyncJob[];
  apiBaseUrl: string;
  error: string | null;
  isLoading: boolean;
  storageMode: StorageMode;
  createDocument: (title?: string) => Promise<DocumentRecord>;
  deleteDocument: (documentId: string) => Promise<void>;
  getDocument: (documentId: string) => DocumentRecord | undefined;
  importTextDocument: (file: File) => Promise<DocumentRecord>;
  refreshDocuments: () => Promise<void>;
  refreshJobs: () => Promise<void>;
  saveDocument: (nextDocument: DocumentRecord, options?: { markEdited?: boolean }) => Promise<DocumentRecord>;
  setApiBaseUrl: (nextBaseUrl: string) => void;
  setMasterVariant: (documentId: string, nextMaster: VariantKey) => Promise<DocumentRecord | undefined>;
  syncAllDocuments: () => Promise<void>;
  syncDocumentVariants: (documentId: string, variant?: VariantKey) => Promise<void>;
  translateText: (text: string, sourceVariant: VariantKey, targetVariant: VariantKey) => Promise<TextOperationResult>;
  convertText: (text: string, sourceVariant: VariantKey, targetVariant: VariantKey) => Promise<TextOperationResult>;
}

const DocumentStoreContext = createContext<DocumentStoreValue | null>(null);

const insertOrReplaceDocument = (documents: DocumentRecord[], nextDocument: DocumentRecord) => {
  const normalized = normalizeDocumentRecord(nextDocument);
  const existingIndex = documents.findIndex((document) => document.id === normalized.id);

  if (existingIndex === -1) {
    return [normalized, ...documents];
  }

  return documents.map((document) => (document.id === normalized.id ? normalized : document));
};

const loadLocalDocuments = () => loadDocuments().map((document) => normalizeDocumentRecord(document));

const createLocalConversionResult = (text: string, sourceVariant: VariantKey, targetVariant: VariantKey): TextOperationResult => ({
  text,
  warnings: [
    `No backend conversion is configured for ${sourceVariant} -> ${targetVariant}. Set an API base URL in Settings to enable this operation.`
  ]
});

export const DocumentStoreProvider = ({ children }: PropsWithChildren) => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [apiBaseUrl, setApiBaseUrlState] = useState(() => getStoredApiBaseUrl());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<StorageMode>("local");

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setIsLoading(true);

      if (apiBaseUrl) {
        try {
          const [remoteDocuments, remoteJobs] = await Promise.all([listDocumentsFromApi(), listJobsFromApi()]);

          if (!cancelled) {
            setDocuments(remoteDocuments);
            setJobs(remoteJobs);
            setStorageMode("api");
            setError(null);
            setIsLoading(false);
          }

          return;
        } catch (bootstrapError) {
          if (!cancelled) {
            setError(
              bootstrapError instanceof Error
                ? `${bootstrapError.message} Falling back to browser storage.`
                : "Backend connection failed. Falling back to browser storage."
            );
          }
        }
      }

      if (!cancelled) {
        setDocuments(loadLocalDocuments());
        setJobs([]);
        setStorageMode("local");
        setIsLoading(false);
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl]);

  useEffect(() => {
    if (storageMode !== "local") {
      return;
    }

    persistDocuments(documents);
  }, [documents, storageMode]);

  useEffect(() => {
    if (storageMode !== "api") {
      return;
    }

    const intervalId = window.setInterval(() => {
      void listJobsFromApi()
        .then((nextJobs) => {
          setJobs(nextJobs);

          if (nextJobs.some((job) => job.status === "queued" || job.status === "running")) {
            return listDocumentsFromApi().then((nextDocuments) => {
              setDocuments(nextDocuments);
            });
          }

          return undefined;
        })
        .catch(() => {
          // Keep the last successful state when polling fails.
        });
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [storageMode]);

  const refreshDocuments = async () => {
    if (storageMode === "api") {
      const remoteDocuments = await listDocumentsFromApi();
      setDocuments(remoteDocuments);
      return;
    }

    setDocuments(loadLocalDocuments());
  };

  const refreshJobs = async () => {
    if (storageMode === "api") {
      const remoteJobs = await listJobsFromApi();
      setJobs(remoteJobs);
      return;
    }

    setJobs([]);
  };

  const saveDocumentAction = async (nextDocument: DocumentRecord, options?: { markEdited?: boolean }) => {
    const prepared =
      options?.markEdited === false
        ? normalizeDocumentRecord(nextDocument)
        : markDocumentEdited(normalizeDocumentRecord(nextDocument));

    if (storageMode === "api") {
      const saved = await updateDocumentOnApi(prepared);
      setDocuments((current) => insertOrReplaceDocument(current, saved));
      setError(null);
      return saved;
    }

    setDocuments((current) => insertOrReplaceDocument(current, prepared));
    return prepared;
  };

  const syncDocumentVariantsAction = async (documentId: string, variant?: VariantKey) => {
    if (storageMode === "api") {
      const job = await queueVariantSyncOnApi(documentId, variant);
      setJobs((current) => [job, ...current]);
      setError(null);
      return;
    }

    setDocuments((current) =>
      current.map((document) => (document.id === documentId ? markVariantFresh(document, variant) : document))
    );
  };

  const value: DocumentStoreValue = {
    documents,
    jobs,
    apiBaseUrl,
    error,
    isLoading,
    storageMode,
    createDocument: async (title) => {
      const document = normalizeDocumentRecord(createNewDocument(title));

      if (storageMode === "api") {
        const saved = await createDocumentOnApi(document);
        setDocuments((current) => insertOrReplaceDocument(current, saved));
        setError(null);
        return saved;
      }

      setDocuments((current) => [document, ...current]);
      return document;
    },
    deleteDocument: async (documentId) => {
      if (storageMode === "api") {
        await deleteDocumentOnApi(documentId);
        setDocuments((current) => current.filter((document) => document.id !== documentId));
        setError(null);
        return;
      }

      setDocuments((current) => current.filter((document) => document.id !== documentId));
    },
    getDocument: (documentId) => documents.find((document) => document.id === documentId),
    importTextDocument: async (file) => {
      const document = normalizeDocumentRecord(await createDocumentFromText(file));

      if (storageMode === "api") {
        const saved = await createDocumentOnApi(document);
        setDocuments((current) => insertOrReplaceDocument(current, saved));
        setError(null);
        return saved;
      }

      setDocuments((current) => [document, ...current]);
      return document;
    },
    refreshDocuments,
    refreshJobs,
    saveDocument: saveDocumentAction,
    setApiBaseUrl: (nextBaseUrl) => {
      setStoredApiBaseUrl(nextBaseUrl);
      setApiBaseUrlState(getStoredApiBaseUrl());
    },
    setMasterVariant: async (documentId, nextMaster) => {
      const document = documents.find((item) => item.id === documentId);

      if (!document) {
        return undefined;
      }

      const nextDocument = setDocumentMasterVariant(document, nextMaster);
      return saveDocumentAction(nextDocument);
    },
    syncAllDocuments: async () => {
      const staleDocuments = documents.filter((document) => document.variants.some((variant) => variant.isStale));

      for (const document of staleDocuments) {
        await syncDocumentVariantsAction(document.id);
      }
    },
    syncDocumentVariants: syncDocumentVariantsAction,
    translateText: async (text, sourceVariant, targetVariant) => {
      if (storageMode === "api") {
        return translateTextViaApi(text, sourceVariant, targetVariant);
      }

      return {
        text: `[mock:${targetVariant}] ${text}`,
        warnings: ["Backend translation is not configured. This is a local mock result."],
        provider: "mock"
      };
    },
    convertText: async (text, sourceVariant, targetVariant) => {
      if (storageMode === "api") {
        return convertTextViaApi(text, sourceVariant, targetVariant);
      }

      return createLocalConversionResult(text, sourceVariant, targetVariant);
    }
  };

  return <DocumentStoreContext.Provider value={value}>{children}</DocumentStoreContext.Provider>;
};

export const useDocumentStore = () => {
  const context = useContext(DocumentStoreContext);

  if (!context) {
    throw new Error("useDocumentStore must be used within DocumentStoreProvider.");
  }

  return context;
};
