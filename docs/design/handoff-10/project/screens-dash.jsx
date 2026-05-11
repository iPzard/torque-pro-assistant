/* screens-dash.jsx — Session detail dashboard + Compare view */

const { useState, useEffect, useMemo, useRef } = React;

// ── Session Dashboard ───────────────────────────────────────────────────────
function SessionScreen({ session, units, onBack }) {
  const [tab, setTab] = useState("overview");
  const [cursor, setCursor] = useState(null);
  const [brushRange, setBrushRange] = useState([0, session.data.length - 1]);
  const [pidDrawer, setPidDrawer] = useState(false);
  const [selectedPids, setSelectedPids] = useState([
    "rpm", "speed_mph", "throttle", "boost_psi", "coolant_f", "afr_meas",
  ]);

  const summary = useMemo(() => window.summarize(session), [session]);
  const m = session.meta;

  return (
    <div className="page" data-screen-label="Session" style={{padding: "0 0 24px"}}>
      {/* Session header */}
      <div style={{padding: "16px 24px 0", display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:16}}>
        <div>
          <div className="row" style={{gap:8, marginBottom:6}}>
            <button className="btn ghost sm" onClick={onBack}>{I.chevRight && <span style={{transform:"rotate(180deg)", display:"inline-flex"}}>{I.chevRight}</span>}<span>Library</span></button>
            <span className="dim mono" style={{fontSize:11}}>/ {m.id}</span>
          </div>
          <h1 style={{fontSize:22, margin:0, fontWeight:600}}>{m.name}</h1>
          <div className="row dim" style={{gap:14, marginTop:6, fontSize:12}}>
            <span>{window.fmtDate(m.startedAt)} · {window.fmtTime(m.startedAt)}</span>
            <span>·</span>
            <span>{m.vehicle.year} {m.vehicle.make} {m.vehicle.model}</span>
            <span>·</span>
            <span className="mono">{window.fmtDuration(m.duration)}</span>
            <span>·</span>
            <span className="mono">{summary.dist.toFixed(1)} {units==="metric"?"km":"mi"}</span>
            <span>·</span>
            <span className="mono">{m.fileName}</span>
          </div>
        </div>
        <div className="row" style={{gap:8}}>
          <button className="btn ghost sm">{I.download}<span>Export</span></button>
          <button className="btn ghost sm">{I.compare}<span>Compare with…</span></button>
          <button className="btn ghost icon sm">{I.more}</button>
        </div>
      </div>

      <div style={{padding:"14px 24px 0"}}>
        <Tabs items={[
          { value:"overview", label:"Overview", icon: I.chart },
          { value:"charts", label:"Charts", icon: I.layers, count: selectedPids.length },
          { value:"map", label:"Map", icon: I.map },
          { value:"raw", label:"Raw Data", icon: I.table, count: session.data.length },
        ]} value={tab} onChange={setTab} />
      </div>

      <div style={{padding: "0 24px"}}>
        {tab === "overview" && <OverviewTab session={session} summary={summary} units={units}
                                            cursor={cursor} setCursor={setCursor}
                                            brushRange={brushRange} setBrushRange={setBrushRange} />}
        {tab === "charts" && <ChartsTab session={session} units={units}
                                        cursor={cursor} setCursor={setCursor}
                                        brushRange={brushRange} setBrushRange={setBrushRange}
                                        selectedPids={selectedPids} setSelectedPids={setSelectedPids}
                                        onOpenPicker={() => setPidDrawer(true)} />}
        {tab === "map" && <MapTab session={session} units={units} cursor={cursor} setCursor={setCursor} />}
        {tab === "raw" && <RawTab session={session} cursor={cursor} setCursor={setCursor} />}
      </div>

      <PidDrawer open={pidDrawer} onClose={() => setPidDrawer(false)}
                 selected={selectedPids} onChange={setSelectedPids} />
    </div>
  );
}

// ── Overview tab ────────────────────────────────────────────────────────────
function OverviewTab({ session, summary, units, cursor, setCursor, brushRange, setBrushRange }) {
  const data = session.data;
  const speedUnit = units === "metric" ? "km/h" : "mph";
  const speedKey = units === "metric" ? "speed_kph" : "speed_mph";
  const tempUnit = units === "metric" ? "°C" : "°F";
  const distUnit = units === "metric" ? "km" : "mi";

  return (
    <>
      <div className="summary-grid">
        <Metric peak label="Max speed" value={Math.round(units==="metric"? summary.maxSpeed*1.60934 : summary.maxSpeed)} unit={speedUnit}
                sub={`@ ${window.fmtClock(data.findIndex(r=>r.speed_mph===summary.maxSpeed) || 0)}`} />
        <Metric peak label="Peak HP" value={Math.round(summary.peakHp)} unit="hp" sub="at wheels" />
        <Metric peak label="Peak Tq" value={Math.round(units==="metric" ? summary.peakTq*1.356 : summary.peakTq)} unit={units==="metric"?"Nm":"lb·ft"} sub="at wheels" />
        <Metric peak label="Max boost" value={summary.maxBoost.toFixed(1)} unit="psi" sub="positive" />
        <Metric label="Avg MPG" value={summary.avgMpg.toFixed(1)} unit="mpg" sub="moving avg" />
        <Metric label="Max coolant" value={Math.round(units==="metric"? (summary.maxCool-32)*5/9 : summary.maxCool)} unit={tempUnit} sub="cooling normal" />
        <Metric label="Distance" value={summary.dist.toFixed(2)} unit={distUnit} sub={`${window.fmtDuration(summary.duration)}`} />
        <Metric label="0–60" value={summary.t0to60 ? summary.t0to60.toFixed(1) : "—"} unit={summary.t0to60 ? "s" : ""}
                sub={summary.t0to30 ? `0–30 in ${summary.t0to30.toFixed(1)}s` : "no full launch"} />
      </div>

      <Card title="Speed & RPM" subtitle="primary trace · scrub timeline below"
            actions={
              <>
                <span className="pill mono"><i className="dot ok"/>{window.fmtClock(brushRange[0])}–{window.fmtClock(brushRange[1])}</span>
                <button className="btn ghost icon sm" onClick={() => setBrushRange([0, data.length-1])} title="Reset zoom">{I.reset}</button>
              </>
            }>
        <LineChart data={data}
          series={[
            { key: speedKey, label: "Speed",      color: "var(--d-speed)", unit: speedUnit, axis: "l" },
            { key: "rpm",    label: "Engine RPM", color: "var(--d-rpm)",   unit: "rpm",     axis: "r" },
          ]}
          height={240}
          cursorIdx={cursor} onCursor={setCursor}
          brushed={brushRange}
        />
        <Brush data={data} getY={(r)=>r.speed_mph} color="var(--d-speed)" range={brushRange} onChange={setBrushRange} />
      </Card>

      <div className="row" style={{gap:12, marginTop:12, alignItems:"stretch"}}>
        <div style={{flex: 1}}>
          <Card title="Throttle & Engine load" subtitle="% of full">
            <LineChart data={data}
              series={[
                { key: "throttle", label: "Throttle",  color: "var(--d-throttle)", unit:"%", type: "area" },
                { key: "load",     label: "Eng. Load", color: "var(--d-load)",     unit:"%" },
              ]}
              height={170}
              yLeftRange={[0, 100]}
              cursorIdx={cursor} onCursor={setCursor} brushed={brushRange} />
          </Card>
        </div>
        <div style={{flex: 1}}>
          <Card title="AFR — Commanded vs Measured" subtitle="14.7 stoich · richer = lower">
            <LineChart data={data}
              series={[
                { key: "afr_cmd",  label: "Commanded", color: "var(--d-afr-cmd)",  unit:":1", decimals: 2, dashed: true },
                { key: "afr_meas", label: "Measured",  color: "var(--d-afr-meas)", unit:":1", decimals: 2 },
              ]}
              height={170}
              yLeftRange={[10.5, 16]}
              cursorIdx={cursor} onCursor={setCursor} brushed={brushRange} />
          </Card>
        </div>
      </div>

      <div className="row" style={{gap:12, marginTop:12, alignItems:"stretch"}}>
        <div style={{flex: 1}}>
          <Card title="Boost & Vacuum" subtitle="psi">
            <LineChart data={data}
              series={[{ key: "boost_psi", label: "Boost", color: "var(--d-boost)", unit: "psi", decimals: 1, type: "area" }]}
              height={170}
              yLeftRange={[-12, 22]}
              cursorIdx={cursor} onCursor={setCursor} brushed={brushRange} />
          </Card>
        </div>
        <div style={{flex: 1}}>
          <Card title="Engine Vitals" subtitle="temps">
            <LineChart data={data}
              series={[
                { key: units==="metric"?"coolant_c":"coolant_f", label: "Coolant", color: "var(--d-coolant)", unit: units==="metric"?"°C":"°F" },
                { key: units==="metric"?"oil_c":"oil_f",         label: "Oil",     color: "#fb7185",         unit: units==="metric"?"°C":"°F" },
                { key: units==="metric"?"iat_c":"iat_f",         label: "Intake",  color: "var(--d-iat)",    unit: units==="metric"?"°C":"°F" },
              ]}
              height={170}
              cursorIdx={cursor} onCursor={setCursor} brushed={brushRange} />
          </Card>
        </div>
      </div>

      <div className="row" style={{gap:12, marginTop:12, alignItems:"stretch"}}>
        <div style={{flex: 2}}>
          <Card title="Power & Torque (at wheels)">
            <LineChart data={data}
              series={[
                { key: "hp",      label: "Horsepower", color: "var(--d-hp)",     unit: "hp",   axis: "l" },
                { key: units==="metric"?"tq_nm":"tq_lbft", label: "Torque",     color: "var(--d-torque)", unit: units==="metric"?"Nm":"lb·ft", axis: "r" },
              ]}
              height={180}
              cursorIdx={cursor} onCursor={setCursor} brushed={brushRange} />
          </Card>
        </div>
        <div style={{flex: 1}}>
          <Card title="GPS track" subtitle="color: speed">
            <MiniMap data={data} height={158} cursor={cursor} setCursor={setCursor} />
          </Card>
        </div>
      </div>
    </>
  );
}

// ── Charts tab — stacked filmstrip with shared cursor ───────────────────────
function ChartsTab({ session, units, cursor, setCursor, brushRange, setBrushRange, selectedPids, setSelectedPids, onOpenPicker }) {
  const data = session.data;
  const pids = selectedPids.map((k) => window.PID_BY_KEY[k]).filter(Boolean);
  return (
    <>
      <div className="toolbar">
        <button className="btn" onClick={onOpenPicker}>{I.layers}<span>PIDs</span><span className="dim">{selectedPids.length} selected</span></button>
        <div className="sep"/>
        <button className="btn ghost sm">{I.zoom}<span>Zoom</span><span className="kbd">Z</span></button>
        <button className="btn ghost sm" onClick={() => setBrushRange([0, data.length-1])}>{I.reset}<span>Reset</span></button>
        <div className="sep"/>
        <span className="muted" style={{fontSize:11}}>Sync cursor</span>
        <span className="pill ok"><i className="dot"/>on</span>
        <div className="right"/>
        <span className="dim mono" style={{fontSize:11}}>
          {cursor != null ? `t = ${window.fmtClock(data[cursor].t)}` : `${window.fmtClock(brushRange[0])} – ${window.fmtClock(brushRange[1])}`}
        </span>
      </div>

      <Card flush>
        {pids.map((p, i) => {
          const u = window.unitize(p, null, units);
          const v = cursor != null ? data[cursor][u.key] : null;
          return (
            <div key={p.key} className="stack-chart">
              <div className="head">
                <span className="c" style={{background:p.color}} />
                <span style={{fontWeight:500}}>{p.label}</span>
                <span className="dim mono" style={{fontSize:11}}>{u.unit}</span>
                <span className="v">{v != null ? window.fmtNum(v, p.range[1] < 50 ? 2 : 0) : "—"}</span>
                <button className="btn ghost icon sm" style={{marginLeft:6}}
                        onClick={() => setSelectedPids(selectedPids.filter(k => k !== p.key))}>{I.cross}</button>
              </div>
              <div className="body">
                <LineChart data={data}
                  series={[{ key: u.key, label: p.label, color: p.color, unit: u.unit, decimals: p.range[1] < 50 ? 2 : 0, type: i % 3 === 0 ? "area" : "line" }]}
                  height={110}
                  padding={{ l: 52, r: 14, t: 6, b: i === pids.length - 1 ? 22 : 6 }}
                  cursorIdx={cursor} onCursor={setCursor} brushed={brushRange}
                  noLegend
                  noAxes={false}
                />
              </div>
            </div>
          );
        })}
        <Brush data={data} getY={(r)=>r.speed_mph} color="var(--d-speed)" range={brushRange} onChange={setBrushRange} />
      </Card>
    </>
  );
}

// ── Map tab ─────────────────────────────────────────────────────────────────
function MapTab({ session, units, cursor, setCursor }) {
  return (
    <div className="row" style={{gap:12, alignItems:"stretch"}}>
      <div style={{flex: 2}}>
        <Card title="GPS Track" subtitle={`${session.meta.gpsStart.lat.toFixed(4)}, ${session.meta.gpsStart.lon.toFixed(4)}`}
              actions={<>
                <button className="btn ghost sm">Color: speed{I.chevDown}</button>
                <button className="btn ghost icon sm">{I.settings}</button>
              </>}>
          <BigMap data={session.data} cursor={cursor} setCursor={setCursor} />
        </Card>
      </div>
      <div style={{flex: 1, minWidth: 280}}>
        <Card title="Hot spots">
          <div className="col" style={{gap: 10}}>
            <Hotspot label="Max speed" value="118 mph" detail="@ 11:52, mile 8.4" color="var(--d-boost)" />
            <Hotspot label="Hardest accel" value="0.94 g"  detail="@ 11:14, on-ramp"   color="var(--accent)" />
            <Hotspot label="Heat soak"     value="218°F"   detail="@ 11:58, end of straight" color="var(--d-coolant)" />
            <Hotspot label="Idle longest"  value="2m 34s"  detail="@ 11:09, fuel stop"  color="var(--text-3)" />
          </div>
        </Card>
        <Card title="Trip stats" actions={<button className="btn ghost icon sm">{I.more}</button>}>
          <div className="col" style={{gap:8, fontFamily:"var(--font-mono)", fontSize:12}}>
            <KVRow l="Driving time"    v="20m 14s" />
            <KVRow l="Idle time"       v="3m 28s" />
            <KVRow l="% city"          v="42%" />
            <KVRow l="% highway"       v="51%" />
            <KVRow l="% idle"          v="7%" />
            <KVRow l="Avg moving"      v="48 mph" />
            <KVRow l="Pos. kinetic E"  v="0.31 g" />
            <KVRow l="HDOP avg"        v="0.92" />
            <KVRow l="Altitude range"  v="372 – 502 m" last />
          </div>
        </Card>
      </div>
    </div>
  );
}
function KVRow({ l, v, last }) {
  return (
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", paddingBottom: last?0:6, borderBottom: last?0:"1px solid var(--border)"}}>
      <span className="dim">{l}</span><span>{v}</span>
    </div>
  );
}
function Hotspot({ label, value, detail, color }) {
  return (
    <div style={{display:"flex", gap:10, padding:"8px 10px", border:"1px solid var(--border)", borderRadius:8, background:"var(--bg-2)"}}>
      <span style={{width:3, alignSelf:"stretch", background:color, borderRadius:2}}/>
      <div style={{flex:1}}>
        <div className="dim" style={{fontSize:10, letterSpacing:".08em", textTransform:"uppercase"}}>{label}</div>
        <div className="mono" style={{fontSize:14, marginTop:2}}>{value}</div>
        <div className="dim" style={{fontSize:11, marginTop:2}}>{detail}</div>
      </div>
    </div>
  );
}

// ── Raw data tab ────────────────────────────────────────────────────────────
function RawTab({ session, cursor, setCursor }) {
  const [pageSize] = useState(60);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const data = session.data;
  const start = page * pageSize;
  const slice = data.slice(start, start + pageSize);
  const cols = ["t","speed_mph","rpm","throttle","load","boost_psi","afr_cmd","afr_meas","coolant_f","oil_f","iat_f","timing","mpg","lat","lon"];
  const labels = { t:"t", speed_mph:"Speed", rpm:"RPM", throttle:"Throttle", load:"Load",
                   boost_psi:"Boost", afr_cmd:"AFR cmd", afr_meas:"AFR meas",
                   coolant_f:"Coolant", oil_f:"Oil", iat_f:"IAT", timing:"Timing",
                   mpg:"MPG", lat:"Lat", lon:"Lon" };
  const decs = { t:0, speed_mph:1, rpm:0, throttle:1, load:1, boost_psi:1, afr_cmd:2, afr_meas:2,
                 coolant_f:0, oil_f:0, iat_f:0, timing:1, mpg:1, lat:5, lon:5 };
  return (
    <div className="col" style={{gap: 12}}>
      <div className="toolbar">
        <input className="input search" placeholder="Find timestamp or value…" style={{width:260}}
               value={search} onChange={(e)=>setSearch(e.target.value)} />
        <div className="sep"/>
        <span className="muted" style={{fontSize:11}}>Showing rows {start+1}–{Math.min(start+pageSize, data.length)} of {data.length}</span>
        <div className="right"/>
        <button className="btn ghost icon sm" disabled={page===0} onClick={()=>setPage(Math.max(0, page-1))} style={{transform:"rotate(180deg)"}}>{I.chevRight}</button>
        <button className="btn ghost icon sm" disabled={start+pageSize>=data.length} onClick={()=>setPage(page+1)}>{I.chevRight}</button>
        <button className="btn ghost sm">{I.download}<span>Export CSV</span></button>
      </div>
      <Card flush>
        <div style={{maxHeight: 520, overflow:"auto"}}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{width:30}}>#</th>
                {cols.map((c) => <th key={c} className={c==="lat"||c==="lon"||c==="t"?"":"num"}>{labels[c]}</th>)}
              </tr>
            </thead>
            <tbody>
              {slice.map((r, i) => (
                <tr key={i} className={cursor === start + i ? "sel" : ""}
                    onMouseEnter={() => setCursor(start + i)} onMouseLeave={() => setCursor(null)}>
                  <td className="dim mono" style={{textAlign:"right"}}>{start+i+1}</td>
                  {cols.map((c) => {
                    const v = r[c];
                    if (c === "t") return <td key={c} className="mono">{window.fmtClock(v)}</td>;
                    return <td key={c} className="num mono">{window.fmtNum(v, decs[c])}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── PID picker drawer ───────────────────────────────────────────────────────
function PidDrawer({ open, onClose, selected, onChange }) {
  const [q, setQ] = useState("");
  function toggle(key) {
    onChange(selected.includes(key) ? selected.filter(k=>k!==key) : [...selected, key]);
  }
  return (
    <>
      {open && <div onClick={onClose} style={{position:"fixed", inset:"44px 0 0 0", background:"rgba(0,0,0,.4)", zIndex: 49}}/>}
      <div className={"drawer" + (open ? " open" : "")}>
        <div className="drawer-h">
          <h3>Pick signals</h3>
          <button className="btn ghost icon sm" onClick={onClose}>{I.cross}</button>
        </div>
        <div style={{padding:"10px 14px"}}>
          <input className="input search" placeholder="Search 67 PIDs…" style={{width:"100%"}}
                 value={q} onChange={(e)=>setQ(e.target.value)} />
          <div className="row dim" style={{marginTop:6, gap:8, fontSize:11}}>
            <span>{selected.length} selected</span>
            <button className="btn ghost sm" onClick={() => onChange([])} style={{marginLeft:"auto"}}>Clear</button>
          </div>
        </div>
        <div className="drawer-body">
          {window.PID_CATEGORIES.map((cat) => {
            const items = cat.pids.filter((p) => !q || p.label.toLowerCase().includes(q.toLowerCase()));
            if (!items.length) return null;
            return (
              <div key={cat.id}>
                <div className="pid-cat">{cat.label}</div>
                {items.map((p) => {
                  const on = selected.includes(p.key);
                  return (
                    <div key={p.key} className="pid-row" onClick={() => toggle(p.key)}>
                      <span className={"checkbox" + (on ? " on" : "")} />
                      <span className="pid-color" style={{background: p.color}} />
                      <span className="pid-name">{p.label}</span>
                      <span className="pid-unit">{p.unit}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── Mini map (in dashboard sidebar) ─────────────────────────────────────────
function MiniMap({ data, height = 160, cursor, setCursor, noGps }) {
  const ref = useRef(null);
  const [w, setW] = useState(280);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((e) => setW(e[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const hasGps = !noGps && data && data.length > 0 && Number.isFinite(data[0].lat) && (data[0].lat !== 0 || data[0].lon !== 0);
  if (!hasGps) {
    return (
      <div ref={ref} className="map-frame" style={{height}}>
        <div className="map-empty">
          <div className="me-icon">{I.map}</div>
          <h4>No GPS data in this session</h4>
          <div className="me-sub">
            Torque Pro didn’t log latitude/longitude — maybe location permission was off, or the dongle was indoors. Other PIDs are fine to chart.
          </div>
          <div className="me-checks">
            <span className="bad">×</span><span>GPS coordinates</span>
            <span className="ok">✓</span><span>Engine RPM, speed, throttle</span>
            <span className="ok">✓</span><span>Boost, AFR, temps</span>
            <span className="neutral">·</span><span>{data ? data.length.toLocaleString() : 0} rows logged</span>
          </div>
        </div>
      </div>
    );
  }
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  for (const r of data) {
    if (r.lat < minLat) minLat = r.lat; if (r.lat > maxLat) maxLat = r.lat;
    if (r.lon < minLon) minLon = r.lon; if (r.lon > maxLon) maxLon = r.lon;
  }
  const padX = 8, padY = 8;
  const wIn = w - padX*2, hIn = height - padY*2;
  const dLat = Math.max(1e-6, maxLat - minLat), dLon = Math.max(1e-6, maxLon - minLon);
  const aspect = wIn / hIn, dataAspect = dLon / dLat;
  let scaleX, scaleY;
  if (dataAspect > aspect) { scaleX = wIn / dLon; scaleY = scaleX; }
  else { scaleY = hIn / dLat; scaleX = scaleY; }
  const mapX = (lon) => padX + (wIn - dLon * scaleX)/2 + (lon - minLon) * scaleX;
  const mapY = (lat) => padY + (hIn - dLat * scaleY)/2 + (maxLat - lat) * scaleY;
  // Build path segments colored by speed
  const segs = [];
  for (let i = 1; i < data.length; i++) {
    const sp = data[i].speed_mph;
    const c = sp < 15 ? "#6fd3f7" : sp < 45 ? "#34d399" : sp < 80 ? "#ffb020" : "#ff5a5a";
    segs.push({ x1: mapX(data[i-1].lon), y1: mapY(data[i-1].lat), x2: mapX(data[i].lon), y2: mapY(data[i].lat), c });
  }
  const cR = cursor != null ? data[cursor] : null;
  return (
    <div ref={ref} className="map-frame" style={{height, position:"relative"}}>
      <svg width="100%" height="100%">
        {segs.map((s, i) => (
          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.c} strokeWidth="2" strokeLinecap="round" opacity=".9"/>
        ))}
        <circle cx={mapX(data[0].lon)} cy={mapY(data[0].lat)} r="4" fill="var(--ok)" stroke="var(--bg-1)" strokeWidth="1.5"/>
        <circle cx={mapX(data[data.length-1].lon)} cy={mapY(data[data.length-1].lat)} r="4" fill="var(--danger)" stroke="var(--bg-1)" strokeWidth="1.5"/>
        {cR && <circle cx={mapX(cR.lon)} cy={mapY(cR.lat)} r="6" fill="var(--accent)" stroke="var(--bg-0)" strokeWidth="2"/>}
      </svg>
    </div>
  );
}

// ── Big map (Map tab) ───────────────────────────────────────────────────────
function BigMap({ data, cursor, setCursor }) {
  return (
    <div style={{position: "relative"}}>
      <MiniMap data={data} height={520} cursor={cursor} setCursor={setCursor} />
      <div className="map-legend">
        <div>Speed (mph)</div>
        <div className="gradient"/>
        <div className="row" style={{justifyContent:"space-between"}}><span>0</span><span>40</span><span>80</span><span>120+</span></div>
      </div>
    </div>
  );
}

// ── Compare ─────────────────────────────────────────────────────────────────
const COMPARE_COLORS = ["var(--accent)", "var(--d-speed)", "var(--d-load)", "#c084fc"];

function CompareScreen({ sessions, sessionIds, units, onAddSession, onRemove, onOpen, onBack, onImport, onPick }) {
  // No hooks before this branch — the empty/partial picker and the full overlay
  // view are two separate components so each owns its own hook order.
  const sels = sessionIds.map((id) => sessions.find((s) => s.meta.id === id)).filter(Boolean);
  if (sels.length < 2) {
    return <ComparePickScreen sessions={sessions} sessionIds={sels.map(s=>s.meta.id)} units={units}
                              onBack={onBack} onImport={onImport} onPick={onPick} colors={COMPARE_COLORS}/>;
  }
  return <CompareOverlay sels={sels} units={units} onAddSession={onAddSession} onRemove={onRemove}
                         onOpen={onOpen} onBack={onBack} />;
}

function CompareOverlay({ sels, units, onAddSession, onRemove, onOpen, onBack }) {
  const [cursor, setCursor] = useState(null);
  const [align, setAlign] = useState("trip");
  const COLORS = COMPARE_COLORS;

  // Align two arrays by overlapping length
  const N = Math.min(...sels.map((s) => s.data.length));
  // Build merged data: at index i, fields like "rpm_0", "rpm_1"
  const merged = useMemo(() => {
    const arr = [];
    for (let i = 0; i < N; i++) {
      const r = { t: i };
      sels.forEach((s, k) => {
        const row = s.data[i];
        r["rpm_"+k] = row.rpm;
        r["speed_"+k] = units==="metric" ? row.speed_kph : row.speed_mph;
        r["throttle_"+k] = row.throttle;
        r["boost_"+k] = row.boost_psi;
      });
      arr.push(r);
    }
    return arr;
  }, [sels.map(s=>s.meta.id).join("|"), units, N]);

  return (
    <div className="page" data-screen-label="Compare">
      <div className="page-h">
        <div>
          <div className="row" style={{gap:8, marginBottom:6}}>
            <button className="btn ghost sm" onClick={onBack}><span style={{transform:"rotate(180deg)", display:"inline-flex"}}>{I.chevRight}</span><span>Library</span></button>
          </div>
          <h1>Compare sessions</h1>
          <div className="sub">Overlay {sels.length} sessions on shared timeline. Hover for synced values.</div>
        </div>
        <div className="row" style={{gap:8}}>
          <div className="row" style={{gap:0, border:"1px solid var(--border)", borderRadius:6, overflow:"hidden"}}>
            <button className={"btn ghost sm" + (align==="trip"?" primary":"")} onClick={()=>setAlign("trip")} style={{borderRadius:0}}>By start of trip</button>
            <button className={"btn ghost sm" + (align==="gps"?" primary":"")} onClick={()=>setAlign("gps")} style={{borderRadius:0}}>By GPS location</button>
          </div>
          <button className="btn" onClick={onAddSession}>{I.plus}<span>Add session</span></button>
        </div>
      </div>

      <Card flush>
        <div className="compare-list">
          {sels.map((s, i) => {
            const summary = window.summarize(s);
            return (
              <div key={s.meta.id} className="row-item">
                <span className="swatch" style={{background: COLORS[i]}} />
                <div style={{flex: 1}}>
                  <div style={{fontWeight:500, fontSize:13}}>{s.meta.name}</div>
                  <div className="dim mono" style={{fontSize:11, marginTop:2}}>
                    {window.fmtDate(s.meta.startedAt)} · {window.fmtTime(s.meta.startedAt)} · {window.fmtDuration(s.meta.duration)} · {summary.dist.toFixed(1)} {units==="metric"?"km":"mi"}
                  </div>
                </div>
                <div className="mono dim" style={{fontSize:11}}>peak {Math.round(summary.peakHp)} hp · max {Math.round(summary.maxBoost)} psi</div>
                <button className="btn ghost sm" onClick={() => onOpen(s.meta.id)}>{I.session}<span>Open</span></button>
                {sels.length > 2 && (
                  <button className="btn ghost icon sm" onClick={() => onRemove(s.meta.id)}>{I.cross}</button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{height:12}}/>

      <Card title="Speed & RPM — overlay" subtitle={align==="gps"?"aligned by GPS location":"aligned at trip start"}>
        <LineChart data={merged}
          series={sels.flatMap((s, i) => [
            { key: "speed_"+i, label: s.meta.name+" · speed", color: COLORS[i], unit: units==="metric"?"km/h":"mph", axis: "l", width: 1.6 },
            { key: "rpm_"+i,   label: s.meta.name+" · rpm",   color: COLORS[i], unit: "rpm", axis: "r", dashed: true, opacity: .55 },
          ])}
          height={300}
          cursorIdx={cursor} onCursor={setCursor}
        />
      </Card>

      <div className="row" style={{gap:12, marginTop:12, alignItems:"stretch"}}>
        <div style={{flex:1}}>
          <Card title="Throttle">
            <LineChart data={merged}
              series={sels.map((s, i) => ({ key:"throttle_"+i, label: s.meta.name, color: COLORS[i], unit:"%" }))}
              height={180} yLeftRange={[0,100]}
              cursorIdx={cursor} onCursor={setCursor} />
          </Card>
        </div>
        <div style={{flex:1}}>
          <Card title="Boost">
            <LineChart data={merged}
              series={sels.map((s, i) => ({ key:"boost_"+i, label: s.meta.name, color: COLORS[i], unit:"psi", decimals: 1 }))}
              height={180} yLeftRange={[-12, 22]}
              cursorIdx={cursor} onCursor={setCursor} />
          </Card>
        </div>
      </div>

      <div style={{height: 12}}/>
      <Card title="Side-by-side summary" flush>
        <table className="tbl">
          <thead>
            <tr>
              <th>Metric</th>
              {sels.map((s, i) => (
                <th key={s.meta.id} className="num">
                  <span style={{display:"inline-flex", alignItems:"center", gap:6}}>
                    <span className="swatch" style={{background:COLORS[i]}}/>{s.meta.name}
                  </span>
                </th>
              ))}
              <th className="num">Δ</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Max speed", "maxSpeed", units==="metric"?"km/h":"mph", units==="metric"?1.60934:1, 0],
              ["Peak HP", "peakHp", "hp", 1, 0],
              ["Peak Tq", "peakTq", units==="metric"?"Nm":"lb·ft", units==="metric"?1.356:1, 0],
              ["Max boost", "maxBoost", "psi", 1, 1],
              ["Avg MPG", "avgMpg", "mpg", 1, 1],
              ["Max coolant", "maxCool", units==="metric"?"°C":"°F", 1, 0],
              ["Distance", "dist", units==="metric"?"km":"mi", 1, 2],
              ["0–60", "t0to60", "s", 1, 1],
            ].map(([label, key, unit, mult, dec]) => {
              const vals = sels.map((s) => {
                const v = window.summarize(s)[key];
                if (v == null) return null;
                if (key === "maxCool" && units === "metric") return ((v - 32) * 5/9);
                return v * mult;
              });
              const delta = vals[0] != null && vals[1] != null ? (vals[1] - vals[0]) : null;
              return (
                <tr key={key}>
                  <td>{label}</td>
                  {vals.map((v, i) => <td key={i} className="num mono">{v != null ? v.toFixed(dec) + " " + unit : "—"}</td>)}
                  <td className="num mono" style={{color: delta == null ? "var(--text-3)" : delta > 0 ? "var(--ok)" : "var(--danger)"}}>
                    {delta == null ? "—" : (delta > 0 ? "+" : "") + delta.toFixed(dec) + " " + unit}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

Object.assign(window, { SessionScreen, CompareScreen, ComparePickScreen });

// ── Compare: empty / partial picker screen ─────────────────────────────────
function ComparePickScreen({ sessions, sessionIds, units, onBack, onImport, onPick, colors }) {
  const [picked, setPicked] = useState(new Set(sessionIds));
  const [query, setQuery] = useState("");
  const MAX = 4;

  const toggle = (id) => {
    const n = new Set(picked);
    if (n.has(id)) n.delete(id);
    else if (n.size < MAX) n.add(id);
    setPicked(n);
  };
  const pickedArr = useMemo(() => [...picked], [picked]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => s.meta.name.toLowerCase().includes(q) || s.meta.fileName.toLowerCase().includes(q));
  }, [sessions, query]);

  // ── State A: zero imported ────────────────────────────────────────────────
  if (sessions.length === 0) {
    return (
      <div className="page" data-screen-label="Compare · no sessions">
        <div className="page-h">
          <div>
            <div className="row" style={{gap:8, marginBottom:6}}>
              <button className="btn ghost sm" onClick={onBack}><span style={{transform:"rotate(180deg)", display:"inline-flex"}}>{I.chevRight}</span><span>Library</span></button>
            </div>
            <h1>Compare sessions</h1>
            <div className="sub">Overlay 2–4 sessions on a shared timeline.</div>
          </div>
        </div>
        <Card>
          <div className="cmp-empty">
            <div className="cmp-empty-art">{I.compare}</div>
            <h3 style={{margin:"4px 0 6px", fontSize:18, color:"var(--text-0)"}}>Compare needs at least two sessions</h3>
            <p className="dim" style={{maxWidth: 440, lineHeight: 1.6, fontSize: 13}}>
              You haven’t imported anything yet. Compare overlays speed, RPM, throttle and boost
              from up to four sessions so you can see how a tune, a route, or a driver changed the run.
            </p>
            <div style={{marginTop: 18, display:"inline-flex", gap:8}}>
              <button className="btn primary" onClick={onImport}>{I.plus}<span>Import a session</span></button>
              <button className="btn ghost">View sample session</button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ── States B & C: zero / one session selected ────────────────────────────
  const partial = picked.size === 1;
  return (
    <div className="page" data-screen-label={"Compare · " + (partial ? "1 picked" : "pick")}>
      <div className="page-h">
        <div>
          <div className="row" style={{gap:8, marginBottom:6}}>
            <button className="btn ghost sm" onClick={onBack}><span style={{transform:"rotate(180deg)", display:"inline-flex"}}>{I.chevRight}</span><span>Library</span></button>
          </div>
          <h1>Compare sessions</h1>
          <div className="sub">Overlay 2–4 sessions on a shared timeline. Hover for synced values.</div>
        </div>
        <div className="row" style={{gap:8}}>
          <button className="btn ghost" onClick={onImport}>{I.import}<span>Import a session</span></button>
        </div>
      </div>

      <div className="cmp-pick-grid">
        {/* Left: picker */}
        <Card flush>
          <div className="cmp-pick-h">
            <div>
              <div style={{fontSize:13, fontWeight:600, color:"var(--text-0)"}}>Pick sessions to compare</div>
              <div className="dim" style={{fontSize:11, marginTop:3}}>
                Choose 2 to 4. Currently selected: <span className="mono" style={{color: picked.size === 0 ? "var(--text-3)" : "var(--text-0)"}}>{picked.size}/{MAX}</span>
              </div>
            </div>
            <div className="cmp-search">
              <span>{I.search || I.session}</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter sessions…"/>
            </div>
          </div>

          <div className="cmp-session-list">
            {filtered.map((s) => {
              const summary = window.summarize(s);
              const idx = pickedArr.indexOf(s.meta.id);
              const on = idx >= 0;
              const disabled = !on && picked.size >= MAX;
              return (
                <button key={s.meta.id}
                        className={"cmp-row" + (on ? " on" : "") + (disabled ? " dis" : "")}
                        disabled={disabled}
                        onClick={() => toggle(s.meta.id)}>
                  <span className={"checkbox" + (on ? " on" : "")}/>
                  <span className="swatch" style={{background: on ? colors[idx] : "transparent",
                                                    border: on ? 0 : "1px dashed var(--border-strong)"}}/>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:13, fontWeight:500, color:"var(--text-0)",
                                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                      {s.meta.name}
                    </div>
                    <div className="dim mono" style={{fontSize:11, marginTop:2}}>
                      {window.fmtDate(s.meta.startedAt)} · {window.fmtDuration(s.meta.duration)} · {summary.dist.toFixed(1)} {units==="metric"?"km":"mi"} · peak {Math.round(summary.peakHp)} hp
                    </div>
                  </div>
                  <span className="dim mono" style={{fontSize: 11}}>{s.meta.fileName}</span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="cmp-row" style={{cursor:"default", justifyContent:"center", color:"var(--text-3)"}}>
                No sessions match “{query}”.
              </div>
            )}
          </div>

          <div className="cmp-pick-foot">
            <div className="dim" style={{fontSize:11}}>
              {picked.size === 0
                ? <>Pick at least two sessions to start comparing.</>
                : picked.size === 1
                  ? <span style={{color:"var(--warn)"}}>Pick at least one more session to start comparing.</span>
                  : <>Ready — {picked.size} selected.</>}
            </div>
            <div className="right"/>
            <button className="btn ghost sm" onClick={() => setPicked(new Set())} disabled={picked.size === 0}>Clear</button>
            <button className="btn primary" disabled={picked.size < 2} onClick={() => onPick(pickedArr)}>
              {I.compare}<span>Compare {picked.size >= 2 ? picked.size : ""} sessions</span>
            </button>
          </div>
        </Card>

        {/* Right: explainer + selected previews */}
        <div className="cmp-pick-side">
          <Card title="What Compare does" subtitle="Read this once — it pays off">
            <div className="cmp-explain">
              <CmpFeature icon={I.compare} title="Overlay charts"
                          body="Speed, RPM, throttle and boost plotted on the same axes so you can see where two runs diverge."/>
              <CmpFeature icon={I.session} title="Aligned timelines"
                          body="Snap by start-of-trip or by GPS location — useful when comparing identical routes at different times."/>
              <CmpFeature icon={I.download} title="Side-by-side summary"
                          body="Peak HP, max boost, 0–60, MPG. Δ column shows how much each metric moved between the first two picks."/>
            </div>
            <div className="dim" style={{fontSize:11, lineHeight:1.55, marginTop: 14, paddingTop: 14, borderTop:"1px solid var(--border)"}}>
              Up to <span className="mono" style={{color:"var(--text-1)"}}>4</span> sessions render
              without dropping frames on a 2019-era laptop. More than that and you’ll want a
              filtered <span className="mono" style={{color:"var(--text-1)"}}>--max-rows</span> import.
            </div>
          </Card>

          <div style={{height:12}}/>

          <Card title={picked.size === 0 ? "Nothing picked yet" : "Picked"} subtitle={picked.size === 0 ? "Up to 4 sessions" : `${picked.size} of ${MAX}`}>
            {picked.size === 0 && (
              <div className="cmp-side-empty">
                <div className="dim" style={{fontSize:12, lineHeight:1.55}}>
                  Selected sessions will preview here with their color swatch and headline stats.
                </div>
                <div className="cmp-side-ghosts">
                  {[0,1].map((i) => (
                    <div key={i} className="cmp-side-ghost">
                      <span className="swatch" style={{background:"var(--bg-3)"}}/>
                      <div className="cmp-side-ghost-lines">
                        <div/>
                        <div style={{width:"60%"}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {pickedArr.map((id, i) => {
              const s = sessions.find((x) => x.meta.id === id);
              if (!s) return null;
              const sm = window.summarize(s);
              return (
                <div key={id} className="cmp-picked-row">
                  <span className="swatch" style={{background: colors[i]}}/>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:13, color:"var(--text-0)", fontWeight:500,
                                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{s.meta.name}</div>
                    <div className="dim mono" style={{fontSize:11, marginTop:2}}>
                      {window.fmtDate(s.meta.startedAt)} · peak {Math.round(sm.peakHp)} hp · {sm.dist.toFixed(1)} {units==="metric"?"km":"mi"}
                    </div>
                  </div>
                  <button className="btn ghost icon sm" onClick={() => toggle(id)} aria-label="Remove">{I.cross}</button>
                </div>
              );
            })}
            {picked.size === 1 && (
              <div className="cmp-need-more">
                <span>{I.warn}</span>
                <span>Pick one more session to start comparing.</span>
              </div>
            )}
          </Card>
        </div>
      </div>

      <div style={{height: 12}}/>
      <div className="dim" style={{fontSize: 11, textAlign: "center"}}>
        Looking for a specific session? <button className="link-btn" onClick={onBack}>Open the Library</button> or <button className="link-btn" onClick={onImport}>import a new CSV</button>.
      </div>
    </div>
  );
}

function CmpFeature({ icon, title, body }) {
  return (
    <div className="cmp-feature">
      <span className="cmp-feature-icon">{icon}</span>
      <div>
        <div style={{fontSize: 13, color:"var(--text-0)", fontWeight: 500}}>{title}</div>
        <div className="dim" style={{fontSize: 12, marginTop: 3, lineHeight: 1.55}}>{body}</div>
      </div>
    </div>
  );
}
