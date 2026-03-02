import type { BlockKind, BlockStyle, DocumentBlock, DocumentRecord, VariantKey } from "./model";
import { normalizeDocumentRecord } from "./helpers";

const baseStyle = (overrides: Partial<BlockStyle> = {}): BlockStyle => ({
  fontSize: 16,
  color: "#2a2a2a",
  gapBefore: 8,
  gapAfter: 12,
  bold: false,
  italic: false,
  ...overrides
});

const createBlock = (
  id: string,
  pageId: string,
  kind: BlockKind,
  text: string,
  masterVariant: VariantKey,
  overrides: Partial<DocumentBlock> = {}
): DocumentBlock => ({
  id,
  kind,
  pageId,
  text,
  contentByVariant: {
    [masterVariant]: text
  },
  style: baseStyle(kind === "heading" ? { fontSize: 28, bold: true, gapBefore: 4, gapAfter: 14 } : {}),
  ...overrides
});

const createVariants = (masterVariant: VariantKey) => {
  const now = new Date().toISOString();

  return [
    {
      key: "ne-unicode" as const,
      label: "Nepali Unicode",
      isMaster: masterVariant === "ne-unicode",
      isStale: masterVariant !== "ne-unicode",
      lastSyncedAt: masterVariant === "ne-unicode" ? now : null
    },
    {
      key: "ne-preeti" as const,
      label: "Preeti",
      isMaster: masterVariant === "ne-preeti",
      isStale: masterVariant !== "ne-preeti",
      lastSyncedAt: masterVariant === "ne-preeti" ? now : null
    },
    {
      key: "en" as const,
      label: "English",
      isMaster: masterVariant === "en",
      isStale: masterVariant !== "en",
      lastSyncedAt: masterVariant === "en" ? now : null
    }
  ];
};

export const createSeedDocuments = (): DocumentRecord[] => [
  normalizeDocumentRecord({
    id: "doc-nepali-board",
    title: "Municipality Infrastructure Brief",
    description: "A mixed Nepali and English working paper with chart, flowchart, and table placeholders.",
    updatedAt: new Date().toISOString(),
    masterVariant: "ne-unicode",
    variants: createVariants("ne-unicode"),
    pages: [
      {
        id: "page-1",
        number: 1,
        title: "Overview",
        blocks: [
          createBlock("block-1", "page-1", "heading", "नगर पूर्वाधार सुधार योजना", "ne-unicode", { level: 1 }),
          createBlock(
            "block-2",
            "page-1",
            "paragraph",
            "This studio keeps Unicode as the master text while allowing Preeti-oriented workflows and future English translation sync.",
            "ne-unicode"
          ),
          createBlock(
            "block-3",
            "page-1",
            "table",
            "Table placeholder: budget rows, ward allocations, and fiscal year totals.",
            "ne-unicode",
            { meta: { rows: 4, cols: 3 } }
          ),
          createBlock(
            "block-4",
            "page-1",
            "chart",
            "Chart placeholder: linked funding trend by fiscal year.",
            "ne-unicode",
            { meta: { chartType: "bar", dataSource: "budget-sheet-1" } }
          )
        ]
      },
      {
        id: "page-2",
        number: 2,
        title: "Execution",
        blocks: [
          createBlock("block-5", "page-2", "heading", "Implementation Flow", "ne-unicode", { level: 2 }),
          createBlock(
            "block-6",
            "page-2",
            "flowchart",
            "Flowchart placeholder: approval -> procurement -> execution -> review.",
            "ne-unicode"
          ),
          createBlock(
            "block-7",
            "page-2",
            "textbox",
            "Textbox placeholder for field notes, ward remarks, or callout summaries.",
            "ne-unicode"
          ),
          createBlock(
            "block-8",
            "page-2",
            "paragraph",
            "Use the left pane for chapters, page thumbnails, and search. Use the right pane for paragraph gap, color, and variant sync status.",
            "ne-unicode"
          )
        ]
      }
    ]
  }),
  normalizeDocumentRecord({
    id: "doc-english-policy",
    title: "Policy Draft Workspace",
    description: "English-first draft with Nepali variants marked stale until sync.",
    updatedAt: new Date().toISOString(),
    masterVariant: "en",
    variants: createVariants("en"),
    pages: [
      {
        id: "policy-page-1",
        number: 1,
        title: "Introduction",
        blocks: [
          createBlock("policy-block-1", "policy-page-1", "heading", "Project Charter", "en", { level: 1 }),
          createBlock(
            "policy-block-2",
            "policy-page-1",
            "paragraph",
            "This sample document demonstrates the gallery, autosave, search, and page navigation behaviors for the initial shell.",
            "en"
          ),
          createBlock(
            "policy-block-3",
            "policy-page-1",
            "image",
            "Image placeholder: upload a cover image, diagram, or infographic tile.",
            "en"
          )
        ]
      }
    ]
  })
];

export const createNewDocument = (title = "Untitled document"): DocumentRecord => {
  const id = `doc-${crypto.randomUUID()}`;
  const pageId = `page-${crypto.randomUUID()}`;
  const timestamp = new Date().toISOString();
  const masterVariant: VariantKey = "ne-unicode";

  return normalizeDocumentRecord({
    id,
    title,
    description: "Start writing here.",
    updatedAt: timestamp,
    masterVariant,
    variants: createVariants(masterVariant),
    pages: [
      {
        id: pageId,
        number: 1,
        title: "Page 1",
        blocks: [
          createBlock(`block-${crypto.randomUUID()}`, pageId, "heading", "New chapter", masterVariant, { level: 1 }),
          createBlock(`block-${crypto.randomUUID()}`, pageId, "paragraph", "Add your first paragraph here.", masterVariant)
        ]
      }
    ]
  });
};
