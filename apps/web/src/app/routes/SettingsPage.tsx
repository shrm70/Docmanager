import { useEffect, useState } from "react";
import { useDocumentStore } from "../providers/DocumentStoreProvider";

const settings = [
  ["Frontend host", "GitHub Pages at /Docmanager/"],
  ["Canonical master", "Unicode by default for Nepali content"],
  ["Translation", "Backend-only provider calls with protected API keys"],
  ["Autosave fallback", "Browser localStorage when the backend is unavailable"],
  ["Future persistence", "Database + object storage + worker queues"]
];

export const SettingsPage = () => {
  const { apiBaseUrl, error, setApiBaseUrl, storageMode } = useDocumentStore();
  const [draftApiBaseUrl, setDraftApiBaseUrl] = useState(apiBaseUrl);

  useEffect(() => {
    setDraftApiBaseUrl(apiBaseUrl);
  }, [apiBaseUrl]);

  return (
    <main className="marketing-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Environment and architecture defaults</h1>
          <p className="hero-copy">
            Configure the backend URL here when you want the GitHub Pages frontend to use the live API and worker.
          </p>
        </div>
      </section>

      <section className="settings-card">
        {settings.map(([label, value]) => (
          <div className="settings-row" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>

      <section className="settings-card">
        <div className="settings-row">
          <span>Current storage mode</span>
          <strong>{storageMode}</strong>
        </div>
        <div className="settings-row">
          <span>Backend API base URL</span>
          <strong>{apiBaseUrl || "Not configured"}</strong>
        </div>
        <label className="field">
          API base URL
          <input
            onChange={(event) => setDraftApiBaseUrl(event.target.value)}
            placeholder="https://your-api-host.example.com"
            value={draftApiBaseUrl}
          />
        </label>
        <div className="gallery-actions">
          <button className="primary-button" onClick={() => setApiBaseUrl(draftApiBaseUrl)} type="button">
            Save and reconnect
          </button>
          <button className="secondary-button" onClick={() => setApiBaseUrl("")} type="button">
            Use local storage only
          </button>
        </div>
        {error ? (
          <div className="settings-row">
            <span>Connection status</span>
            <strong>{error}</strong>
          </div>
        ) : null}
      </section>
    </main>
  );
};
