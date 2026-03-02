import { HashRouter, Navigate, NavLink, Route, Routes } from "react-router-dom";
import "./App.css";
import { DocumentStoreProvider } from "./app/providers/DocumentStoreProvider";
import { AdminPage } from "./app/routes/AdminPage";
import { EditorPage } from "./app/routes/EditorPage";
import { GalleryPage } from "./app/routes/GalleryPage";
import { HomePage } from "./app/routes/HomePage";
import { SettingsPage } from "./app/routes/SettingsPage";

const App = () => {
  return (
    <HashRouter>
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
    </HashRouter>
  );
};

export default App;
