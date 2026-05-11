/* screens-settings.jsx — Settings page */

const { useState: useSetState } = React;

function SettingsScreen({ t, setTweak, onAddVehicle, sessions }) {
  const [vehicles, setVehicles] = useSetState([
    { id: "v1", year: 2019, make: "Mercedes-Benz", model: "AMG GT 53", vin: "WDD2J6BB0KA000000", active: true,  sessions: 7,  added: "Apr 14, 2026" },
    { id: "v2", year: 2021, make: "Porsche",       model: "911 Carrera S", vin: "WP0AB2A9XMS000000", active: false, sessions: 4,  added: "Mar 02, 2026" },
    { id: "v3", year: 2018, make: "Honda",         model: "Civic Si",      vin: "2HGFC3B53JH000000", active: false, sessions: 12, added: "Nov 18, 2025" },
  ]);
  const [copied, setCopied] = useSetState(false);
  const [bindAddr, setBindAddr] = useSetState("127.0.0.1");
  const port = 7842; // mock electronAPI.getPort()
  const uploadUrl = `http://192.168.1.42:${port}/upload`;

  const setActive = (id) => setVehicles(vehicles.map(v => ({ ...v, active: v.id === id })));
  const removeVeh = (id) => setVehicles(vehicles.filter(v => v.id !== id));
  const totalSize = sessions.reduce((a, s) => a + s.meta.fileSize, 0);
  const totalRows = sessions.reduce((a, s) => a + s.data.length, 0);

  function copyUrl() {
    if (navigator.clipboard) navigator.clipboard.writeText(uploadUrl).catch(()=>{});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="page" data-screen-label="Settings" style={{maxWidth: 880}}>
      <div className="page-h">
        <div>
          <h1>Settings</h1>
          <div className="sub">Preferences, vehicles, storage, and network. All changes save instantly.</div>
        </div>
        <div className="dim mono" style={{fontSize:11}}>~/Library/Application Support/TorquePro</div>
      </div>

      {/* ── Appearance ───────────────────────────────────────────────────── */}
      <div className="section-title">Appearance</div>
      <Card title="Theme & display" subtitle="instrument-cluster defaults">
        <SettingRow label="Theme" detail="Dark is recommended for night sessions.">
          <SegBtn value={t.theme} options={["dark","light"]} onChange={(v) => setTweak("theme", v)} />
        </SettingRow>
        <SettingRow label="Density" detail="Compact fits ~30% more rows per screen.">
          <SegBtn value={t.density} options={["compact","regular","comfy"]} onChange={(v) => setTweak("density", v)} />
        </SettingRow>
        <SettingRow label="Accent color" detail="Used on the active nav rail, primary buttons, and chart cursors." last>
          <div className="row" style={{gap: 8}}>
            {[
              { c: "#ffb020", name: "Amber" },
              { c: "#ff5a1f", name: "Orange" },
              { c: "#6fd3f7", name: "Cyan" },
              { c: "#34d399", name: "Green" },
              { c: "#c084fc", name: "Violet" },
            ].map((s) => (
              <button key={s.c} onClick={() => setTweak("accent", s.c)} title={s.name}
                      style={{width: 28, height: 28, borderRadius: 6, padding: 0,
                              border: t.accent === s.c ? "2px solid var(--text-0)" : "1px solid var(--border)",
                              background: s.c, cursor: "pointer",
                              boxShadow: t.accent === s.c ? `0 0 0 3px ${s.c}33` : "none"}} />
            ))}
          </div>
        </SettingRow>
      </Card>

      {/* ── Units ────────────────────────────────────────────────────────── */}
      <div className="section-title">Units</div>
      <Card title="Measurement system" subtitle="affects every chart, table, and export">
        <SettingRow label="Speed, temperature, pressure"
                    detail={t.units === "imperial" ? "Showing mph · °F · psi" : "Showing km/h · °C · kPa"}
                    last>
          <SegBtn value={t.units} options={[
            { value: "imperial", label: "Imperial" },
            { value: "metric",   label: "Metric"   },
          ]} onChange={(v) => setTweak("units", v)} wide />
        </SettingRow>
      </Card>

      {/* ── Vehicles ─────────────────────────────────────────────────────── */}
      <div className="section-title">Vehicles</div>
      <Card title={`Saved vehicles`} subtitle={`${vehicles.length} total · 1 active`}
            actions={
              <>
                <button className="btn ghost sm">{I.upload}<span>Import .vprofile</span></button>
                <button className="btn ghost sm">{I.download}<span>Export all</span></button>
                <button className="btn primary sm" onClick={onAddVehicle}>{I.plus}<span>Add vehicle</span></button>
              </>
            } flush>
        {vehicles.length === 0 ? (
          <div style={{padding: "32px 20px", textAlign: "center"}}>
            <div className="dim" style={{fontSize: 12, marginBottom: 12}}>No vehicles saved yet.</div>
            <button className="btn primary sm" onClick={onAddVehicle}>{I.plus}<span>Add your first vehicle</span></button>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{width: 24}}></th>
                <th>Vehicle</th>
                <th>VIN</th>
                <th className="num">Sessions</th>
                <th>Added</th>
                <th style={{width: 160}}></th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td>
                    {v.active && <span style={{display:"inline-block", width: 8, height: 8, borderRadius: 50, background: "var(--accent)", boxShadow: "0 0 0 3px var(--accent-soft)"}}/>}
                  </td>
                  <td>
                    <div style={{display:"flex", flexDirection:"column", gap:2}}>
                      <div style={{fontWeight: 500}}>{v.year} {v.make} {v.model}</div>
                      {v.active && <div className="mono" style={{fontSize:10, color:"var(--accent)", letterSpacing:".06em"}}>ACTIVE PROFILE</div>}
                    </div>
                  </td>
                  <td className="mono dim" style={{fontSize:11}}>{v.vin}</td>
                  <td className="num mono">{v.sessions}</td>
                  <td className="dim">{v.added}</td>
                  <td>
                    <div className="row" style={{gap:6, justifyContent:"flex-end"}}>
                      {!v.active && <button className="btn ghost sm" onClick={() => setActive(v.id)}>Set active</button>}
                      <button className="btn ghost icon sm" title="Edit">{I.settings}</button>
                      <button className="btn ghost icon sm" title="Delete"
                              onClick={() => removeVeh(v.id)}
                              style={{color:"var(--danger)"}}>{I.trash}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* ── Data ─────────────────────────────────────────────────────────── */}
      <div className="section-title">Data</div>
      <Card title="Library storage" subtitle="local, on-device">
        <SettingRow label="Storage location" detail="Click to reveal in Finder. Path is OS-managed; relocating requires app restart.">
          <div className="row" style={{gap: 6}}>
            <code className="mono" style={{padding:"5px 10px", background:"var(--bg-2)", border:"1px solid var(--border)", borderRadius: 6, fontSize: 11, color:"var(--text-1)"}}>~/Library/Application Support/TorquePro/library.db</code>
            <button className="btn ghost icon sm" title="Reveal">{I.session}</button>
          </div>
        </SettingRow>
        <SettingRow label="Sessions on disk" detail={`${totalRows.toLocaleString()} rows across ${sessions.length} sessions.`}>
          <span className="pill mono"><i className="dot ok"/>{window.fmtFileSize(totalSize)}</span>
        </SettingRow>
        <SettingRow label="Export library" detail="Bundle every session + metadata into a single .tplog archive.">
          <button className="btn">{I.download}<span>Export .tplog</span></button>
        </SettingRow>
        <SettingRow label="Clear all sessions" detail="Permanently delete every imported session. Vehicles and preferences are kept. This cannot be undone." last>
          <button className="btn" style={{background:"rgba(255,90,90,.1)", borderColor:"rgba(255,90,90,.4)", color:"var(--danger)"}}>
            {I.trash}<span>Clear sessions…</span>
          </button>
        </SettingRow>
      </Card>

      {/* ── Network ──────────────────────────────────────────────────────── */}
      <div className="section-title">Network</div>
      <Card title="Live-capture endpoint" subtitle="Phase J · experimental"
            actions={<span className="pill amber"><i className="dot"/>preview</span>}>
        <SettingRow label="Backend port"
                    detail="The local Flask service that receives live PID frames from your phone. Assigned dynamically at startup.">
          <div className="row" style={{gap: 6}}>
            <code className="mono" style={{padding:"5px 10px", background:"var(--bg-2)", border:"1px solid var(--border)", borderRadius: 6, fontSize: 12, color:"var(--text-0)", minWidth: 64, textAlign:"center"}}>:{port}</code>
            <span className="pill ok mono"><i className="dot"/>listening</span>
          </div>
        </SettingRow>

        <SettingRow label="Bind address"
                    detail={bindAddr === "127.0.0.1"
                      ? "Localhost only — your phone must be on the same machine via USB tether."
                      : "0.0.0.0 binds all interfaces — your phone can post over Wi-Fi. Make sure your network is trusted."}>
          <select className="select" value={bindAddr} onChange={(e) => setBindAddr(e.target.value)} style={{width: 220}}>
            <option value="127.0.0.1">127.0.0.1 — localhost only</option>
            <option value="0.0.0.0">0.0.0.0 — all interfaces (LAN)</option>
          </select>
        </SettingRow>

        <SettingRow label="Torque Pro upload URL"
                    detail="Paste this into Torque Pro → Settings → Data Logging & Upload → Webserver URL on your phone."
                    last>
          <div className="row" style={{gap: 6, width: "100%"}}>
            <input className="input mono" readOnly value={uploadUrl}
                   onFocus={(e) => e.target.select()}
                   style={{flex: 1, fontSize: 11, color:"var(--text-0)"}} />
            <button className={"btn" + (copied ? " primary" : "")} onClick={copyUrl} style={{minWidth: 88}}>
              {copied ? (<>{I.check}<span>Copied</span></>) : (<>{I.download}<span>Copy</span></>)}
            </button>
          </div>
        </SettingRow>
      </Card>

      {/* ── About ────────────────────────────────────────────────────────── */}
      <div className="section-title">About</div>
      <Card>
        <div style={{display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 16, alignItems: "center"}}>
          <div style={{display:"inline-flex", padding: 14, borderRadius: 12, background: "var(--accent-soft)", color: "var(--accent)", border:"1px solid var(--accent-line)"}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 7v5l3.5 2"/>
              <path d="M19.5 8.5 18 9.5M4.5 8.5 6 9.5M19.5 15.5 18 14.5M4.5 15.5 6 14.5"/>
            </svg>
          </div>
          <div>
            <div style={{fontSize: 15, fontWeight: 600}}>TorquePro Assistant</div>
            <div className="dim mono" style={{fontSize: 11, marginTop: 3}}>v0.4.2 · build 20260509.1 · darwin-arm64</div>
            <div className="dim" style={{fontSize: 11, marginTop: 6}}>Released under the MIT License. Not affiliated with Torque Pro or Ian Hawkins.</div>
          </div>
          <div className="row" style={{gap: 6}}>
            <button className="btn ghost sm">Check for updates</button>
          </div>
        </div>
        <div className="divider"/>
        <div className="row" style={{gap: 6, flexWrap: "wrap"}}>
          <button className="btn ghost sm">Documentation</button>
          <button className="btn ghost sm">Release notes</button>
          <button className="btn ghost sm">Source · GitHub</button>
          <button className="btn ghost sm">Report a bug</button>
          <button className="btn ghost sm">Open log folder</button>
          <div className="right"/>
          <span className="dim" style={{fontSize: 11}}>© 2026 TorquePro Assistant contributors</span>
        </div>
      </Card>
    </div>
  );
}

function SettingRow({ label, detail, children, last }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) auto",
      gap: 24, alignItems: "center",
      padding: "14px 0",
      borderBottom: last ? 0 : "1px solid var(--border)"
    }}>
      <div>
        <div style={{fontSize: 13, fontWeight: 500, color: "var(--text-0)"}}>{label}</div>
        {detail && <div className="dim" style={{fontSize: 11, marginTop: 3, lineHeight: 1.5, maxWidth: 480}}>{detail}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

// Inline segmented control — matches in-page style (not the Tweaks panel one)
function SegBtn({ value, options, onChange, wide }) {
  const opts = options.map((o) => typeof o === "object" ? o : { value: o, label: o });
  return (
    <div style={{
      display: "inline-flex",
      padding: 2, gap: 0,
      background: "var(--bg-2)",
      border: "1px solid var(--border)",
      borderRadius: 7,
    }}>
      {opts.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)}
                  style={{
                    height: 26, padding: wide ? "0 18px" : "0 12px",
                    background: on ? "var(--bg-3)" : "transparent",
                    border: 0,
                    borderRadius: 5,
                    color: on ? "var(--text-0)" : "var(--text-2)",
                    fontSize: 12, fontWeight: 500,
                    textTransform: "capitalize",
                    cursor: "pointer",
                    boxShadow: on ? "inset 0 0 0 1px var(--border-strong)" : "none",
                  }}>{o.label}</button>
        );
      })}
    </div>
  );
}

Object.assign(window, { SettingsScreen });
