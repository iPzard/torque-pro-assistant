/* app.jsx — root, screen routing, AppShell, tweaks */

const { useState, useEffect, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "units": "imperial",
  "density": "regular",
  "accent": "#ffb020",
  "vehicleConnected": false,
  "firstRun": true,
  "backendOffline": false,
  "importError": false,
  "permissionDenied": false,
  "malformedRow": false,
  "noGps": false,
  "notFound": false
}/*EDITMODE-END*/;

function NotFoundScreen({ routeId, onBack }) {
  return (
    <div className="page" data-screen-label="404">
      <div className="notfound">
        <div className="nf-code">404</div>
        <div className="nf-tag">Session not found</div>
        <h2>That session isn’t in your library</h2>
        <p>
          The link points at a session that has been deleted, moved to another vehicle profile, or never existed on this machine. Sessions are stored locally — deep links don’t survive a fresh install.
        </p>
        <div className="nf-trace">
          GET <span style={{color:"var(--text-1)"}}>/sessions/{routeId || "—"}</span>
          {"  →  "}
          <span style={{color:"var(--danger)"}}>404</span>
          <span style={{marginLeft:10, color:"var(--text-3)"}}>no row in <span className="mono" style={{color:"var(--text-2)"}}>~/Library/TorqueProAssistant/sessions.db</span></span>
        </div>
        <div className="nf-actions">
          <button className="btn primary" onClick={onBack}>{I.library}<span>Back to Library</span></button>
          <button className="btn">{I.import}<span>Import a CSV</span></button>
        </div>
      </div>
    </div>
  );
}

function NoVehicleScreen({ onAdd }) {
  const [picked, setPicked] = useState(null);
  const suggestions = [
    { name: "2019 Mercedes-Benz AMG GT 53", vin: "WDD2J6BB0KA…", source: "Detected via Bluetooth", recent: true },
    { name: "2021 Porsche 911 Carrera S",   vin: "WP0AB2A9XMS…", source: "Previously imported · 4 sessions", recent: false },
    { name: "2018 Honda Civic Si",          vin: "2HGFC3B53JH…", source: "Previously imported · 12 sessions", recent: false },
  ];
  const makes = ["Acura","Audi","BMW","Chevrolet","Dodge","Ford","Honda","Hyundai","Jeep","Lexus","Mazda","Mercedes-Benz","Mitsubishi","Nissan","Porsche","Subaru","Tesla","Toyota","Volkswagen","Volvo"];
  return (
    <div className="page" data-screen-label="No vehicle">
      <div className="page-h">
        <div>
          <h1>Select a vehicle</h1>
          <div className="sub">TorquePro Assistant needs a vehicle profile before it can decode logs. Pick one below or add a new one — you can switch any time.</div>
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"minmax(0, 1.4fr) minmax(0, 1fr)", gap:14}}>
        <div className="col" style={{gap: 14}}>
          <Card title="Add a vehicle" subtitle="manual entry">
            <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap: 10}}>
              <div>
                <div className="dim" style={{fontSize:10, letterSpacing:".08em", textTransform:"uppercase", marginBottom:4}}>Year</div>
                <select className="select" style={{width:"100%"}}>
                  <option>Year…</option>
                  {Array.from({length: 14}, (_, i) => 2026 - i).map((y) => <option key={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <div className="dim" style={{fontSize:10, letterSpacing:".08em", textTransform:"uppercase", marginBottom:4}}>Make</div>
                <select className="select" style={{width:"100%"}}>
                  <option>Make…</option>
                  {makes.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <div className="dim" style={{fontSize:10, letterSpacing:".08em", textTransform:"uppercase", marginBottom:4}}>Model</div>
                <select className="select" style={{width:"100%"}} disabled>
                  <option>Select make first…</option>
                </select>
              </div>
            </div>
            <div className="divider"/>
            <div className="dim" style={{fontSize:10, letterSpacing:".08em", textTransform:"uppercase", marginBottom:4}}>VIN <span style={{textTransform:"none", letterSpacing:0, color:"var(--text-3)", marginLeft:6}}>optional · enables auto-decode</span></div>
            <input className="input mono" placeholder="17-character VIN" style={{width:"100%", letterSpacing:".05em"}} />
            <div className="row" style={{marginTop:14, gap:8}}>
              <button className="btn primary" disabled style={{opacity:.5}}>{I.check}<span>Add vehicle</span></button>
              <button className="btn ghost">Import from OBD adapter</button>
              <div className="right"/>
              <span className="dim" style={{fontSize:11}}>or paste a sample VIN to autofill</span>
            </div>
          </Card>

          <Card title="Suggestions" subtitle="from nearby adapter & past imports">
            <div className="col" style={{gap: 8}}>
              {suggestions.map((s, i) => (
                <div key={i} onClick={() => setPicked(i)}
                     style={{display:"flex", alignItems:"center", gap:12, padding:"10px 12px",
                             border:"1px solid " + (picked===i ? "var(--accent-line)" : "var(--border)"),
                             background: picked===i ? "var(--accent-soft)" : "var(--bg-2)",
                             borderRadius: 8, cursor:"pointer"}}>
                  <span style={{width:28, height:28, borderRadius:6, background:"var(--bg-3)",
                                display:"inline-flex", alignItems:"center", justifyContent:"center",
                                color: s.recent ? "var(--accent)" : "var(--text-2)"}}>{I.vehicle}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:500, fontSize:13}}>{s.name}</div>
                    <div className="dim mono" style={{fontSize:11, marginTop:2}}>{s.vin} · {s.source}</div>
                  </div>
                  {s.recent && <span className="pill amber"><i className="dot"/>Live</span>}
                  <span className={"checkbox" + (picked===i ? " on" : "")} />
                </div>
              ))}
            </div>
            <div className="row" style={{marginTop:14}}>
              <button className="btn primary" disabled={picked==null} onClick={onAdd}>
                {I.check}<span>Use this vehicle</span>
              </button>
              <span className="dim" style={{fontSize:11, marginLeft:10}}>
                {picked != null ? `Selected: ${suggestions[picked].name}` : "Pick a vehicle to continue"}
              </span>
            </div>
          </Card>
        </div>

        <div className="col" style={{gap: 14}}>
          <Card>
            <div className="row" style={{gap:12, marginBottom:10}}>
              <span style={{display:"inline-flex", padding:10, borderRadius:10, background:"var(--accent-soft)", color:"var(--accent)"}}>{I.vehicle}</span>
              <div>
                <div style={{fontWeight:600, fontSize:14}}>Why we need a vehicle</div>
                <div className="dim" style={{fontSize:11, marginTop:2}}>It unlocks calibrated PIDs, units, and 0-60 detection.</div>
              </div>
            </div>
            <div className="col" style={{gap: 10, marginTop: 4}}>
              <BulletRow label="Decode manufacturer-specific PIDs" detail="Boost, AFR, oil temp, transmission temp" />
              <BulletRow label="Calibrate torque & horsepower" detail="Weight, drivetrain losses, redline" />
              <BulletRow label="Filter library by vehicle" detail="Sessions stay grouped per car" />
              <BulletRow label="Detect 0–60, ¼-mile, braking g" detail="Needs gear ratios + curb weight" />
            </div>
          </Card>

          <Card title="Status">
            <div className="col" style={{gap:10}}>
              <StatusRow label="Bluetooth adapter" value="OBD-II · ELM327 v1.5"
                pill={<span className="pill ok"><i className="dot"/>connected</span>} />
              <StatusRow label="VIN broadcast" value="WDD2J6BB0KA000000"
                pill={<span className="pill amber"><i className="dot"/>1 detected</span>} />
              <StatusRow label="Active profile" value="—"
                pill={<span className="pill warn"><i className="dot"/>none</span>} />
              <StatusRow label="Pending sessions" value="0 logs ready to parse"
                pill={<span className="pill"><i className="dot"/>idle</span>} last />
            </div>
          </Card>

          <div className="dim" style={{fontSize:11, textAlign:"center", padding:"4px 16px"}}>
            All vehicle profiles are stored locally. <a href="#" style={{color:"var(--text-1)"}}>Manage vehicles</a> · <a href="#" style={{color:"var(--text-1)"}}>Import .vprofile file</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function BulletRow({ label, detail }) {
  return (
    <div className="row" style={{gap:10, alignItems:"flex-start"}}>
      <span style={{flex:"0 0 18px", color:"var(--ok)", marginTop:1}}>{I.check}</span>
      <div style={{flex:1}}>
        <div style={{fontSize:12, color:"var(--text-0)"}}>{label}</div>
        <div className="dim" style={{fontSize:11, marginTop:2}}>{detail}</div>
      </div>
    </div>
  );
}
function StatusRow({ label, value, pill, last }) {
  return (
    <div style={{display:"flex", alignItems:"center", gap:10, paddingBottom: last?0:10, borderBottom: last?0:"1px solid var(--border)"}}>
      <div style={{flex:1}}>
        <div className="dim" style={{fontSize:10, letterSpacing:".08em", textTransform:"uppercase"}}>{label}</div>
        <div className="mono" style={{fontSize:12, marginTop:2, color:"var(--text-0)"}}>{value}</div>
      </div>
      {pill}
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const allSessions = window.SESSIONS;
  const sessions = t.firstRun ? [] : allSessions;

  const [route, setRoute] = useState({ name: t.firstRun ? "welcome" : "library" });
  // first-run flag (toggle empty state via Tweaks)
  const [showEmpty, setShowEmpty] = useState(false);

  // Backend-offline banner
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [retryCount, setRetryCount] = useState(3);
  useEffect(() => {
    if (!t.backendOffline || bannerDismissed) return;
    const i = setInterval(() => setRetryCount((c) => (c >= 10 ? 10 : c + 1)), 4000);
    return () => clearInterval(i);
  }, [t.backendOffline, bannerDismissed]);
  useEffect(() => { if (!t.backendOffline) { setBannerDismissed(false); setRetryCount(3); } }, [t.backendOffline]);
  const bannerVisible = t.backendOffline && !bannerDismissed;

  // Apply theme to root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", t.theme);
    document.documentElement.setAttribute("data-density", t.density);
    document.documentElement.style.setProperty("--accent", t.accent);
  }, [t.theme, t.density, t.accent]);

  function go(r) { setRoute(r); }

  const navItems = [
    { route: { name: "library" },  icon: I.library, label: "Library", badge: sessions.length || "0" },
    ...(sessions.length >= 2
      ? [{ route: { name: "compare", ids: [sessions[0].meta.id, sessions[1].meta.id] }, icon: I.compare, label: "Compare", badge: "2" }]
      : [{ route: { name: "compare", ids: [] }, icon: I.compare, label: "Compare", badge: sessions.length === 0 ? "—" : "0" }]),
    { route: { name: "import" },   icon: I.import,  label: "Import", kbd: "⌘O" },
  ];

  return (
    <div className={"app-shell" + (bannerVisible ? " has-banner" : "")}>
      {bannerVisible && (
        <div className="top-banner" role="status">
          <span className="pulse"/>
          <span className="banner-text">Backend unreachable</span>
          <span className="banner-meta">
            — retrying… ({retryCount}/10) · last attempt at {new Date().toLocaleTimeString([], {hour12:false}).slice(0,8)} · some live features paused
          </span>
          <span className="banner-spacer"/>
          <button className="banner-btn" onClick={() => { setRetryCount(1); window.toast && window.toast.info("Retrying backend\u2026", { subtitle: "127.0.0.1:5000 / /api/health" }); }}>
            {I.reset}<span>Retry now</span>
          </button>
          <button className="banner-close" onClick={() => setBannerDismissed(true)} aria-label="Dismiss">{I.cross}</button>
        </div>
      )}
      {/* Title bar */}
      <div className="app-titlebar">
        <div className="tb-traffic"><i/><i/><i/></div>
        <div className="tb-app-name">Torque<span className="accent">Pro</span> · Assistant</div>
        <span className="dim mono" style={{fontSize:11, marginLeft:6}}>v0.4.2</span>
        <div className="tb-spacer"/>
        {t.vehicleConnected
          ? <span className="pill"><i className="dot ok"/>Connected · 2019 AMG GT 53</span>
          : <button className="pill warn" style={{cursor:"pointer", border:"1px solid var(--border)"}} onClick={() => window.openAdapterPairing()}><i className="dot"/>No vehicle selected · Connect adapter</button>}
        <span className="pill mono">{sessions.reduce((a,s)=>a+s.data.length,0).toLocaleString()} rows {sessions.length === 0 ? "" : "indexed"}</span>
        <span className="kbd">⌘K</span>
      </div>

      {/* Sidebar */}
      <nav className="app-nav">
        <div className="nav-group-label">Workspace</div>
        {navItems.map((n, i) => (
          <button key={i} className={"nav-item" + (n.route && route.name === n.route.name ? " active" : "")}
                  disabled={n.disabled}
                  style={n.disabled ? {opacity:.4, cursor:"not-allowed"} : null}
                  onClick={() => n.route && go(n.route)}>
            <span className="ico">{n.icon}</span>
            <span>{n.label}</span>
            {n.badge != null && <span className="badge">{n.badge}</span>}
            {n.kbd && <span className="kbd">{n.kbd}</span>}
          </button>
        ))}

        <div className="nav-group-label">Recent sessions</div>
        {sessions.length === 0 ? (
          <div style={{padding: "6px 12px 4px", fontSize: 11, color: "var(--text-3)", fontStyle: "italic", lineHeight: 1.5}}>
            No sessions yet. <a href="#" onClick={(e) => { e.preventDefault(); go({ name: "import" }); }} style={{color:"var(--text-1)"}}>Import one</a> to get started.
          </div>
        ) : sessions.slice(0, 4).map((s) => (
          <button key={s.meta.id} className={"nav-item" + (route.name === "session" && route.id === s.meta.id ? " active" : "")}
                  onClick={() => go({ name: "session", id: s.meta.id })}>
            <span className="ico" style={{color:"var(--text-3)"}}>{I.session}</span>
            <span style={{flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{s.meta.name}</span>
            <span className="badge mono">{new Date(s.meta.startedAt).toLocaleDateString("en-US",{month:"numeric",day:"numeric"})}</span>
          </button>
        ))}

        <div style={{flex:1}}/>
        <div className="nav-group-label">Vehicle</div>
        {t.vehicleConnected ? (
          <button className="nav-item">
            <span className="ico" style={{color:"var(--accent)"}}>{I.vehicle}</span>
            <span style={{flex:1, fontSize:12}}>2019 Mercedes-Benz AMG GT 53</span>
            {I.chevDown}
          </button>
        ) : (
          <button className="nav-item" onClick={() => go({ name: "no-vehicle" })}>
            <span className="ico" style={{color:"var(--text-3)", borderRadius:50, border:"1px dashed var(--border-strong)", width:18, height:18, display:"inline-flex", alignItems:"center", justifyContent:"center"}}>{I.plus}</span>
            <span style={{flex:1, fontSize:12, color:"var(--text-2)", fontStyle:"italic"}}>Select vehicle…</span>
          </button>
        )}
        <button className="nav-item" onClick={() => go({ name: "settings" })}>
          <span className="ico">{I.settings}</span><span>Settings</span>
          <span className="kbd">⌘,</span>
        </button>
      </nav>

      {/* Main */}
      <div className="app-main">
        {route.name === "settings" ? (
          <SettingsScreen
            t={t} setTweak={setTweak}
            sessions={allSessions}
            onAddVehicle={() => go({ name: "no-vehicle" })}
          />
        ) : t.firstRun && route.name === "welcome" ? (
          <WelcomeScreen
            onStart={() => go({ name: "no-vehicle" })}
            onSkip={() => go({ name: "library" })}
          />
        ) : t.firstRun && route.name === "no-vehicle" ? (
          <FirstRunNoVehicle onSkipToWelcome={() => go({ name: "welcome" })} />
        ) : t.firstRun && route.name === "library" ? (
          <EmptyState onImport={() => go({ name: "import" })} />
        ) : !t.vehicleConnected ? (
          <NoVehicleScreen onAdd={() => setTweak("vehicleConnected", true)} />
        ) : showEmpty ? (
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
          (() => {
            const found = sessions.find((s) => s.meta.id === route.id);
            if (!found || t.notFound) {
              return (
                <NotFoundScreen
                  routeId={t.notFound ? "01J9PA-MISSING-SESSION-XX" : route.id}
                  onBack={() => { setTweak("notFound", false); go({ name: "library" }); }}
                />
              );
            }
            return (
              <SessionScreen
                session={t.noGps ? { ...found, data: found.data.map((r) => ({ ...r, lat: 0, lon: 0 })) } : found}
                units={t.units}
                onBack={() => go({ name: "library" })}
              />
            );
          })()
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
            onImport={() => go({ name: "import" })}
            onPick={(ids) => go({ name: "compare", ids })}
          />
        ) : route.name === "import" ? (
          <ImportScreen
            errorMode={t.importError}
            permissionDenied={t.permissionDenied}
            malformedRow={t.malformedRow}
            onCancel={() => go({ name: "library" })}
            onComplete={(name) => {
              go({ name: "library" });
              window.toast.success("Imported " + name, {
                subtitle: "2,418 rows · 67 columns · 12.8 MB",
                action: { label: "View", onClick: () => {
                  const s = window.SESSIONS[0];
                  if (s) go({ name: "session", id: s.meta.id });
                }},
              });
            }}
          />
        ) : null}

        <ToastHost />
        <AdapterPairingHost />

        {/* Status bar */}
        <div className="status-bar">
          <span>READY</span>
          <span>·</span>
          <span>{route.name === "session" ? `Session · ${route.id}` : route.name === "compare" ? `Compare · ${route.ids.length} sessions` : route.name === "import" ? "Import" : "Library"}</span>
          <span>·</span>
          <span>{t.units === "metric" ? "Metric" : "Imperial"} units</span>
          <div style={{flex:1}}/>
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
                      onChange={(v) => {
                        setTweak("units", v);
                        window.toast.info("Switched to " + v + " units", {
                          subtitle: v === "metric" ? "Speed in km/h, distance in km, temps in °C." : "Speed in mph, distance in mi, temps in °F.",
                        });
                      }} />
        </TweakSection>
        <TweakSection label="Adapter pairing">
          <TweakButton label="Open: Scan" onClick={() => window.openAdapterPairing("scan")} />
          <TweakButton label="Open: Pair" onClick={() => window.openAdapterPairing("pair")} />
          <TweakButton label="Open: Probe" onClick={() => window.openAdapterPairing("probe")} />
          <TweakButton label="Open: Done" onClick={() => window.openAdapterPairing("done")} />
          <TweakButton label="Fail: No adapters found" onClick={() => window.openAdapterPairing("no-adapters")} />
          <TweakButton label="Fail: Pairing failed" onClick={() => window.openAdapterPairing("failed")} />
          <TweakButton label="Fail: No protocol response" onClick={() => window.openAdapterPairing("no-protocol")} />
        </TweakSection>
        <TweakSection label="Compare states">
          <TweakButton label="Compare: 0 picked" onClick={() => go({ name: "compare", ids: [] })} />
          <TweakButton label="Compare: 1 picked" onClick={() => go({ name: "compare", ids: sessions[0] ? [sessions[0].meta.id] : [] })} />
          <TweakButton label="Compare: 2 picked (live)" onClick={() => go({ name: "compare", ids: sessions.slice(0,2).map(s=>s.meta.id) })} />
        </TweakSection>
        <TweakSection label="Error states">
          <TweakToggle label="Backend offline banner" value={t.backendOffline} onChange={(v) => setTweak("backendOffline", v)} />
          <TweakToggle label="Import: parse failure" value={t.importError} onChange={(v) => { setTweak("importError", v); if (v) go({ name: "import" }); }} />
          <TweakToggle label="Import: permission denied" value={t.permissionDenied} onChange={(v) => { setTweak("permissionDenied", v); if (v) go({ name: "import" }); }} />
          <TweakToggle label="Import: malformed-row row" value={t.malformedRow} onChange={(v) => setTweak("malformedRow", v)} />
          <TweakToggle label="Session: no GPS data" value={t.noGps} onChange={(v) => { setTweak("noGps", v); if (v && sessions[0]) go({ name: "session", id: sessions[0].meta.id }); }} />
          <TweakToggle label="Session: 404 not found" value={t.notFound} onChange={(v) => { setTweak("notFound", v); if (v) go({ name: "session", id: "missing-xx" }); }} />
        </TweakSection>
        <TweakSection label="Notifications">
          <TweakButton label="Success toast" onClick={() => window.toast.success("Imported drive.csv", { subtitle: "2,418 rows · 67 columns · 12.8 MB", action: { label: "View", onClick: () => {} } })} />
          <TweakButton label="Info toast" onClick={() => window.toast.info("Switched to metric units", { subtitle: "Speed in km/h, distance in km, temps in °C." })} />
          <TweakButton label="Warning toast" onClick={() => window.toast.warning("Hybrid PIDs detected but empty", { subtitle: "4 columns hidden from the session view — re-enable in Settings → Columns." })} />
          <TweakButton label="Error toast" onClick={() => window.toast.error("Failed to parse drive.csv", { subtitle: "Row 42 is malformed (expected 67 columns, got 58).", duration: 6000, action: { label: "Retry", onClick: () => {} } })} />
        </TweakSection>
        <TweakSection label="Demo">
          <TweakToggle label="First run (brand new)" value={t.firstRun} onChange={(v) => { setTweak("firstRun", v); go({ name: v ? "welcome" : "library" }); }} />
          <TweakToggle label="Vehicle connected" value={t.vehicleConnected} onChange={(v) => setTweak("vehicleConnected", v)} />
          <TweakToggle label="Library empty state" value={showEmpty} onChange={setShowEmpty} />
          <TweakButton label="Open import flow" onClick={() => go({ name: "import" })} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
