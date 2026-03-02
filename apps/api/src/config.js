import "dotenv/config";
import { join } from "node:path";
import { createDataPaths } from "@docmanager/doc-model";

export const apiConfig = {
  host: process.env.DOCMANAGER_API_HOST || "127.0.0.1",
  port: Number(process.env.DOCMANAGER_API_PORT || 8787),
  dataPaths: createDataPaths(process.env.DOCMANAGER_DATA_DIR || join(process.cwd(), "data", "runtime")),
  translation: {
    provider: process.env.TRANSLATION_PROVIDER || "mock",
    apiKey: process.env.TRANSLATION_API_KEY || "",
    azureRegion: process.env.AZURE_TRANSLATOR_REGION || "",
    googleBaseUrl: process.env.GOOGLE_TRANSLATE_BASE_URL || "",
    azureBaseUrl: process.env.AZURE_TRANSLATE_BASE_URL || "",
    deepLBaseUrl: process.env.DEEPL_BASE_URL || ""
  }
};
