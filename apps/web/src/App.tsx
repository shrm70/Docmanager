import { HashRouter, Navigate, NavLink, Route, Routes } from "react-router-dom";
import "./App.css";
import { AuthProvider, useAuth } from "./app/providers/AuthProvider";
import { DocumentStoreProvider } from "./app/providers/DocumentStoreProvider";
import { AdminPage } from "./app/routes/AdminPage";
import { EditorPage } from "./app/routes/EditorPage";
import { GalleryPage } from "./app/routes/GalleryPage";
import { HomePage } from "./app/routes/HomePage";
import { LoginPage } from "./app/routes/LoginPage";
import { SettingsPage } from "./app/routes/SettingsPage";

const ProtectedApp = () => {
  const { authRequired, isAuthenticated, isChecking, logout } = useAuth();

  if (isChecking) {
    return (
      <main className="marketing-shell login-shell">
        <section className="login-card">
          <p className="eyebrow">DocManager</p>
          <h1>Checking access...</h1>
        </section>
      </main>
    );
  }

  if (authRequired && !isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <DocumentStoreProvider>
      <div className="app-frame">
        <nav className="app-nav">
          <div className="brand-lockup">
            <span className="brand-lockup__mark">DM</span>
            <div>
              <strong>DocManager</strong>
              <p>Document Studio Scaffold</p>
            </div>
          </div>

          <div className="app-nav__links">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/gallery">Gallery</NavLink>
            <NavLink to="/admin">Admin</NavLink>
            <NavLink to="/settings">Settings</NavLink>
            {authRequired ? (
              <button className="app-nav__button" onClick={logout} type="button">
                Sign out
              </button>
            ) : null}
          </div>
        </nav>

        <Routes>
          <Route element={<HomePage />} path="/" />
          <Route element={<GalleryPage />} path="/gallery" />
          <Route element={<EditorPage />} path="/editor/:documentId" />
          <Route element={<AdminPage />} path="/admin" />
          <Route element={<SettingsPage />} path="/settings" />
          <Route element={<Navigate replace to="/" />} path="*" />
        </Routes>
      </div>
    </DocumentStoreProvider>
  );
};

const App = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <ProtectedApp />
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
