/* ui.jsx — primitives: AppShell, Card, Tabs, Pills, Tables, simple SVG charts */

const { useState, useEffect, useRef, useMemo, useCallback, Fragment } = React;

// ── Icons ───────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, fill = "none", stroke = "currentColor", strokeWidth = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const I = {
  library:  <Icon d={<><path d="M3 5h18M3 12h18M3 19h18"/></>} />,
  session:  <Icon d={<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h6"/></>} />,
  compare:  <Icon d={<><path d="M8 4v16M16 4v16M3 8l5-4 5 4M21 16l-5 4-5-4"/></>} />,
  import:   <Icon d={<><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></>} />,
  vehicle:  <Icon d={<><path d="M3 13l2-5a3 3 0 0 1 3-2h8a3 3 0 0 1 3 2l2 5"/><path d="M5 13h14v5H5z"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="16.5" cy="18" r="1.5"/></>} />,
  search:   <Icon d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></>} />,
  filter:   <Icon d={<><path d="M3 5h18M6 12h12M10 19h4"/></>} />,
  plus:     <Icon d={<><path d="M12 5v14M5 12h14"/></>} />,
  download: <Icon d={<><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></>} />,
  upload:   <Icon d={<><path d="M12 21V9M7 14l5-5 5 5M5 3h14"/></>} />,
  more:     <Icon d={<><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></>} fill="currentColor" stroke="none" />,
  chevDown: <Icon d={<><path d="m6 9 6 6 6-6"/></>} />,
  chevRight:<Icon d={<><path d="m9 6 6 6-6 6"/></>} />,
  cross:    <Icon d={<><path d="M6 6l12 12M18 6l-12 12"/></>} />,
  pin:      <Icon d={<><path d="M12 2v6M5 12h14M5 8h14a3 3 0 0 1-3 7l-4 7-4-7a3 3 0 0 1-3-7z"/></>} />,
  zoom:     <Icon d={<><circle cx="11" cy="11" r="7"/><path d="M11 8v6M8 11h6M20 20l-3-3"/></>} />,
  reset:    <Icon d={<><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></>} />,
  layers:   <Icon d={<><path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></>} />,
  trash:    <Icon d={<><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></>} />,
  settings: <Icon d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.4 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>} />,
  map:      <Icon d={<><path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/></>} />,
  table:    <Icon d={<><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 10h18M3 16h18M9 4v16M15 4v16"/></>} />,
  chart:    <Icon d={<><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-7"/></>} />,
  list:     <Icon d={<><path d="M3 6h18M3 12h18M3 18h18"/></>} />,
  check:    <Icon d={<><path d="m5 12 5 5L20 7"/></>} />,
  warn:     <Icon d={<><path d="M12 3 2 21h20z"/><path d="M12 10v5M12 18h.01"/></>} />,
};

// ── Format helpers ──────────────────────────────────────────────────────────
function fmtDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${String(m).padStart(2,"0")}m`;
  return `${m}m ${String(s).padStart(2,"0")}s`;
}
function fmtClock(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
function fmtDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function fmtFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(0)} KB`;
  return `${(bytes/1024/1024).toFixed(2)} MB`;
}
function fmtNum(n, decimals = 0) {
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function unitize(pid, value, unitsMode) {
  if (pid.altUnit && unitsMode === "metric") {
    return { unit: pid.altUnit.metric.unit, key: pid.altUnit.metric.key };
  }
  return { unit: pid.unit, key: pid.key };
}

// ── Card ────────────────────────────────────────────────────────────────────
function Card({ title, subtitle, actions, children, padding = true, className = "", flush = false }) {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-h">
          <div className="title">
            {title}{subtitle && <small>{subtitle}</small>}
          </div>
          {actions && <div className="actions">{actions}</div>}
        </div>
      )}
      <div className={`card-body${flush || !padding ? " flush" : ""}`}>{children}</div>
    </div>
  );
}

// ── Tabs ────────────────────────────────────────────────────────────────────
function Tabs({ items, value, onChange }) {
  return (
    <div className="tabs">
      {items.map((it) => (
        <button key={it.value} className={`tab${value === it.value ? " active" : ""}`}
                onClick={() => onChange(it.value)}>
          {it.icon && <span style={{marginRight:6, display:"inline-flex", verticalAlign:"middle"}}>{it.icon}</span>}
          {it.label}
          {it.count != null && <span className="count">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ── Metric card ─────────────────────────────────────────────────────────────
function Metric({ label, value, unit, sub, peak = false }) {
  return (
    <div className={`metric${peak ? " peak" : ""}`}>
      <div className="lbl">{label}</div>
      <div className="val">{value}{unit && <span className="unit">{unit}</span>}</div>
      {sub && <div className="delta">{sub}</div>}
    </div>
  );
}

// ── Sparkline ───────────────────────────────────────────────────────────────
function Sparkline({ data, getY, color = "var(--accent)", width = 110, height = 28, fill = false }) {
  if (!data.length) return null;
  let min = Infinity, max = -Infinity;
  for (const r of data) { const v = getY(r); if (v < min) min = v; if (v > max) max = v; }
  if (max - min < 0.0001) max = min + 1;
  const step = width / (data.length - 1);
  const norm = (v) => height - 2 - ((v - min) / (max - min)) * (height - 4);
  let d = "M0," + norm(getY(data[0]));
  for (let i = 1; i < data.length; i++) d += ` L${(i*step).toFixed(1)},${norm(getY(data[i])).toFixed(1)}`;
  const area = fill ? `${d} L${width},${height} L0,${height} Z` : null;
  return (
    <svg width={width} height={height} style={{display:"block"}}>
      {fill && <path d={area} fill={color} opacity=".15" />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

// ── Line chart with shared cursor (a la Recharts) ───────────────────────────
//
// Multi-series, optional dual y-axis. data: array of rows. series: [{key,color,label,unit,axis?:'l'|'r',type?:'line'|'area'}]
// Calls onCursor(idx) on hover. cursorIdx prop drives external cursor.
function LineChart({
  data, series, height = 220, padding = { l: 44, r: 44, t: 10, b: 22 },
  cursorIdx, onCursor, xRange, yLeftRange, yRightRange,
  noAxes = false, noLegend = false, brushed = null, onBrush,
}) {
  const ref = useRef(null);
  const [w, setW] = useState(800);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => setW(entries[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const N = data.length;
  const x0 = brushed ? brushed[0] : 0;
  const x1 = brushed ? brushed[1] : N - 1;
  const visible = data.slice(x0, x1 + 1);
  const VN = visible.length;
  const px = padding;
  const innerW = Math.max(10, w - px.l - px.r);
  const innerH = Math.max(10, height - px.t - px.b);

  // y ranges
  const leftSeries = series.filter((s) => (s.axis || "l") === "l");
  const rightSeries = series.filter((s) => s.axis === "r");
  function rangeOf(arr, fixed) {
    if (fixed) return fixed;
    let mn = Infinity, mx = -Infinity;
    for (const r of visible) for (const s of arr) {
      const v = r[s.key]; if (v == null || isNaN(v)) continue;
      if (v < mn) mn = v; if (v > mx) mx = v;
    }
    if (!isFinite(mn)) { mn = 0; mx = 1; }
    if (mx - mn < 1e-6) mx = mn + 1;
    const pad = (mx - mn) * 0.08;
    return [mn - pad, mx + pad];
  }
  const yL = rangeOf(leftSeries, yLeftRange);
  const yR = rangeOf(rightSeries, yRightRange);

  const xScale = (i) => px.l + (VN <= 1 ? innerW/2 : (i / (VN - 1)) * innerW);
  const yScaleL = (v) => px.t + innerH - ((v - yL[0]) / (yL[1] - yL[0])) * innerH;
  const yScaleR = (v) => px.t + innerH - ((v - yR[0]) / (yR[1] - yR[0])) * innerH;

  function buildPath(s) {
    const ys = s.axis === "r" ? yScaleR : yScaleL;
    let d = "";
    for (let i = 0; i < VN; i++) {
      const v = visible[i][s.key];
      if (v == null || isNaN(v)) continue;
      d += (d === "" ? "M" : "L") + xScale(i).toFixed(1) + "," + ys(v).toFixed(1);
    }
    return d;
  }
  function buildArea(s) {
    const ys = s.axis === "r" ? yScaleR : yScaleL;
    const baseY = px.t + innerH;
    let d = "";
    let started = false;
    for (let i = 0; i < VN; i++) {
      const v = visible[i][s.key];
      if (v == null || isNaN(v)) continue;
      if (!started) { d += `M${xScale(i).toFixed(1)},${baseY} L${xScale(i).toFixed(1)},${ys(v).toFixed(1)}`; started = true; }
      else d += ` L${xScale(i).toFixed(1)},${ys(v).toFixed(1)}`;
    }
    if (started) d += ` L${xScale(VN-1).toFixed(1)},${baseY} Z`;
    return d;
  }

  // axis ticks
  function ticks(range, n = 4) {
    const [a, b] = range;
    const step = (b - a) / n;
    return Array.from({length: n+1}, (_, i) => a + step * i);
  }
  const ticksL = ticks(yL, 4);
  const ticksR = rightSeries.length ? ticks(yR, 4) : null;
  // x ticks: show ~6 time labels
  const xTickIdx = [];
  const xN = 6;
  for (let i = 0; i <= xN; i++) xTickIdx.push(Math.round((i/xN) * (VN-1)));

  // hover
  const onMove = (e) => {
    if (!onCursor) return;
    const rect = ref.current.getBoundingClientRect();
    const px2 = e.clientX - rect.left;
    const innerX = px2 - padding.l;
    const i = Math.round((innerX / innerW) * (VN - 1));
    onCursor(clamp(x0 + i, x0, x1));
  };
  const onLeave = () => onCursor && onCursor(null);

  // cursor position
  const cIdx = cursorIdx != null && cursorIdx >= x0 && cursorIdx <= x1 ? cursorIdx - x0 : null;
  const cX = cIdx != null ? xScale(cIdx) : null;
  const cRow = cIdx != null ? visible[cIdx] : null;

  return (
    <div ref={ref} className="chart-frame" style={{ position: "relative", width: "100%" }}>
      <svg width="100%" height={height} onMouseMove={onMove} onMouseLeave={onLeave}>
        {!noAxes && (
          <g className="grid">
            {ticksL.map((t, i) => (
              <line key={i} x1={px.l} x2={w-px.r} y1={yScaleL(t)} y2={yScaleL(t)} />
            ))}
          </g>
        )}
        {/* areas behind lines */}
        {series.filter(s=>s.type==="area").map((s) => (
          <path key={"a-"+s.key} d={buildArea(s)} fill={s.color} opacity=".18" />
        ))}
        {/* lines */}
        {series.map((s) => (
          <path key={s.key} d={buildPath(s)} fill="none" stroke={s.color}
                strokeWidth={s.width || 1.4} strokeLinejoin="round"
                opacity={s.opacity ?? 0.95}
                strokeDasharray={s.dashed ? "4 3" : undefined} />
        ))}
        {/* axes */}
        {!noAxes && (
          <g className="axis-y" textAnchor="end">
            {ticksL.map((t, i) => (
              <text key={i} x={px.l - 6} y={yScaleL(t) + 3}>{Math.round(t * (Math.abs(t)>1?1:100)/(Math.abs(t)>1?1:100))}</text>
            ))}
          </g>
        )}
        {!noAxes && ticksR && (
          <g className="axis-y" textAnchor="start">
            {ticksR.map((t, i) => (
              <text key={i} x={w - px.r + 6} y={yScaleR(t) + 3}>{Math.round(t)}</text>
            ))}
          </g>
        )}
        {!noAxes && (
          <g className="axis-x" textAnchor="middle">
            {xTickIdx.map((i) => (
              <text key={i} x={xScale(i)} y={height - 6}>{fmtClock(visible[i].t)}</text>
            ))}
          </g>
        )}
        {/* cursor */}
        {cX != null && (
          <line className="cursor-line" x1={cX} x2={cX} y1={px.t} y2={height - px.b} />
        )}
        {cX != null && series.map((s) => {
          const ys = s.axis === "r" ? yScaleR : yScaleL;
          const v = cRow[s.key];
          if (v == null) return null;
          return <circle key={"c-"+s.key} cx={cX} cy={ys(v)} r="3.5" fill={s.color} stroke="var(--bg-1)" strokeWidth="1.5"/>;
        })}
      </svg>
      {/* tooltip */}
      {cX != null && cRow && (
        <div className="chart-tip" style={{
          left: clamp(cX + 12, 4, w - 200),
          top: 8,
        }}>
          <div className="tt-time">{fmtClock(cRow.t)}</div>
          {series.map((s) => {
            const v = cRow[s.key];
            return (
              <div key={s.key} className="tt-row">
                <i className="tt-dot" style={{background: s.color}} />
                <span className="tt-lbl">{s.label}</span>
                <span className="tt-val">{fmtNum(v, s.decimals ?? 0)}{s.unit ? " " + s.unit : ""}</span>
              </div>
            );
          })}
        </div>
      )}
      {!noLegend && (
        <div className="legend" style={{ marginTop: 6, padding: "0 14px 4px" }}>
          {series.map((s) => (
            <span key={s.key}>
              <i style={{background: s.color}} />{s.label}
              {s.axis === "r" && <span className="axis"> · right</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Brush (mini chart with selectable window) ───────────────────────────────
function Brush({ data, getY, color = "var(--accent)", range, onChange, height = 56 }) {
  const ref = useRef(null);
  const [w, setW] = useState(800);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((e) => setW(e[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const N = data.length;
  const [from, to] = range;
  const left = (from / (N - 1)) * 100;
  const right = (to / (N - 1)) * 100;
  // Build sparkline path
  let mn = Infinity, mx = -Infinity;
  for (const r of data) { const v = getY(r); if (v < mn) mn = v; if (v > mx) mx = v; }
  if (mx - mn < 1e-6) mx = mn + 1;
  let d = "";
  for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * w;
    const y = (height - 4) - ((getY(data[i]) - mn) / (mx - mn)) * (height - 8) + 2;
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1);
  }
  const area = `${d} L${w},${height} L0,${height} Z`;

  const drag = (mode) => (e) => {
    e.preventDefault();
    const rect = ref.current.getBoundingClientRect();
    const startX = e.clientX;
    const startFrom = from, startTo = to;
    const move = (ev) => {
      const dx = ev.clientX - startX;
      const dPct = dx / rect.width;
      let f = startFrom, t = startTo;
      if (mode === "l") f = clamp(Math.round(startFrom + dPct * (N-1)), 0, t - 5);
      else if (mode === "r") t = clamp(Math.round(startTo + dPct * (N-1)), f + 5, N-1);
      else { // pan
        const di = Math.round(dPct * (N-1));
        if (startFrom + di < 0) { f = 0; t = startTo - startFrom; }
        else if (startTo + di > N-1) { t = N-1; f = startFrom + (N-1 - startTo); }
        else { f = startFrom + di; t = startTo + di; }
      }
      onChange([f, t]);
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };
  return (
    <div className="brush" ref={ref}>
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
        <path d={area} fill={color} opacity=".18" />
        <path d={d} fill="none" stroke={color} strokeWidth="1" />
      </svg>
      <div className="brush-mask-l" style={{ left: 0, width: `${left}%` }} />
      <div className="brush-mask-r" style={{ right: 0, width: `${100-right}%` }} />
      <div className="brush-window" style={{ left: `${left}%`, width: `${right-left}%` }}
           onMouseDown={drag("pan")}>
        <span style={{position:"absolute", left:-6, top:0, bottom:0, width:12, cursor:"ew-resize"}}
              onMouseDown={drag("l")} />
        <span style={{position:"absolute", right:-6, top:0, bottom:0, width:12, cursor:"ew-resize"}}
              onMouseDown={drag("r")} />
      </div>
    </div>
  );
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

Object.assign(window, {
  Icon, I, Card, Tabs, Metric, Sparkline, LineChart, Brush,
  fmtDuration, fmtClock, fmtDate, fmtTime, fmtFileSize, fmtNum, unitize, clamp,
});
