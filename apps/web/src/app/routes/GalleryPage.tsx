import type { ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDocumentStore } from "../providers/DocumentStoreProvider";

export const GalleryPage = () => {
  const navigate = useNavigate();
  const { documents, createDocument, deleteDocument, importTextDocument } = useDocumentStore();

  const handleCreate = () => {
    const document = createDocument();
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
          <h1>Manage local documents and open the studio</h1>
        </div>
        <div className="gallery-actions">
          <button className="primary-button" onClick={handleCreate} type="button">
            New Document
          </button>
          <label className="secondary-button upload-button">
            Import Text
            <input accept=".txt,.md" onChange={handleImport} type="file" />
          </label>
        </div>
      </section>

      <section className="gallery-grid">
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
              <button className="text-button" onClick={() => deleteDocument(document.id)} type="button">
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
};
