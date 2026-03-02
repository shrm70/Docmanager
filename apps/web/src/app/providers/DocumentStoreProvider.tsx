/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { DocumentRecord, VariantKey } from "../../features/documents/model";
import { createNewDocument } from "../../features/documents/sampleData";
import { createDocumentFromText, loadDocuments, persistDocuments } from "../../features/documents/storage";

interface DocumentStoreValue {
  documents: DocumentRecord[];
  createDocument: (title?: string) => DocumentRecord;
  importTextDocument: (file: File) => Promise<DocumentRecord>;
  saveDocument: (nextDocument: DocumentRecord) => void;
  deleteDocument: (documentId: string) => void;
  getDocument: (documentId: string) => DocumentRecord | undefined;
  syncDocumentVariants: (documentId: string, variant?: VariantKey) => void;
  syncAllDocuments: () => void;
  setMasterVariant: (documentId: string, nextMaster: VariantKey) => void;
}

const DocumentStoreContext = createContext<DocumentStoreValue | null>(null);

const markVariantsStale = (document: DocumentRecord): DocumentRecord => ({
  ...document,
  updatedAt: new Date().toISOString(),
  variants: document.variants.map((variant) =>
    variant.key === document.masterVariant
      ? { ...variant, isMaster: true, isStale: false, lastSyncedAt: new Date().toISOString() }
      : { ...variant, isMaster: false, isStale: true }
  )
});

export const DocumentStoreProvider = ({ children }: PropsWithChildren) => {
  const [documents, setDocuments] = useState<DocumentRecord[]>(() => loadDocuments());

  useEffect(() => {
    persistDocuments(documents);
  }, [documents]);

  const value = useMemo<DocumentStoreValue>(() => {
    const createDocumentAction = (title?: string) => {
      const document = createNewDocument(title);
      setDocuments((current) => [document, ...current]);
      return document;
    };

    const importTextDocument = async (file: File) => {
      const document = await createDocumentFromText(file);
      setDocuments((current) => [document, ...current]);
      return document;
    };

    return {
      documents,
      createDocument: createDocumentAction,
      importTextDocument,
      saveDocument: (nextDocument) => {
        setDocuments((current) =>
          current.map((document) => (document.id === nextDocument.id ? markVariantsStale(nextDocument) : document))
        );
      },
      deleteDocument: (documentId) => {
        setDocuments((current) => current.filter((document) => document.id !== documentId));
      },
      getDocument: (documentId) => documents.find((document) => document.id === documentId),
      syncDocumentVariants: (documentId, variant) => {
        const now = new Date().toISOString();
        setDocuments((current) =>
          current.map((document) => {
            if (document.id !== documentId) {
              return document;
            }

            return {
              ...document,
              variants: document.variants.map((item) => {
                if (variant && item.key !== variant) {
                  return item;
                }

                return {
                  ...item,
                  isStale: false,
                  lastSyncedAt: now
                };
              })
            };
          })
        );
      },
      syncAllDocuments: () => {
        const now = new Date().toISOString();
        setDocuments((current) =>
          current.map((document) => ({
            ...document,
            variants: document.variants.map((variant) => ({
              ...variant,
              isStale: false,
              lastSyncedAt: now
            }))
          }))
        );
      },
      setMasterVariant: (documentId, nextMaster) => {
        setDocuments((current) =>
          current.map((document) => {
            if (document.id !== documentId) {
              return document;
            }

            const now = new Date().toISOString();
            return {
              ...document,
              masterVariant: nextMaster,
              updatedAt: now,
              variants: document.variants.map((variant) => ({
                ...variant,
                isMaster: variant.key === nextMaster,
                isStale: variant.key !== nextMaster,
                lastSyncedAt: variant.key === nextMaster ? now : variant.lastSyncedAt
              }))
            };
          })
        );
      }
    };
  }, [documents]);

  return <DocumentStoreContext.Provider value={value}>{children}</DocumentStoreContext.Provider>;
};

export const useDocumentStore = () => {
  const context = useContext(DocumentStoreContext);

  if (!context) {
    throw new Error("useDocumentStore must be used within DocumentStoreProvider.");
  }

  return context;
};
