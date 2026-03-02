import type { DocumentRecord } from "./model";
import { normalizeDocumentRecord } from "./helpers";
import { createSeedDocuments } from "./sampleData";

const STORAGE_KEY = "docmanager.documents.v1";

export const loadDocuments = (): DocumentRecord[] => {
  if (typeof window === "undefined") {
    return createSeedDocuments().map((document) => normalizeDocumentRecord(document));
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return createSeedDocuments();
  }

  try {
    const parsed = JSON.parse(raw) as DocumentRecord[];
    return parsed.length > 0 ? parsed.map((document) => normalizeDocumentRecord(document)) : createSeedDocuments();
  } catch {
    return createSeedDocuments().map((document) => normalizeDocumentRecord(document));
  }
};

export const persistDocuments = (documents: DocumentRecord[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
};

export const downloadDocument = (document: DocumentRecord) => {
  const blob = new Blob([JSON.stringify(document, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = `${document.title.toLowerCase().replace(/\s+/g, "-")}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const createDocumentFromText = async (file: File): Promise<DocumentRecord> => {
  const text = await file.text();
  const title = file.name.replace(/\.[^.]+$/, "") || "Imported document";
  const now = new Date().toISOString();
  const pageId = `page-${crypto.randomUUID()}`;
  const masterVariant = "ne-unicode";

  return normalizeDocumentRecord({
    id: `doc-${crypto.randomUUID()}`,
    title,
    description: "Imported from a text file.",
    updatedAt: now,
    masterVariant,
    variants: [
      { key: "ne-unicode", label: "Nepali Unicode", isMaster: true, isStale: false, lastSyncedAt: now },
      { key: "ne-preeti", label: "Preeti", isMaster: false, isStale: true, lastSyncedAt: null },
      { key: "en", label: "English", isMaster: false, isStale: true, lastSyncedAt: null }
    ],
    pages: [
      {
        id: pageId,
        number: 1,
        title: "Imported page",
        blocks: text.split(/\n{2,}/).map((paragraph, index) => ({
          id: `block-${crypto.randomUUID()}`,
          kind: index === 0 ? ("heading" as const) : ("paragraph" as const),
          pageId,
          text: paragraph.trim() || "Imported paragraph",
          contentByVariant: {
            [masterVariant]: paragraph.trim() || "Imported paragraph"
          },
          level: index === 0 ? 1 : undefined,
          style: {
            fontSize: index === 0 ? 28 : 16,
            color: "#2a2a2a",
            gapBefore: 8,
            gapAfter: 12,
            bold: index === 0,
            italic: false
          }
        }))
      }
    ]
  });
};
