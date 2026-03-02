import Fastify from "fastify";
import cors from "@fastify/cors";
import { fileURLToPath } from "node:url";
import {
  createJob,
  deleteStoredDocument,
  getStoredDocument,
  listJobs,
  listStoredDocuments,
  markDocumentEdited,
  normalizeDocument,
  projectDocumentForVariant,
  saveStoredDocument
} from "@docmanager/doc-model";
import {
  convertPreetiToUnicode,
  convertUnicodeToPreeti,
  detectEncoding
} from "@docmanager/nepali-engine";
import { translateText } from "@docmanager/translation-sdk";
import { apiConfig } from "./config.js";

export const buildServer = async () => {
  const server = Fastify({ logger: true });
  await server.register(cors, { origin: true });

  server.get("/health", async () => ({
    ok: true,
    service: "docmanager-api"
  }));

  server.get("/api/config", async () => ({
    pagesBasePath: "/Docmanager/",
    translationProvider: apiConfig.translation.provider,
    dataDirectory: apiConfig.dataPaths.baseDir
  }));

  server.get("/api/documents", async (request) => {
    const variant = request.query?.variant;
    const documents = await listStoredDocuments(apiConfig.dataPaths);

    return {
      items: documents.map((document) => (variant ? projectDocumentForVariant(document, variant) : document))
    };
  });

  server.get("/api/documents/:documentId", async (request, reply) => {
    const document = await getStoredDocument(request.params.documentId, apiConfig.dataPaths);

    if (!document) {
      reply.code(404);
      return { message: "Document not found." };
    }

    const variant = request.query?.variant;
    return variant ? projectDocumentForVariant(document, variant) : document;
  });

  server.post("/api/documents", async (request, reply) => {
    const document = markDocumentEdited(normalizeDocument(request.body));
    const saved = await saveStoredDocument(document, apiConfig.dataPaths);
    reply.code(201);
    return saved;
  });

  server.put("/api/documents/:documentId", async (request) => {
    const document = markDocumentEdited(normalizeDocument({ ...request.body, id: request.params.documentId }));
    return saveStoredDocument(document, apiConfig.dataPaths);
  });

  server.delete("/api/documents/:documentId", async (request, reply) => {
    const deleted = await deleteStoredDocument(request.params.documentId, apiConfig.dataPaths);

    if (!deleted) {
      reply.code(404);
      return { message: "Document not found." };
    }

    reply.code(204);
    return null;
  });

  server.post("/api/documents/:documentId/sync", async (request, reply) => {
    const document = await getStoredDocument(request.params.documentId, apiConfig.dataPaths);

    if (!document) {
      reply.code(404);
      return { message: "Document not found." };
    }

    const job = await createJob(
      {
        type: "sync-variants",
        payload: {
          documentId: document.id,
          variantKey: request.body?.variantKey ?? null,
          provider: request.body?.provider ?? apiConfig.translation.provider
        }
      },
      apiConfig.dataPaths
    );

    reply.code(202);
    return job;
  });

  server.get("/api/jobs", async () => ({
    items: await listJobs(apiConfig.dataPaths)
  }));

  server.post("/api/conversion/detect", async (request) => ({
    encoding: detectEncoding(request.body?.text ?? "")
  }));

  server.post("/api/conversion/preeti-to-unicode", async (request) => convertPreetiToUnicode(request.body?.text ?? ""));

  server.post("/api/conversion/unicode-to-preeti", async (request) => convertUnicodeToPreeti(request.body?.text ?? ""));

  server.post("/api/translation/translate", async (request) => {
    const body = request.body ?? {};
    const provider = body.provider ?? apiConfig.translation.provider;

    return translateText({
      text: body.text ?? "",
      sourceVariant: body.sourceVariant ?? "ne-unicode",
      targetVariant: body.targetVariant ?? "en",
      config: {
        ...apiConfig.translation,
        provider
      }
    });
  });

  return server;
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const server = await buildServer();
  server.listen({ host: apiConfig.host, port: apiConfig.port }).catch((error) => {
    server.log.error(error);
    process.exit(1);
  });
}
