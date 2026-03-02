import { useEffect, useState } from "react";
import { useAuth } from "../providers/AuthProvider";

export const LoginPage = () => {
  const { apiBaseUrl, authError, isChecking, login, setApiBaseUrl } = useAuth();
  const [draftApiBaseUrl, setDraftApiBaseUrl] = useState(apiBaseUrl);
  const [token, setToken] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setDraftApiBaseUrl(apiBaseUrl);
  }, [apiBaseUrl]);

  const handleSubmit = async () => {
    try {
      setSubmitError(null);
      await login(token);
      setToken("");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Login failed.");
    }
  };

  return (
    <main className="marketing-shell login-shell">
      <section className="login-card">
        <div>
          <p className="eyebrow">Protected Access</p>
          <h1>Sign in to DocManager</h1>
          <p className="hero-copy">
            This deployment now protects document APIs with a shared access token. Keep the token on your team only.
          </p>
        </div>

        <label className="field">
          Backend API base URL
          <input
            onChange={(event) => setDraftApiBaseUrl(event.target.value)}
            placeholder="/docmanager-api"
            value={draftApiBaseUrl}
          />
        </label>

        <div className="gallery-actions">
          <button className="secondary-button" onClick={() => setApiBaseUrl(draftApiBaseUrl)} type="button">
            Save backend URL
          </button>
        </div>

        <label className="field">
          Access token
          <input
            autoComplete="current-password"
            onChange={(event) => setToken(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleSubmit();
              }
            }}
            placeholder="Enter the shared DocManager token"
            type="password"
            value={token}
          />
        </label>

        <div className="gallery-actions">
          <button className="primary-button" disabled={isChecking} onClick={() => void handleSubmit()} type="button">
            {isChecking ? "Checking..." : "Unlock studio"}
          </button>
        </div>

        {submitError || authError ? (
          <div className="settings-row">
            <span>Access status</span>
            <strong>{submitError ?? authError}</strong>
          </div>
        ) : null}
      </section>
    </main>
  );
};
