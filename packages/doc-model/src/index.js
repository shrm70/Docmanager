import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export const VARIANT_KEYS = ["en", "ne-unicode", "ne-preeti"];

export const createVariantStatuses = (masterVariant = "ne-unicode", updatedAt = new Date().toISOString()) =>
  VARIANT_KEYS.map((key) => ({
    key,
    label:
      key === "en" ? "English" : key === "ne-preeti" ? "Preeti" : "Nepali Unicode",
    isMaster: key === masterVariant,
    isStale: key !== masterVariant,
    lastSyncedAt: key === masterVariant ? updatedAt : null
  }));

export const toVariantContentMap = (block, masterVariant) => {
  const baseContent = {
    en: "",
    "ne-unicode": "",
    "ne-preeti": "",
    ...(block.contentByVariant ?? {})
  };

  if (!baseContent[masterVariant] && typeof block.text === "string") {
    baseContent[masterVariant] = block.text;
  }

  return baseContent;
};

export const normalizeDocument = (input) => {
  const documentId = input?.id ?? `doc-${crypto.randomUUID()}`;
  const masterVariant = input?.masterVariant ?? "ne-unicode";
  const updatedAt = input?.updatedAt ?? new Date().toISOString();
  const pages = Array.isArray(input?.pages) ? input.pages : [];

  return {
    id: documentId,
    title: input?.title?.trim() || "Untitled document",
    description: input?.description ?? "",
    updatedAt,
    masterVariant,
    variants: Array.isArray(input?.variants) && input.variants.length > 0 ? input.variants : createVariantStatuses(masterVariant, updatedAt),
    pages: pages.map((page, pageIndex) => {
      const pageId = page?.id ?? `page-${crypto.randomUUID()}`;

      return {
        id: pageId,
        number: page?.number ?? pageIndex + 1,
        title: page?.title ?? `Page ${pageIndex + 1}`,
        blocks: Array.isArray(page?.blocks)
          ? page.blocks.map((block) => {
              const contentByVariant = toVariantContentMap(block ?? {}, masterVariant);

              return {
                id: block?.id ?? `block-${crypto.randomUUID()}`,
                kind: block?.kind ?? "paragraph",
                pageId,
              text: contentByVariant[masterVariant] ?? "",
              contentByVariant,
              level: block?.level,
              style: {
                fontSize: block?.style?.fontSize ?? (block?.kind === "heading" ? 28 : 16),
                color: block?.style?.color ?? "#2a2a2a",
                gapBefore: block?.style?.gapBefore ?? 8,
                gapAfter: block?.style?.gapAfter ?? 12,
                bold: block?.style?.bold ?? block?.kind === "heading",
                italic: block?.style?.italic ?? false
              },
                meta: block?.meta ?? {}
              };
            })
          : []
      };
    })
  };
};

export const projectDocumentForVariant = (document, variantKey = document.masterVariant) => ({
  ...document,
  pages: document.pages.map((page) => ({
    ...page,
    blocks: page.blocks.map((block) => ({
      ...block,
      text: block.contentByVariant?.[variantKey] ?? block.text ?? ""
    }))
  }))
});

export const markVariantSync = (document, targetVariant) => {
  const now = new Date().toISOString();

  return {
    ...document,
    updatedAt: now,
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

export const markDocumentEdited = (document) => {
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

export const getBlockTextForVariant = (block, variantKey) => block.contentByVariant?.[variantKey] ?? block.text ?? "";

const ensureFile = async (filePath, fallbackValue) => {
  try {
    await readFile(filePath, "utf8");
  } catch {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(fallbackValue, null, 2));
  }
};

const readJson = async (filePath, fallbackValue) => {
  await ensureFile(filePath, fallbackValue);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
};

const writeJson = async (filePath, value) => {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(value, null, 2));
};

export const createDataPaths = (baseDir = join(process.cwd(), "data")) => ({
  baseDir,
  documents: join(baseDir, "documents.json"),
  jobs: join(baseDir, "jobs.json")
});

export const listStoredDocuments = async (paths = createDataPaths()) => {
  const documents = await readJson(paths.documents, []);
  return documents.map((document) => normalizeDocument(document));
};

export const getStoredDocument = async (documentId, paths = createDataPaths()) => {
  const documents = await listStoredDocuments(paths);
  return documents.find((document) => document.id === documentId) ?? null;
};

export const saveStoredDocument = async (input, paths = createDataPaths()) => {
  const document = normalizeDocument(input);
  const documents = await listStoredDocuments(paths);
  const nextDocuments = documents.some((item) => item.id === document.id)
    ? documents.map((item) => (item.id === document.id ? document : item))
    : [document, ...documents];

  await writeJson(paths.documents, nextDocuments);
  return document;
};

export const updateStoredDocument = async (documentId, updater, paths = createDataPaths()) => {
  const documents = await listStoredDocuments(paths);
  const current = documents.find((item) => item.id === documentId);

  if (!current) {
    return null;
  }

  const updated = normalizeDocument(updater(current));
  await writeJson(
    paths.documents,
    documents.map((item) => (item.id === documentId ? updated : item))
  );

  return updated;
};

export const listJobs = async (paths = createDataPaths()) => readJson(paths.jobs, []);

export const createJob = async (job, paths = createDataPaths()) => {
  const jobs = await listJobs(paths);
  const nextJob = {
    id: job.id ?? `job-${crypto.randomUUID()}`,
    type: job.type ?? "sync-variants",
    status: job.status ?? "queued",
    payload: job.payload ?? {},
    createdAt: job.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await writeJson(paths.jobs, [nextJob, ...jobs]);
  return nextJob;
};

export const updateJob = async (jobId, updater, paths = createDataPaths()) => {
  const jobs = await listJobs(paths);
  const current = jobs.find((job) => job.id === jobId);

  if (!current) {
    return null;
  }

  const nextJob = {
    ...updater(current),
    id: current.id,
    updatedAt: new Date().toISOString()
  };

  await writeJson(
    paths.jobs,
    jobs.map((job) => (job.id === jobId ? nextJob : job))
  );

  return nextJob;
};
