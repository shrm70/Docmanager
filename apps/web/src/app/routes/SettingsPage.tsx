const settings = [
  ["Frontend host", "GitHub Pages at /Docmanager/"],
  ["Canonical master", "Unicode by default for Nepali content"],
  ["Translation", "Backend-only provider calls with protected API keys"],
  ["Local autosave", "Browser localStorage in this scaffold"],
  ["Future persistence", "Database + object storage + worker queues"]
];

export const SettingsPage = () => {
  return (
    <main className="marketing-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Environment and architecture defaults</h1>
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
    </main>
  );
};
