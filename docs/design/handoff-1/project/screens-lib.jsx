/* screens-lib.jsx — Library, Import flow, Empty state */

const { useState, useEffect, useMemo, useRef } = React;

function LibraryScreen({ sessions, units, onOpen, onCompare, onImport }) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [selected, setSelected] = useState(new Set());

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = sessions.map((s) => ({
      session: s,
      summary: window.summarize(s),
    }));
    if (q) arr = arr.filter(({ session }) =>
      session.meta.name.toLowerCase().includes(q) ||
      session.meta.notes.toLowerCase().includes(q) ||
      session.meta.fileName.toLowerCase().includes(q));
    arr.sort((a, b) => {
      if (sortBy === "date") return b.session.meta.startedAt.localeCompare(a.session.meta.startedAt);
      if (sortBy === "duration") return b.session.meta.duration - a.session.meta.duration;
      if (sortBy === "distance") return b.summary.dist - a.summary.dist;
      if (sortBy === "speed") return b.summary.maxSpeed - a.summary.maxSpeed;
      return 0;
    });
    return arr;
  }, [sessions, query, sortBy]);

  function toggle(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  return (
    <div className="page" data-screen-label="Library">
      <div className="page-h">
        <div>
          <h1>Library</h1>
          <div className="sub">{sessions.length} sessions · {window.fmtFileSize(sessions.reduce((a,s)=>a+s.meta.fileSize,0))} on disk</div>
        </div>
        <div className="row">
          {selected.size >= 2 && (
            <button className="btn" onClick={() => onCompare([...selected])}>
              {I.compare}<span>Compare {selected.size}</span>
            </button>
          )}
          <button className="btn primary" onClick={onImport}>
            {I.plus}<span>Import CSV</span>
            <span className="kbd" style={{marginLeft:6, color:"#1a1200", borderColor:"rgba(0,0,0,.15)", background:"rgba(0,0,0,.08)"}}>⌘O</span>
          </button>
        </div>
      </div>

      <div className="toolbar">
        <input className="input search" placeholder="Search sessions…" style={{width: 260}}
               value={query} onChange={(e)=>setQuery(e.target.value)} />
        <div className="sep" />
        <button className="btn ghost sm">{I.filter}<span>Date range</span><span className="dim">All time</span>{I.chevDown}</button>
        <button className="btn ghost sm">{I.vehicle}<span>Vehicle</span><span className="dim">2019 AMG GT 53</span>{I.chevDown}</button>
        <div className="sep" />
        <span className="muted" style={{fontSize:11}}>Sort by</span>
        <select className="select" value={sortBy} onChange={(e)=>setSortBy(e.target.value)}>
          <option value="date">Date · newest</option>
          <option value="duration">Duration</option>
          <option value="distance">Distance</option>
          <option value="speed">Max speed</option>
        </select>
        <div className="right" />
        <span className="pill ok"><i className="dot"/>{selected.size} selected</span>
      </div>

      <Card flush>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{width: 30}}></th>
              <th style={{width: 240}}>Session</th>
              <th>Date</th>
              <th>Duration</th>
              <th className="num">Distance</th>
              <th className="num">Max speed</th>
              <th className="num">Peak HP</th>
              <th className="num">0–60</th>
              <th>Vehicle</th>
              <th className="num">Size</th>
              <th style={{width: 240}}>Profile</th>
              <th style={{width: 30}}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ session, summary }) => {
              const m = session.meta;
              const isSel = selected.has(m.id);
              return (
                <tr key={m.id} className={isSel ? "sel" : ""}>
                  <td>
                    <span className={"checkbox" + (isSel ? " on" : "")}
                          onClick={(e) => { e.stopPropagation(); toggle(m.id); }} />
                  </td>
                  <td>
                    <div style={{display:"flex", flexDirection:"column", gap:2, cursor:"pointer"}} onClick={() => onOpen(m.id)}>
                      <div style={{fontWeight:500, color:"var(--text-0)"}}>{m.name}</div>
                      <div className="dim mono" style={{fontSize:11}}>{m.fileName}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{display:"flex", flexDirection:"column", gap:2}}>
                      <div>{window.fmtDate(m.startedAt)}</div>
                      <div className="dim mono" style={{fontSize:11}}>{window.fmtTime(m.startedAt)}</div>
                    </div>
                  </td>
                  <td className="mono">{window.fmtDuration(m.duration)}</td>
                  <td className="num">{summary.dist.toFixed(1)} <span className="dim">{units==="metric"?"km":"mi"}</span></td>
                  <td className="num">{Math.round(units==="metric" ? summary.maxSpeed*1.60934 : summary.maxSpeed)} <span className="dim">{units==="metric"?"km/h":"mph"}</span></td>
                  <td className="num">{Math.round(summary.peakHp)}</td>
                  <td className="num">{summary.t0to60 ? summary.t0to60.toFixed(1)+"s" : "—"}</td>
                  <td>{m.vehicle.year} {m.vehicle.make} {m.vehicle.model}</td>
                  <td className="num dim">{window.fmtFileSize(m.fileSize)}</td>
                  <td>
                    <Sparkline data={session.data} getY={(r)=>r.speed_mph} color="var(--d-speed)" width={210} height={26} />
                  </td>
                  <td>
                    <button className="btn ghost icon sm" onClick={(e) => e.stopPropagation()}>{I.more}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <div className="section-title">Recently driven</div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:12}}>
        {rows.slice(0, 3).map(({ session, summary }) => (
          <RecentCard key={session.meta.id} session={session} summary={summary} units={units} onOpen={() => onOpen(session.meta.id)} />
        ))}
      </div>
    </div>
  );
}

function RecentCard({ session, summary, units, onOpen }) {
  const m = session.meta;
  return (
    <div className="card" style={{cursor:"pointer", overflow:"hidden"}} onClick={onOpen}>
      <div style={{padding:"12px 14px 6px"}}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <div className="dim mono" style={{fontSize:10, letterSpacing:".1em", textTransform:"uppercase"}}>
            {window.fmtDate(m.startedAt)} · {window.fmtTime(m.startedAt)}
          </div>
          <span className="pill amber"><i className="dot"/>{m.vehicle.year} AMG GT 53</span>
        </div>
        <div style={{fontWeight:600, fontSize:14, marginTop:6}}>{m.name}</div>
      </div>
      <div style={{padding:"6px 14px"}}>
        <Sparkline data={session.data} getY={(r)=>r.speed_mph} color="var(--d-speed)" width={250} height={36} fill />
      </div>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", borderTop:"1px solid var(--border)"}}>
        <KV label="Dist" v={`${summary.dist.toFixed(1)} ${units==="metric"?"km":"mi"}`} />
        <KV label="Max" v={`${Math.round(units==="metric" ? summary.maxSpeed*1.60934 : summary.maxSpeed)} ${units==="metric"?"km/h":"mph"}`} />
        <KV label="0–60" v={summary.t0to60 ? summary.t0to60.toFixed(1)+"s" : "—"} last />
      </div>
    </div>
  );
}
function KV({ label, v, last }) {
  return (
    <div style={{padding:"10px 12px", borderRight: last? 0 : "1px solid var(--border)"}}>
      <div className="dim" style={{fontSize:10, letterSpacing:".08em", textTransform:"uppercase"}}>{label}</div>
      <div className="mono" style={{fontSize:14, marginTop:2}}>{v}</div>
    </div>
  );
}

// ── Empty state for first-run ───────────────────────────────────────────────
function EmptyState({ onImport }) {
  return (
    <div className="page" data-screen-label="Empty">
      <div className="empty">
        <div style={{display:"inline-flex", padding:14, borderRadius:14, background:"var(--accent-soft)", color:"var(--accent)"}}>
          {I.upload}
        </div>
        <h3>No sessions yet</h3>
        <p>Drop a Torque Pro CSV here to get started, or pick one from your computer.<br/>
        We parse on-device — your logs never leave the machine.</p>
        <div style={{marginTop: 18, display:"inline-flex", gap:8}}>
          <button className="btn primary" onClick={onImport}>{I.plus}<span>Import CSV</span></button>
          <button className="btn ghost">View sample session</button>
        </div>
      </div>
    </div>
  );
}

// ── Import flow ─────────────────────────────────────────────────────────────
function ImportScreen({ onCancel, onComplete }) {
  const [stage, setStage] = useState("drop");        // drop | parsing | preview
  const [over, setOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filename, setFilename] = useState("");

  function startParse(name = "trackLog-20260510-093412.csv") {
    setFilename(name);
    setStage("parsing");
    setProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p = Math.min(100, p + 8 + Math.random() * 14);
      setProgress(p);
      if (p >= 100) { clearInterval(t); setTimeout(() => setStage("preview"), 300); }
    }, 110);
  }

  return (
    <div className="page" data-screen-label="Import">
      <div className="page-h">
        <div>
          <h1>Import session</h1>
          <div className="sub">Drop a Torque Pro CSV export, or pick one from disk. Parsing happens locally.</div>
        </div>
        <button className="btn ghost" onClick={onCancel}>{I.cross}<span>Cancel</span></button>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"minmax(0, 2fr) minmax(0, 1fr)", gap:14}}>
        <div className="col" style={{gap: 14}}>
          {stage === "drop" && (
            <div className={"dropzone" + (over ? " over" : "")}
                 onDragOver={(e)=>{e.preventDefault(); setOver(true);}}
                 onDragLeave={()=>setOver(false)}
                 onDrop={(e)=>{e.preventDefault(); setOver(false); startParse();}}>
              <div style={{display:"inline-flex", padding:18, borderRadius:50, background:"var(--accent-soft)", color:"var(--accent)"}}>
                {I.upload}
              </div>
              <h3 style={{marginTop:18, fontSize:18}}>Drop CSV here</h3>
              <p className="muted" style={{marginTop:6}}>or click to browse — supports the standard Torque Pro export format.</p>
              <div style={{marginTop:18, display:"inline-flex", gap:8}}>
                <button className="btn primary" onClick={() => startParse()}>{I.plus}<span>Browse files…</span></button>
                <button className="btn ghost" onClick={() => startParse()}>Use sample CSV</button>
              </div>
              <div className="dim" style={{marginTop:18, fontSize:11}}>Accepted: <span className="mono">.csv</span> · up to 200 MB · Torque Pro v1.10.x exports</div>
            </div>
          )}

          {stage === "parsing" && (
            <Card title="Parsing" subtitle={filename}>
              <div className="mono dim" style={{fontSize:12, marginBottom:8}}>
                {Math.round(progress)}% · reading rows
              </div>
              <div style={{height: 8, background:"var(--bg-3)", borderRadius:4, overflow:"hidden"}}>
                <div style={{height:"100%", width: `${progress}%`, background:"var(--accent)", transition:"width .15s"}} />
              </div>
              <div className="row" style={{marginTop:12, gap:18, fontFamily:"var(--font-mono)", fontSize:11, color:"var(--text-2)"}}>
                <span>Rows: {Math.round(progress * 24)}</span>
                <span>Columns detected: 67</span>
                <span>Decoder: UTF-8</span>
                <span>Memory: {Math.round(progress*0.18)} MB</span>
              </div>
            </Card>
          )}

          {stage === "preview" && (
            <Card title="Preview" subtitle={`${filename} · 2,418 rows · 67 columns`} actions={
              <>
                <button className="btn ghost sm" onClick={onCancel}>Cancel</button>
                <button className="btn primary sm" onClick={() => onComplete(filename)}>{I.check}<span>Import session</span></button>
              </>
            }>
              <div style={{overflow:"auto", maxHeight: 280}}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>GPS Time</th>
                      <th className="num">Speed</th>
                      <th className="num">RPM</th>
                      <th className="num">Throttle</th>
                      <th className="num">Boost</th>
                      <th className="num">AFR</th>
                      <th className="num">Coolant</th>
                      <th className="num">Lat</th>
                      <th className="num">Lon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({length:8}, (_, i) => (
                      <tr key={i}>
                        <td className="mono dim">10-May-2026 09:34:{String(12+i).padStart(2,"0")}</td>
                        <td className="num">{[0,0,3,9,18,28,42,55][i]}</td>
                        <td className="num">{[820,820,1180,1640,2240,2810,3340,3680][i]}</td>
                        <td className="num">{[4,4,18,32,46,52,38,30][i]}%</td>
                        <td className="num">{[-7.8,-7.6,-3.2,1.4,7.9,11.4,8.6,5.1][i]}</td>
                        <td className="num">{[14.7,14.7,14.7,14.5,13.8,12.9,13.4,14.1][i]}</td>
                        <td className="num">{[82,84,89,98,114,128,141,155][i]}</td>
                        <td className="num mono dim">37.4419{i}</td>
                        <td className="num mono dim">-122.1430{i}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        <div className="col" style={{gap: 14}}>
          <Card title="Detected columns" subtitle="67 PIDs">
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, fontSize:12}}>
              {[
                ["GPS Time","ok"],["Device Time","ok"],["Longitude","ok"],["Latitude","ok"],
                ["Speed (OBD)","ok"],["GPS Speed","ok"],["Engine RPM","ok"],["Throttle Position","ok"],
                ["Coolant Temp","ok"],["Oil Temp","ok"],["Trans Temp","ok"],["Intake Air Temp","ok"],
                ["Turbo Boost","ok"],["AFR Commanded","ok"],["AFR Measured","ok"],["MAF Rate","ok"],
                ["Horsepower","ok"],["Torque","ok"],["Engine Load","ok"],["Volumetric Eff.","ok"],
                ["Hybrid Battery","empty"],["State of Health","empty"],["System Battery V","empty"],["Battery Current","empty"],
              ].map(([n, status]) => (
                <div key={n} style={{display:"flex", alignItems:"center", gap:6, padding:"4px 8px", borderRadius:4, background:"var(--bg-2)"}}>
                  <span style={{width:6, height:6, borderRadius:50, background: status==="ok" ? "var(--ok)" : "var(--text-3)"}}/>
                  <span style={{flex:1, fontFamily:"var(--font-mono)", fontSize:11, color: status==="ok" ? "var(--text-1)" : "var(--text-3)"}}>{n}</span>
                </div>
              ))}
            </div>
            <div className="divider"/>
            <div className="row" style={{justifyContent:"space-between"}}>
              <span className="muted">All required PIDs detected</span>
              <span className="pill ok"><i className="dot"/>61 valid · 6 empty</span>
            </div>
          </Card>

          <Card title="Validation">
            <div className="col" style={{gap:8}}>
              <ValRow ok label="GPS coordinates present" detail="2,418 / 2,418 rows" />
              <ValRow ok label="Time series is monotonic" detail="No backwards jumps" />
              <ValRow ok label="No malformed rows" detail="Encoding: UTF-8" />
              <ValRow warn label="Hybrid PIDs are empty" detail="Expected for non-hybrid vehicles — 4 columns will be hidden" />
              <ValRow ok label="Vehicle identified" detail="2019 Mercedes-Benz AMG GT 53 · matched VIN prefix" />
            </div>
          </Card>

          <Card title="Session details">
            <div className="col" style={{gap:10, fontSize:12}}>
              <Field label="Name" v={<input className="input" defaultValue="Friday morning drive" style={{width:"100%"}}/>} />
              <Field label="Vehicle" v={<select className="select" style={{width:"100%"}}><option>2019 Mercedes-Benz AMG GT 53</option><option>+ Add new vehicle…</option></select>} />
              <Field label="Notes" v={<textarea className="input" rows={2} style={{width:"100%", height:54, padding:8, resize:"none"}} placeholder="Optional context — tune, conditions, route…" />} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ValRow({ ok, warn, label, detail }) {
  const color = ok ? "var(--ok)" : warn ? "var(--warn)" : "var(--danger)";
  return (
    <div style={{display:"flex", gap:10, alignItems:"flex-start", padding:"6px 0"}}>
      <span style={{flex:"0 0 18px", color, marginTop: 1}}>{ok ? I.check : I.warn}</span>
      <div style={{flex:1}}>
        <div style={{fontSize:12, color:"var(--text-0)"}}>{label}</div>
        <div className="dim" style={{fontSize:11, marginTop:2}}>{detail}</div>
      </div>
    </div>
  );
}
function Field({ label, v }) {
  return (
    <div>
      <div className="dim" style={{fontSize:10, letterSpacing:".08em", textTransform:"uppercase", marginBottom:4}}>{label}</div>
      {v}
    </div>
  );
}

Object.assign(window, { LibraryScreen, EmptyState, ImportScreen });
