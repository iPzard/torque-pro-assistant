/* app.jsx — root, screen routing, AppShell, tweaks */

const { useState, useEffect, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "units": "imperial",
  "density": "regular",
  "accent": "#ffb020"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const sessions = window.SESSIONS;

  const [route, setRoute] = useState({ name: "library" });
  // first-run flag (toggle empty state via Tweaks)
  const [showEmpty, setShowEmpty] = useState(false);
  const [importToast, setImportToast] = useState(null);

  // Apply theme to root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", t.theme);
    document.documentElement.setAttribute("data-density", t.density);
    document.documentElement.style.setProperty("--accent", t.accent);
  }, [t.theme, t.density, t.accent]);

  function go(r) { setRoute(r); }

  const navItems = [
    { route: { name: "library" },  icon: I.library, label: "Library", badge: sessions.length },
    { route: { name: "compare", ids: [sessions[0].meta.id, sessions[1].meta.id] }, icon: I.compare, label: "Compare", badge: "2" },
    { route: { name: "import" },   icon: I.import,  label: "Import", kbd: "⌘O" },
  ];

  return (
    <div className="app-shell">
      {/* Title bar */}
      <div className="app-titlebar">
        <div className="tb-traffic"><i/><i/><i/></div>
        <div className="tb-app-name">Torque<span className="accent">Pro</span> · Assistant</div>
        <span className="dim mono" style={{fontSize:11, marginLeft:6}}>v0.4.2</span>
        <div className="tb-spacer"/>
        <span className="pill"><i className="dot ok"/>Connected · 2019 AMG GT 53</span>
        <span className="pill mono">{sessions.reduce((a,s)=>a+s.data.length,0).toLocaleString()} rows indexed</span>
        <span className="kbd">⌘K</span>
      </div>

      {/* Sidebar */}
      <nav className="app-nav">
        <div className="nav-group-label">Workspace</div>
        {navItems.map((n, i) => (
          <button key={i} className={"nav-item" + (route.name === n.route.name ? " active" : "")}
                  onClick={() => go(n.route)}>
            <span className="ico">{n.icon}</span>
            <span>{n.label}</span>
            {n.badge != null && <span className="badge">{n.badge}</span>}
            {n.kbd && <span className="kbd">{n.kbd}</span>}
          </button>
        ))}

        <div className="nav-group-label">Recent sessions</div>
        {sessions.slice(0, 4).map((s) => (
          <button key={s.meta.id} className={"nav-item" + (route.name === "session" && route.id === s.meta.id ? " active" : "")}
                  onClick={() => go({ name: "session", id: s.meta.id })}>
            <span className="ico" style={{color:"var(--text-3)"}}>{I.session}</span>
            <span style={{flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{s.meta.name}</span>
            <span className="badge mono">{new Date(s.meta.startedAt).toLocaleDateString("en-US",{month:"numeric",day:"numeric"})}</span>
          </button>
        ))}

        <div style={{flex:1}}/>
        <div className="nav-group-label">Vehicle</div>
        <button className="nav-item">
          <span className="ico" style={{color:"var(--accent)"}}>{I.vehicle}</span>
          <span style={{flex:1, fontSize:12}}>2019 Mercedes-Benz AMG GT 53</span>
          {I.chevDown}
        </button>
        <button className="nav-item">
          <span className="ico">{I.settings}</span><span>Settings</span>
          <span className="kbd">⌘,</span>
        </button>
      </nav>

      {/* Main */}
      <div className="app-main">
        {showEmpty ? (
          <EmptyState onImport={() => { setShowEmpty(false); go({ name: "import" }); }} />
        ) : route.name === "library" ? (
          <LibraryScreen
            sessions={sessions}
            units={t.units}
            onOpen={(id) => go({ name: "session", id })}
            onCompare={(ids) => go({ name: "compare", ids })}
            onImport={() => go({ name: "import" })}
          />
        ) : route.name === "session" ? (
          <SessionScreen
            session={sessions.find((s) => s.meta.id === route.id)}
            units={t.units}
            onBack={() => go({ name: "library" })}
          />
        ) : route.name === "compare" ? (
          <CompareScreen
            sessions={sessions}
            sessionIds={route.ids}
            units={t.units}
            onAddSession={() => {
              const remaining = sessions.find((s) => !route.ids.includes(s.meta.id));
              if (remaining) go({ name: "compare", ids: [...route.ids, remaining.meta.id] });
            }}
            onRemove={(id) => go({ name: "compare", ids: route.ids.filter(x=>x!==id) })}
            onOpen={(id) => go({ name: "session", id })}
            onBack={() => go({ name: "library" })}
          />
        ) : route.name === "import" ? (
          <ImportScreen
            onCancel={() => go({ name: "library" })}
            onComplete={(name) => { setImportToast(name); go({ name: "library" }); setTimeout(() => setImportToast(null), 4000); }}
          />
        ) : null}

        {/* Status bar */}
        <div className="status-bar">
          <span>READY</span>
          <span>·</span>
          <span>{route.name === "session" ? `Session · ${route.id}` : route.name === "compare" ? `Compare · ${route.ids.length} sessions` : route.name === "import" ? "Import" : "Library"}</span>
          <span>·</span>
          <span>{t.units === "metric" ? "Metric" : "Imperial"} units</span>
          <div style={{flex:1}}/>
          {importToast && <span style={{color:"var(--ok)"}}>✓ Imported {importToast}</span>}
          <span>UTC-7</span>
          <span>·</span>
          <span>120 fps</span>
        </div>
      </div>

      {/* Tweaks */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Appearance">
          <TweakRadio label="Theme" value={t.theme} options={["dark", "light"]}
                      onChange={(v) => setTweak("theme", v)} />
          <TweakRadio label="Density" value={t.density} options={["compact", "regular", "comfy"]}
                      onChange={(v) => setTweak("density", v)} />
          <TweakColor label="Accent" value={t.accent}
                      options={["#ffb020", "#ff5a1f", "#6fd3f7", "#34d399", "#c084fc"]}
                      onChange={(v) => setTweak("accent", v)} />
        </TweakSection>
        <TweakSection label="Data">
          <TweakRadio label="Units" value={t.units} options={["imperial", "metric"]}
                      onChange={(v) => setTweak("units", v)} />
        </TweakSection>
        <TweakSection label="Demo">
          <TweakToggle label="First-run empty state" value={showEmpty} onChange={setShowEmpty} />
          <TweakButton label="Open import flow" onClick={() => go({ name: "import" })} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
