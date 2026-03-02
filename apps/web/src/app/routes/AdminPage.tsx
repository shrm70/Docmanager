import { useDocumentStore } from "../providers/DocumentStoreProvider";

export const AdminPage = () => {
  const { documents, syncAllDocuments, syncDocumentVariants } = useDocumentStore();

  return (
    <main className="marketing-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Variant sync and storage health</h1>
          <p className="hero-copy">
            This page simulates the admin-level sync button you described. In production, this button should enqueue
            background jobs instead of doing the work in the browser.
          </p>
        </div>
        <button className="primary-button" onClick={syncAllDocuments} type="button">
          Sync All Variants
        </button>
      </section>

      <section className="admin-grid">
        {documents.map((document) => (
          <article className="document-card" key={document.id}>
            <div className="document-card__header">
              <div>
                <h2>{document.title}</h2>
                <p>Master variant: {document.masterVariant}</p>
              </div>
            </div>

            <div className="variant-stack">
              {document.variants.map((variant) => (
                <div className="variant-card" key={variant.key}>
                  <div>
                    <strong>{variant.label}</strong>
                    <p>{variant.isStale ? "Stale after the latest master edit" : "Fresh and in sync"}</p>
                  </div>
                  <button className="secondary-button" onClick={() => syncDocumentVariants(document.id, variant.key)} type="button">
                    Sync
                  </button>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
};
