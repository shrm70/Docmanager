import { useDocumentStore } from "../providers/DocumentStoreProvider";

export const AdminPage = () => {
  const { documents, error, jobs, refreshDocuments, refreshJobs, storageMode, syncAllDocuments, syncDocumentVariants } =
    useDocumentStore();
  const staleVariantCount = documents.reduce(
    (count, document) => count + document.variants.filter((variant) => variant.isStale).length,
    0
  );

  return (
    <main className="marketing-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Variant sync and storage health</h1>
          <p className="hero-copy">
            Admin sync now queues real background jobs when the backend API is connected. The worker processes those
            jobs and updates each document variant asynchronously.
          </p>
        </div>
        <div className="gallery-actions">
          <button className="secondary-button" onClick={() => void refreshDocuments()} type="button">
            Refresh Documents
          </button>
          <button className="secondary-button" onClick={() => void refreshJobs()} type="button">
            Refresh Jobs
          </button>
          <button className="primary-button" onClick={() => void syncAllDocuments()} type="button">
            Sync All Variants
          </button>
        </div>
      </section>

      <section className="gallery-grid">
        <article className="document-card">
          <div className="document-card__header">
            <div>
              <h2>Storage mode</h2>
              <p>{storageMode === "api" ? "Backend API connected" : "Browser local storage only"}</p>
            </div>
            <span className="pill">{storageMode}</span>
          </div>
        </article>

        <article className="document-card">
          <div className="document-card__header">
            <div>
              <h2>Queued jobs</h2>
              <p>{jobs.length} total worker jobs tracked</p>
            </div>
            <span className="pill">{jobs.filter((job) => job.status !== "completed").length} active</span>
          </div>
        </article>

        <article className="document-card">
          <div className="document-card__header">
            <div>
              <h2>Stale variants</h2>
              <p>Documents that still need translation or Preeti sync</p>
            </div>
            <span className={`variant-pill ${staleVariantCount > 0 ? "variant-pill--stale" : ""}`}>{staleVariantCount}</span>
          </div>
        </article>
      </section>

      {error ? (
        <section className="settings-card">
          <div className="settings-row">
            <span>Connection status</span>
            <strong>{error}</strong>
          </div>
        </section>
      ) : null}

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
                  <button
                    className="secondary-button"
                    onClick={() => void syncDocumentVariants(document.id, variant.key)}
                    type="button"
                  >
                    Sync
                  </button>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="settings-card">
        <div className="document-card__header">
          <div>
            <h2>Worker jobs</h2>
            <p>Queued, running, completed, and failed sync operations.</p>
          </div>
        </div>

        <div className="variant-stack">
          {jobs.length === 0 ? <p className="empty-note">No jobs are recorded yet.</p> : null}
          {jobs.map((job) => (
            <div className="variant-card" key={job.id}>
              <div>
                <strong>{job.type}</strong>
                <p>
                  {job.status} | {new Date(job.updatedAt).toLocaleString()}
                </p>
                <p>{typeof job.error === "string" ? job.error : `Document ${String(job.payload.documentId ?? "unknown")}`}</p>
              </div>
              <span className="pill">{job.status}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};
