import { Link } from "react-router-dom";

const featureCards = [
  "Two-row Word-style ribbon with tab-aware commands",
  "Gallery, autosave, page thumbnails, and chapter navigation",
  "Unicode master storage with Preeti and English variant sync design",
  "Planned backend hooks for translation, exports, and admin jobs"
];

export const HomePage = () => {
  return (
    <main className="marketing-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">DocManager Studio</p>
          <h1>Rich document editing for Nepali and multilingual workflows</h1>
          <p className="hero-copy">
            This scaffold gives you the editor shell, local persistence, ribbon layout, and deployment path for a
            GitHub Pages frontend while leaving room for backend-driven sync, translation, and export services.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/gallery">
              Open Gallery
            </Link>
            <Link className="secondary-button" to="/editor/doc-nepali-board">
              Launch Demo Editor
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <h2>Included now</h2>
          <ul className="feature-list">
            {featureCards.map((card) => (
              <li key={card}>{card}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
};
