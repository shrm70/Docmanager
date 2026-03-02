import type { ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDocumentStore } from "../providers/DocumentStoreProvider";

export const GalleryPage = () => {
  const navigate = useNavigate();
  const { createDocument, deleteDocument, documents, error, importTextDocument, isLoading, storageMode } =
    useDocumentStore();

  const handleCreate = async () => {
    const document = await createDocument();
    navigate(`/editor/${document.id}`);
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const document = await importTextDocument(file);
    navigate(`/editor/${document.id}`);
    event.target.value = "";
  };

  return (
    <main className="marketing-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Gallery</p>
          <h1>Manage documents and open the studio</h1>
          <p className="hero-copy">
            Storage mode: <strong>{storageMode === "api" ? "Backend API" : "Browser local storage"}</strong>
          </p>
        </div>
        <div className="gallery-actions">
          <button className="primary-button" disabled={isLoading} onClick={() => void handleCreate()} type="button">
            New Document
          </button>
          <label className="secondary-button upload-button">
            Import Text
            <input accept=".txt,.md" onChange={handleImport} type="file" />
          </label>
        </div>
      </section>

      {error ? (
        <section className="settings-card">
          <div className="settings-row">
            <span>Connection status</span>
            <strong>{error}</strong>
          </div>
        </section>
      ) : null}

      <section className="gallery-grid">
        {!isLoading && documents.length === 0 ? (
          <article className="document-card">
            <div className="document-card__header">
              <div>
                <h2>No documents yet</h2>
                <p>Create a document or import a text file to start editing.</p>
              </div>
            </div>
          </article>
        ) : null}

        {documents.map((document) => (
          <article className="document-card" key={document.id}>
            <div className="document-card__header">
              <div>
                <h2>{document.title}</h2>
                <p>{document.description}</p>
              </div>
              <span className="pill">{document.masterVariant}</span>
            </div>

            <div className="document-card__meta">
              <span>{document.pages.length} pages</span>
              <span>{new Date(document.updatedAt).toLocaleString()}</span>
            </div>

            <div className="variant-row">
              {document.variants.map((variant) => (
                <span className={`variant-pill ${variant.isStale ? "variant-pill--stale" : ""}`} key={variant.key}>
                  {variant.label}
                </span>
              ))}
            </div>

            <div className="document-card__actions">
              <Link className="primary-button" to={`/editor/${document.id}`}>
                Open
              </Link>
              <button className="text-button" onClick={() => void deleteDocument(document.id)} type="button">
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
};
