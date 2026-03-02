import type { DocumentBlock, DocumentRecord, VariantKey, VariantStatus } from "./model";

export const variantLabels: Record<VariantKey, string> = {
  en: "English",
  "ne-unicode": "Nepali Unicode",
  "ne-preeti": "Preeti"
};

const emptyVariantMap = (): Record<VariantKey, string> => ({
  en: "",
  "ne-unicode": "",
  "ne-preeti": ""
});

export const createVariantStatuses = (
  masterVariant: VariantKey = "ne-unicode",
  updatedAt = new Date().toISOString()
): VariantStatus[] =>
  (Object.keys(variantLabels) as VariantKey[]).map((key) => ({
    key,
    label: variantLabels[key],
    isMaster: key === masterVariant,
    isStale: key !== masterVariant,
    lastSyncedAt: key === masterVariant ? updatedAt : null
  }));

export const toVariantContentMap = (block: Partial<DocumentBlock>, masterVariant: VariantKey) => {
  const contentByVariant = {
    ...emptyVariantMap(),
    ...(block.contentByVariant ?? {})
  };

  if (!contentByVariant[masterVariant] && typeof block.text === "string") {
    contentByVariant[masterVariant] = block.text;
  }

  return contentByVariant;
};

export const getBlockTextForVariant = (block: DocumentBlock, variantKey: VariantKey) =>
  block.contentByVariant?.[variantKey] ?? block.text;

export const normalizeDocumentRecord = (input: Partial<DocumentRecord>): DocumentRecord => {
  const updatedAt = input.updatedAt ?? new Date().toISOString();
  const masterVariant = input.masterVariant ?? "ne-unicode";

  return {
    id: input.id ?? `doc-${crypto.randomUUID()}`,
    title: input.title?.trim() || "Untitled document",
    description: input.description ?? "",
    updatedAt,
    masterVariant,
    variants:
      Array.isArray(input.variants) && input.variants.length > 0
        ? input.variants.map((variant) => ({
            key: variant.key,
            label: variant.label ?? variantLabels[variant.key],
            isMaster: variant.key === masterVariant,
            isStale: variant.key !== masterVariant ? Boolean(variant.isStale) : false,
            lastSyncedAt: variant.key === masterVariant ? variant.lastSyncedAt ?? updatedAt : variant.lastSyncedAt ?? null
          }))
        : createVariantStatuses(masterVariant, updatedAt),
    pages: Array.isArray(input.pages)
      ? input.pages.map((page, pageIndex) => {
          const pageId = page.id ?? `page-${crypto.randomUUID()}`;

          return {
            id: pageId,
            number: page.number ?? pageIndex + 1,
            title: page.title ?? `Page ${pageIndex + 1}`,
            blocks: Array.isArray(page.blocks)
              ? page.blocks.map((block) => {
                  const contentByVariant = toVariantContentMap(block, masterVariant);

                  return {
                    id: block.id ?? `block-${crypto.randomUUID()}`,
                    kind: block.kind ?? "paragraph",
                    pageId,
                    text: contentByVariant[masterVariant] ?? "",
                    contentByVariant,
                    level: block.level,
                    style: {
                      fontSize: block.style?.fontSize ?? (block.kind === "heading" ? 28 : 16),
                      color: block.style?.color ?? "#2a2a2a",
                      gapBefore: block.style?.gapBefore ?? 8,
                      gapAfter: block.style?.gapAfter ?? 12,
                      bold: block.style?.bold ?? block.kind === "heading",
                      italic: block.style?.italic ?? false
                    },
                    meta: block.meta
                  };
                })
              : []
          };
        })
      : []
  };
};

export const markDocumentEdited = (document: DocumentRecord): DocumentRecord => {
  const now = new Date().toISOString();

  return {
    ...document,
    updatedAt: now,
    variants: document.variants.map((variant) =>
      variant.key === document.masterVariant
        ? { ...variant, isMaster: true, isStale: false, lastSyncedAt: now }
        : { ...variant, isMaster: false, isStale: true }
    )
  };
};

export const markVariantFresh = (document: DocumentRecord, targetVariant?: VariantKey): DocumentRecord => {
  const now = new Date().toISOString();

  return {
    ...document,
    variants: document.variants.map((variant) => {
      if (targetVariant && variant.key !== targetVariant) {
        return variant;
      }

      return {
        ...variant,
        isStale: false,
        lastSyncedAt: now
      };
    })
  };
};

export const projectDocumentForVariant = (
  document: DocumentRecord,
  variantKey: VariantKey = document.masterVariant
): DocumentRecord => ({
  ...document,
  pages: document.pages.map((page) => ({
    ...page,
    blocks: page.blocks.map((block) => ({
      ...block,
      text: getBlockTextForVariant(block, variantKey)
    }))
  }))
});

export const setDocumentMasterVariant = (document: DocumentRecord, nextMaster: VariantKey): DocumentRecord => {
  const now = new Date().toISOString();
  const projected = projectDocumentForVariant(
    {
      ...document,
      masterVariant: nextMaster,
      updatedAt: now,
      variants: document.variants.map((variant) => ({
        ...variant,
        isMaster: variant.key === nextMaster,
        isStale: variant.key !== nextMaster,
        lastSyncedAt: variant.key === nextMaster ? variant.lastSyncedAt ?? now : variant.lastSyncedAt
      }))
    },
    nextMaster
  );

  return projected;
};
