/* screens-vehicle.jsx — Vehicle detail page (/vehicles/:id) */

const { useState: useVState, useMemo: useVMemo } = React;

const DEFAULT_VEHICLES = [
  {
    id: "v1", year: 2019, make: "Mercedes-Benz", model: "AMG GT 53",
    vin: "WDD2J6BB0KA000000", active: true, lastUsed: "2026-04-14T19:32:00",
    curbWeightLb: 4630, drivetrain: "AWD", redlineRpm: 7000,
    displacementL: 3.0, transmission: "AT9",
    sessions: [
      { id: "s_2026_04_14_19", name: "Friday morning drive",    date: "2026-04-14T07:08:00", dist: 24.3, peakHp: 423 },
      { id: "s_2026_04_11_15", name: "Tail of the Dragon run",   date: "2026-04-11T11:14:00", dist: 41.0, peakHp: 437 },
      { id: "s_2026_04_05_08", name: "Pre-track shakedown",      date: "2026-04-05T16:45:00", dist:  8.6, peakHp: 411 },
      { id: "s_2026_03_22_19", name: "Highway commute",          date: "2026-03-22T18:02:00", dist: 18.7, peakHp: 312 },
      { id: "s_2026_03_19_11", name: "Datalog · cold start",     date: "2026-03-19T07:50:00", dist:  3.1, peakHp: 188 },
    ],
    calibrations: [
      { pid: "0x0B", label: "Boost",          op: "−", amount: 0.5, unit: "psi", note: "Manifold sensor reads ~0.5 psi high at idle." },
      { pid: "0x05", label: "Coolant temp",   op: "+", amount: 2,   unit: "°F",  note: "Replacement sensor under-reads by ~2°F." },
    ],
  },
  { id: "v2", year: 2021, make: "Porsche",     model: "911 Carrera S", vin: "WP0AB2A9XMS000000", active: false, lastUsed: "2026-03-02T14:20:00",
    curbWeightLb: 3382, drivetrain: "RWD", redlineRpm: 7500, displacementL: 3.0, transmission: "PDK", sessions: [], calibrations: [] },
  { id: "v3", year: 2018, make: "Honda",       model: "Civic Si",      vin: "2HGFC3B53JH000000", active: false, lastUsed: "2025-11-18T18:42:00",
    curbWeightLb: 2906, drivetrain: "FWD", redlineRpm: 7000, displacementL: 1.5, transmission: "M6", sessions: [], calibrations: [] },
];

function VehicleDetailScreen({ vehicleId, t, units, onBack, onOpenLibrary, onOpenSession }) {
  const v0 = DEFAULT_VEHICLES.find((x) => x.id === vehicleId) || DEFAULT_VEHICLES[0];
  const [v, setV] = useVState(v0);
  const [editing, setEditing] = useVState(false);
  const [confirmDel, setConfirmDel] = useVState(false);
  const set = (k, val) => setV({ ...v, [k]: val });

  // calibrations
  const [cals, setCals] = useVState(v0.calibrations);
  const addCal = () => setCals([...cals, { pid: "", label: "", op: "−", amount: 0, unit: "", note: "" }]);
  const updCal = (i, k, val) => setCals(cals.map((c, j) => j === i ? { ...c, [k]: val } : c));
  const delCal = (i) => setCals(cals.filter((_, j) => j !== i));

  const curbDisplay = units === "metric"
    ? Math.round(v.curbWeightLb / 2.2046) + " kg"
    : v.curbWeightLb.toLocaleString() + " lb";
  const displDisplay = v.displacementL.toFixed(1) + " L · " + Math.round(v.displacementL * 61.024) + " ci";
  const transLabels = { AT9: "9-speed automatic", PDK: "8-speed dual-clutch (PDK)", M6: "6-speed manual",
                        AT8: "8-speed automatic", DCT: "Dual-clutch (DCT)", CVT: "CVT" };

  return (
    <div className="page" data-screen-label="Vehicle detail">
      <div className="page-h" style={{alignItems:"flex-start"}}>
        <div style={{minWidth:0, flex:1}}>
          <div className="row" style={{gap:8, marginBottom:6}}>
            <button className="btn ghost sm" onClick={onBack}><span style={{transform:"rotate(180deg)", display:"inline-flex"}}>{I.chevRight}</span><span>Settings</span></button>
            <span className="dim" style={{fontSize:11}}>/ vehicles / <span className="mono" style={{color:"var(--text-1)"}}>{v.id}</span></span>
          </div>
          <div className="row" style={{gap:12, alignItems:"center"}}>
            <h1 style={{margin:0}}>{v.year} {v.make} {v.model}</h1>
            {v.active && <span className="pill amber"><i className="dot"/>Active vehicle</span>}
          </div>
          <div className="sub mono" style={{marginTop:6}}>
            VIN <span style={{color:"var(--text-1)"}}>{v.vin}</span>
            <span className="dim"> · last used </span>
            <span style={{color:"var(--text-1)"}}>{window.fmtDate ? window.fmtDate(v.lastUsed) : v.lastUsed.slice(0,10)} · {window.fmtTime ? window.fmtTime(v.lastUsed) : v.lastUsed.slice(11,16)}</span>
            <span className="dim"> · profile {v.id}.vprofile</span>
          </div>
        </div>
        <div className="row" style={{gap:8, marginTop:4}}>
          {editing
            ? (<>
                <button className="btn ghost" onClick={() => { setV(v0); setCals(v0.calibrations); setEditing(false); }}>{I.cross}<span>Cancel</span></button>
                <button className="btn primary" onClick={() => setEditing(false)}>{I.check}<span>Save changes</span></button>
              </>)
            : (<>
                <button className="btn" onClick={() => setEditing(true)}>{I.settings}<span>Edit</span></button>
                <button className="btn" onClick={() => setConfirmDel(true)}
                        style={{background:"rgba(255,90,90,.08)", borderColor:"rgba(255,90,90,.32)", color:"var(--danger)"}}>
                  {I.trash}<span>Delete vehicle</span>
                </button>
              </>)}
        </div>
      </div>

      {/* ── Specs ────────────────────────────────────────────────────────── */}
      <div className="section-title">Specifications</div>
      <Card title="Vehicle specs" subtitle="Used by summarize() for 0–60, peak HP and torque estimates.">
        <SettingRow label="Curb weight" detail="Affects 0–60 modelling and dyno HP from acceleration.">
          {editing ? (
            <div className="row" style={{gap:6}}>
              <input className="input mono" value={v.curbWeightLb}
                     onChange={(e) => set("curbWeightLb", Number(e.target.value) || 0)}
                     style={{width:120, textAlign:"right"}}/>
              <span className="dim" style={{fontSize:12}}>{units === "metric" ? "lb · stored" : "lb"}</span>
            </div>
          ) : <span className="mono" style={{color:"var(--text-1)"}}>{curbDisplay}</span>}
        </SettingRow>

        <SettingRow label="Drivetrain" detail="Used to convert wheel HP to crank HP and weight-shift modelling.">
          {editing
            ? <SegBtn value={v.drivetrain} options={[{value:"AWD",label:"AWD"},{value:"FWD",label:"FWD"},{value:"RWD",label:"RWD"}]}
                      onChange={(val) => set("drivetrain", val)} />
            : <span className="pill"><i className="dot"/>{v.drivetrain}</span>}
        </SettingRow>

        <SettingRow label="Redline" detail="Charts annotate this line on the RPM axis. Above redline, fuel-cut events are flagged.">
          {editing
            ? <div className="row" style={{gap:6}}>
                <input className="input mono" value={v.redlineRpm}
                       onChange={(e) => set("redlineRpm", Number(e.target.value) || 0)}
                       style={{width:120, textAlign:"right"}}/>
                <span className="dim" style={{fontSize:12}}>rpm</span>
              </div>
            : <span className="mono" style={{color:"var(--text-1)"}}>{v.redlineRpm.toLocaleString()} rpm</span>}
        </SettingRow>

        <SettingRow label="Displacement" detail="Used with VE estimates for mass airflow when MAF PID is absent.">
          {editing
            ? <div className="row" style={{gap:6}}>
                <input className="input mono" value={v.displacementL}
                       onChange={(e) => set("displacementL", parseFloat(e.target.value) || 0)}
                       style={{width:120, textAlign:"right"}}/>
                <span className="dim" style={{fontSize:12}}>L</span>
              </div>
            : <span className="mono" style={{color:"var(--text-1)"}}>{displDisplay}</span>}
        </SettingRow>

        <SettingRow label="Transmission" detail="Auto / manual changes shift-detection heuristics on the RPM trace." last>
          {editing
            ? <select className="select" value={v.transmission} onChange={(e) => set("transmission", e.target.value)} style={{width: 240}}>
                <option value="AT9">9-speed automatic (AT9)</option>
                <option value="AT8">8-speed automatic (AT8)</option>
                <option value="PDK">8-speed dual-clutch (PDK)</option>
                <option value="DCT">Dual-clutch (DCT)</option>
                <option value="M6">6-speed manual (M6)</option>
                <option value="CVT">CVT</option>
              </select>
            : <span style={{color:"var(--text-1)"}}>{transLabels[v.transmission] || v.transmission}</span>}
        </SettingRow>
      </Card>

      {/* ── Calibration overrides ─────────────────────────────────────────── */}
      <div className="section-title">Calibration overrides</div>
      <Card title={`Per-PID calibration${cals.length ? ` · ${cals.length} active` : ""}`}
            subtitle="Compensate for sensor drift, replacement parts, or known ECU quirks."
            actions={cals.length > 0 && <span className="pill amber mono"><i className="dot"/>{cals.length} override{cals.length===1?"":"s"}</span>}
            flush>
        {cals.length === 0 && !editing && (
          <div style={{padding:"22px 16px", textAlign:"center"}}>
            <div className="dim" style={{fontSize:13, lineHeight: 1.55, maxWidth: 420, margin:"0 auto"}}>
              No overrides yet. Calibrations let you correct a known sensor offset — e.g. <span className="mono" style={{color:"var(--text-1)"}}>actual = sensor − 0.5 psi</span>.
            </div>
            <button className="btn sm" style={{marginTop:14}} onClick={() => { setEditing(true); addCal(); }}>
              {I.plus}<span>Add first override</span>
            </button>
          </div>
        )}

        {cals.length > 0 && (
          <table className="tbl cal-tbl">
            <thead>
              <tr>
                <th style={{width: 90}}>PID</th>
                <th>Channel</th>
                <th style={{width: 220}}>Formula</th>
                <th>Note</th>
                {editing && <th style={{width: 36}}></th>}
              </tr>
            </thead>
            <tbody>
              {cals.map((c, i) => (
                <tr key={i}>
                  <td className="mono">
                    {editing
                      ? <input className="input mono" value={c.pid} onChange={(e) => updCal(i, "pid", e.target.value)} style={{width:80}} placeholder="0x0B"/>
                      : c.pid}
                  </td>
                  <td>
                    {editing
                      ? <input className="input" value={c.label} onChange={(e) => updCal(i, "label", e.target.value)} style={{width:"100%"}} placeholder="Boost"/>
                      : c.label}
                  </td>
                  <td className="mono">
                    {editing ? (
                      <div className="row" style={{gap:4}}>
                        <span className="dim">actual =</span>
                        <span>sensor</span>
                        <select className="select sm" value={c.op} onChange={(e) => updCal(i, "op", e.target.value)} style={{width:42, padding:"3px 4px"}}>
                          <option value="−">−</option><option value="+">+</option><option value="×">×</option>
                        </select>
                        <input className="input mono" value={c.amount} onChange={(e) => updCal(i, "amount", parseFloat(e.target.value) || 0)} style={{width:56}}/>
                        <input className="input mono" value={c.unit} onChange={(e) => updCal(i, "unit", e.target.value)} style={{width:48}} placeholder="psi"/>
                      </div>
                    ) : (
                      <span><span className="dim">actual =</span> sensor {c.op} {c.amount} {c.unit}</span>
                    )}
                  </td>
                  <td className="dim" style={{fontSize:11}}>
                    {editing
                      ? <input className="input" value={c.note} onChange={(e) => updCal(i, "note", e.target.value)} style={{width:"100%", fontSize:11}}/>
                      : c.note || <span style={{color:"var(--text-3)"}}>—</span>}
                  </td>
                  {editing && (
                    <td>
                      <button className="btn ghost icon sm" onClick={() => delCal(i)} aria-label="Remove">{I.cross}</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {editing && (
          <div style={{padding:"10px 14px", borderTop: cals.length ? "1px solid var(--border)" : 0,
                       display:"flex", alignItems:"center", gap:10, background:"var(--bg-1)"}}>
            <button className="btn sm" onClick={addCal}>{I.plus}<span>Add override row</span></button>
            <span className="dim" style={{fontSize:11}}>Applied to every session imported with this vehicle. Existing sessions are not retroactively rewritten.</span>
          </div>
        )}
      </Card>

      {/* ── Sessions logged with this vehicle ─────────────────────────────── */}
      <div className="section-title">Sessions logged with this vehicle</div>
      <Card title={`${v.sessions.length} session${v.sessions.length===1?"":"s"}`}
            subtitle={v.sessions.length > 0 ? "Most recent 5 shown — open Library to see the rest." : "Import a CSV and pick this vehicle to start filling this list."}
            actions={v.sessions.length > 0 && <button className="btn ghost sm" onClick={() => onOpenLibrary && onOpenLibrary(v.id)}>{I.library}<span>Open in Library</span></button>}
            flush>
        {v.sessions.length === 0 ? (
          <div style={{padding:"22px 16px", textAlign:"center"}}>
            <div className="dim" style={{fontSize:13}}>No sessions logged yet for this vehicle.</div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Session</th>
                <th>Date</th>
                <th className="num">Distance</th>
                <th className="num">Peak HP</th>
                <th style={{width: 40}}></th>
              </tr>
            </thead>
            <tbody>
              {v.sessions.map((s) => (
                <tr key={s.id} className="cal-clickable" onClick={() => onOpenSession && onOpenSession(s.id)}>
                  <td>{s.name}</td>
                  <td className="mono dim" style={{fontSize:11}}>{s.date.slice(0,10)} · {s.date.slice(11,16)}</td>
                  <td className="num mono">{s.dist.toFixed(1)} {units === "metric" ? "km" : "mi"}</td>
                  <td className="num mono">{s.peakHp} hp</td>
                  <td>{I.chevRight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* ── Profile export ────────────────────────────────────────────────── */}
      <div className="section-title">Profile export</div>
      <Card title="Portable vehicle profile" subtitle="Bundle specs + calibrations into a single file that another TorquePro install can import.">
        <SettingRow label="Export as .vprofile" detail="Includes year/make/model, VIN, specs above, and every calibration override. Sessions are not included." last>
          <div className="row" style={{gap:6}}>
            <code className="mono" style={{padding:"5px 10px", background:"var(--bg-2)", border:"1px solid var(--border)", borderRadius: 6, fontSize: 11, color:"var(--text-1)"}}>{v.year}-{v.make.toLowerCase().replace(/\s+/g,"-")}-{v.model.toLowerCase().replace(/\s+/g,"-")}.vprofile</code>
            <button className="btn primary">{I.download}<span>Export .vprofile</span></button>
          </div>
        </SettingRow>
      </Card>

      {confirmDel && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setConfirmDel(false)}>
          <div className="modal" style={{width: 460}}>
            <div className="modal-h">
              <span className="icon-circle" style={{background:"rgba(255,90,90,.12)", color:"var(--danger)", borderColor:"rgba(255,90,90,.32)"}}>{I.trash}</span>
              <div>
                <div className="title">Delete this vehicle?</div>
                <div className="sub">
                  <span style={{color:"var(--text-1)"}}>"{v.year} {v.make} {v.model}"</span> will be removed from your library along with {cals.length} calibration override{cals.length===1?"":"s"}.
                  Sessions logged against this vehicle stay on disk but lose their vehicle assignment.
                </div>
              </div>
            </div>
            <div className="modal-f">
              <button className="btn ghost" onClick={() => setConfirmDel(false)}>Cancel</button>
              <div className="right"/>
              <button className="btn" style={{background:"var(--danger)", borderColor:"var(--danger)", color:"#fff"}}
                      onClick={() => { setConfirmDel(false); onBack(); }}>{I.trash}<span>Delete vehicle</span></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { VehicleDetailScreen, DEFAULT_VEHICLES });
