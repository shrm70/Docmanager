import {
  getBlockTextForVariant,
  getStoredDocument,
  listJobs,
  markVariantSync,
  saveStoredDocument,
  updateJob
} from "@docmanager/doc-model";
import { convertBetweenVariants } from "@docmanager/nepali-engine";
import { translateText } from "@docmanager/translation-sdk";
import { fileURLToPath } from "node:url";
import { workerConfig } from "./config.js";

const deriveVariantText = async ({ text, sourceVariant, targetVariant }) => {
  if (sourceVariant === targetVariant) {
    return { text, warnings: [] };
  }

  if (targetVariant === "ne-preeti") {
    const unicodeText =
      sourceVariant === "en"
        ? (
            await translateText({
              text,
              sourceVariant: "en",
              targetVariant: "ne-unicode",
              config: workerConfig.translation
            })
          ).text
        : convertBetweenVariants(text, sourceVariant, "ne-unicode").text;

    return convertBetweenVariants(unicodeText, "ne-unicode", "ne-preeti");
  }

  if (targetVariant === "ne-unicode") {
    if (sourceVariant === "en") {
      return translateText({
        text,
        sourceVariant: "en",
        targetVariant: "ne-unicode",
        config: workerConfig.translation
      });
    }

    return convertBetweenVariants(text, sourceVariant, "ne-unicode");
  }

  const unicodeSource =
    sourceVariant === "ne-preeti" ? convertBetweenVariants(text, "ne-preeti", "ne-unicode").text : text;

  return translateText({
    text: unicodeSource,
    sourceVariant: sourceVariant === "ne-preeti" ? "ne-unicode" : sourceVariant,
    targetVariant: "en",
    config: workerConfig.translation
  });
};

const processSyncJob = async (job) => {
  const document = await getStoredDocument(job.payload.documentId, workerConfig.dataPaths);

  if (!document) {
    throw new Error(`Document ${job.payload.documentId} was not found.`);
  }

  const targetVariants = job.payload.variantKey
    ? [job.payload.variantKey]
    : document.variants.filter((variant) => variant.key !== document.masterVariant).map((variant) => variant.key);

  const warnings = [];
  const syncedDocument = { ...document, pages: document.pages.map((page) => ({ ...page, blocks: [...page.blocks] })) };

  for (const page of syncedDocument.pages) {
    page.blocks = await Promise.all(
      page.blocks.map(async (block) => {
        const contentByVariant = { ...(block.contentByVariant ?? {}) };
        const sourceText = getBlockTextForVariant(block, document.masterVariant);

        for (const targetVariant of targetVariants) {
          const result = await deriveVariantText({
            text: sourceText,
            sourceVariant: document.masterVariant,
            targetVariant
          });

          contentByVariant[targetVariant] = result.text;
          if (Array.isArray(result.warnings) && result.warnings.length > 0) {
            warnings.push(...result.warnings.map((warning) => `${block.id}:${targetVariant}:${warning}`));
          }
        }

        return {
          ...block,
          contentByVariant
        };
      })
    );
  }

  const nextDocument = targetVariants.reduce((current, targetVariant) => markVariantSync(current, targetVariant), syncedDocument);
  await saveStoredDocument(nextDocument, workerConfig.dataPaths);

  return {
    processedVariants: targetVariants,
    warnings
  };
};

const processJob = async (job) => {
  await updateJob(job.id, (current) => ({ ...current, status: "running" }), workerConfig.dataPaths);

  try {
    let result = null;

    if (job.type === "sync-variants") {
      result = await processSyncJob(job);
    } else {
      result = { warnings: [`Unsupported job type: ${job.type}`] };
    }

    await updateJob(
      job.id,
      (current) => ({
        ...current,
        status: "completed",
        result
      }),
      workerConfig.dataPaths
    );
  } catch (error) {
    await updateJob(
      job.id,
      (current) => ({
        ...current,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown worker error."
      }),
      workerConfig.dataPaths
    );
  }
};

export const runWorkerOnce = async () => {
  const jobs = await listJobs(workerConfig.dataPaths);
  const queued = jobs.filter((job) => job.status === "queued");

  for (const job of queued) {
    await processJob(job);
  }
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await runWorkerOnce();
  setInterval(() => {
    runWorkerOnce().catch((error) => {
      console.error("[docmanager-worker]", error);
    });
  }, workerConfig.intervalMs);

  console.log(`[docmanager-worker] polling ${workerConfig.dataPaths.baseDir} every ${workerConfig.intervalMs}ms`);
}
