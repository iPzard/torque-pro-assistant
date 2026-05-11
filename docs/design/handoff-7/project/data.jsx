/* data.jsx — synthetic Torque Pro session data
   Generates several realistic 30-min driving sessions: city + highway, with
   accel runs, cruise, idle. Values match the brief: RPM 800–6500,
   coolant 180–215°F, boost -10..+18 psi, AFR 14.7 cruise / 12.5 WOT, etc. */

const rand = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
};
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const ease = (t) => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;

function buildSession(meta) {
  const r = rand(meta.seed);
  const N = meta.duration; // seconds (1Hz)
  const t0 = new Date(meta.startedAt).getTime();

  // build a speed profile out of phases
  const phases = meta.phases; // [{kind, dur, peak}]
  const speed = new Array(N);  // mph
  let i = 0;
  for (const p of phases) {
    const len = Math.min(p.dur, N - i);
    for (let k = 0; k < len; k++) {
      const t = k / len;
      let v = 0;
      if (p.kind === 'idle') v = 0 + r() * 2;
      else if (p.kind === 'accel') v = ease(t) * p.peak;
      else if (p.kind === 'cruise') v = p.peak + Math.sin(k * 0.07) * 1.6 + (r()-.5)*0.6;
      else if (p.kind === 'decel') v = p.peak * (1 - ease(t));
      else if (p.kind === 'city') v = 12 + Math.sin(k * 0.04) * 8 + Math.sin(k * 0.13) * 4 + (r()-.5)*1.2;
      speed[i + k] = clamp(v, 0, 130);
    }
    i += len;
  }
  while (i < N) { speed[i] = speed[i-1] || 0; i++; }

  const data = new Array(N);
  let odo = 0;
  let coolant = 80; // °F start cold
  let oil = 70;
  for (let k = 0; k < N; k++) {
    const sp = speed[k];                    // mph
    const sp_ms = sp * 0.44704;
    odo += sp / 3600;                       // miles
    const accel = k > 0 ? (speed[k] - speed[k-1]) : 0;

    // RPM: simplistic gear-aware mapping
    const gear = sp < 5 ? 1 : sp < 18 ? 2 : sp < 35 ? 3 : sp < 55 ? 4 : sp < 78 ? 5 : 6;
    const ratios = { 1: 200, 2: 110, 3: 75, 4: 55, 5: 42, 6: 32 }; // rpm/mph
    let rpm = sp < 1 ? (820 + Math.sin(k*0.4) * 30) : sp * ratios[gear] + 600;
    if (accel > 0.6) rpm += 800 + accel * 600;
    rpm = clamp(rpm + (r()-.5)*40, 700, 6800);

    // Throttle (%)
    let throttle = clamp(accel > 0 ? 18 + accel * 26 : sp > 0 ? 12 + sp*0.04 : 4 + r()*2, 0, 100);
    if (accel > 1.5) throttle = clamp(throttle + 30, 0, 100);
    const pedal = clamp(throttle * 0.96 + (r()-.5)*1.5, 0, 100);
    const load = clamp(throttle * 0.85 + 8 + (r()-.5)*3, 0, 100);

    // Boost (psi): vacuum at idle/cruise low throttle, positive boost on accel
    let boost = -8 + throttle * 0.05;
    if (throttle > 50) boost = lerp(0, 18, (throttle-50)/50);
    boost = clamp(boost + (r()-.5)*0.4, -10, 19);

    // AFR — 14.7 cruise, 12.5 WOT
    const afr_cmd = throttle > 80 ? 12.5 : throttle > 60 ? lerp(14.7, 12.5, (throttle-60)/20) : 14.7;
    const afr_meas = clamp(afr_cmd + (r()-.5)*0.4, 11.5, 16);
    const lambda = afr_cmd / 14.7;

    // HP / Torque (rough): HP = (Tq*RPM)/5252; Tq peak ~340 lbft @ 3500
    const torqueCurve = 340 - Math.abs(rpm - 3500) * 0.035;
    const tq_lbft = clamp(torqueCurve * (throttle/100) + (r()-.5)*4, 0, 360);
    const tq_nm = tq_lbft * 1.356;
    const hp = clamp((tq_lbft * rpm) / 5252, 0, 320);
    const kw = hp * 0.7457;

    // Engine vitals warm up over first 4 minutes
    const warm = clamp(k / 240, 0, 1);
    coolant = lerp(coolant, lerp(180, 205, warm) + (throttle > 70 ? 4 : 0), 0.04);
    oil = lerp(oil, lerp(170, 215, warm) + (throttle > 70 ? 6 : 0), 0.02);
    const trans = lerp(120, 195, warm) + (sp > 60 ? 6 : 0);
    const iat = 78 + (r()-.5) * 2 + (throttle > 60 ? 8 : 0);
    const voltage = 14.0 + (r()-.5)*0.2 - (throttle > 70 ? 0.1 : 0);
    const timing = 18 + (rpm/6500)*12 - (throttle > 80 ? 4 : 0);

    // GPS  — march along a fake polyline
    const angle = k * 0.0007 + Math.sin(k*0.001) * 0.4;
    const lat = meta.gpsStart.lat + (k * 0.000004) * Math.cos(angle) + Math.sin(k*0.003)*0.0008;
    const lon = meta.gpsStart.lon + (k * 0.000005) * Math.sin(angle) + Math.cos(k*0.003)*0.0008;

    data[k] = {
      t: k,                        // seconds from start
      ts: t0 + k * 1000,
      speed_mph: sp,
      speed_kph: sp * 1.60934,
      speed_ms: sp_ms,
      rpm,
      throttle, pedal, load,
      load_abs: load * 0.92,
      ve: clamp(40 + load * 0.6, 30, 110),
      boost_psi: boost,
      boost_kpa: boost * 6.895,
      afr_cmd, afr_meas, lambda,
      maf: clamp(2 + load * 0.7 + rpm/700, 1, 90),     // g/s
      manifold_kpa: clamp(35 + throttle * 0.9, 30, 180),
      fuel_rate: clamp(0.4 + load * 0.04 + rpm/2400, 0.3, 22),  // L/h
      fuel_pressure: 58 + (r()-.5)*1.5,
      fuel_rail_abs: 2200 + throttle * 18,
      fuel_rail_rel: 600 + throttle * 6,
      hp, kw, tq_lbft, tq_nm,
      tq_actual_pct: clamp(tq_lbft / 3.4, 0, 100),
      tq_demand_pct: clamp(throttle * 1.05, 0, 100),
      coolant_f: coolant, coolant_c: (coolant-32)*5/9,
      oil_f: oil, oil_c: (oil-32)*5/9,
      trans_f: trans, trans_c: (trans-32)*5/9,
      iat_f: iat, iat_c: (iat-32)*5/9,
      voltage, timing,
      mpg: sp < 3 ? 0 : clamp(35 - throttle*0.18 + (sp>40 && sp<70 ? 6 : 0), 6, 48),
      co2: clamp(180 + throttle*1.5 - (sp>40&&sp<70 ? 30 : 0), 90, 400),
      odo,
      lat, lon,
      altitude: 412 + Math.sin(k*0.002)*40,
      bearing: (angle * 180/Math.PI) % 360,
      hdop: 0.8 + r()*0.4,
      gx: accel * 0.04, gy: (r()-.5)*0.05, gz: 0.99 + (r()-.5)*0.02,
      gcal: Math.abs(accel) * 0.04,
    };
  }
  return { meta, data };
}

const VEHICLE = { make: "Mercedes-Benz", model: "AMG GT 53", year: 2019, vin: "WDD2J6BB0KA000000" };

const SESSIONS = [
  buildSession({
    id: "s_2026-05-09_morning",
    name: "Morning commute",
    seed: 42,
    startedAt: "2026-05-09T07:42:18-07:00",
    duration: 1820,
    vehicle: VEHICLE,
    fileSize: 1842300,
    fileName: "trackLog-20260509-074218.csv",
    notes: "Cold start, 280E to 92W. Light traffic.",
    gpsStart: { lat: 37.4419, lon: -122.1430 },
    phases: [
      { kind: "idle",   dur: 45,  peak: 0 },
      { kind: "city",   dur: 280, peak: 30 },
      { kind: "accel",  dur: 18,  peak: 68 },
      { kind: "cruise", dur: 760, peak: 72 },
      { kind: "decel",  dur: 22,  peak: 72 },
      { kind: "city",   dur: 480, peak: 35 },
      { kind: "idle",   dur: 60,  peak: 0 },
      { kind: "city",   dur: 155, peak: 25 },
    ],
  }),
  buildSession({
    id: "s_2026-05-08_evening",
    name: "Evening drive — canyon road",
    seed: 99,
    startedAt: "2026-05-08T18:14:02-07:00",
    duration: 2640,
    vehicle: VEHICLE,
    fileSize: 2674120,
    fileName: "trackLog-20260508-181402.csv",
    notes: "Skyline. Several pulls to redline. New tune installed.",
    gpsStart: { lat: 37.3239, lon: -122.2580 },
    phases: [
      { kind: "idle",   dur: 28,  peak: 0 },
      { kind: "accel",  dur: 9,   peak: 60 },
      { kind: "cruise", dur: 240, peak: 55 },
      { kind: "accel",  dur: 11,  peak: 95 },
      { kind: "decel",  dur: 14,  peak: 95 },
      { kind: "city",   dur: 320, peak: 40 },
      { kind: "accel",  dur: 13,  peak: 105 },
      { kind: "decel",  dur: 18,  peak: 105 },
      { kind: "cruise", dur: 600, peak: 62 },
      { kind: "city",   dur: 540, peak: 38 },
      { kind: "accel",  dur: 12,  peak: 88 },
      { kind: "cruise", dur: 760, peak: 70 },
      { kind: "idle",   dur: 75,  peak: 0 },
    ],
  }),
  buildSession({
    id: "s_2026-05-05_track",
    name: "Thunderhill — track day",
    seed: 7,
    startedAt: "2026-05-05T11:08:55-07:00",
    duration: 1260,
    vehicle: VEHICLE,
    fileSize: 1280940,
    fileName: "trackLog-20260505-110855.csv",
    notes: "Session 3 of 4. 95°F ambient. Coolant peaked at end of straight.",
    gpsStart: { lat: 39.5360, lon: -122.3321 },
    phases: [
      { kind: "idle",   dur: 30,  peak: 0 },
      { kind: "accel",  dur: 10,  peak: 110 },
      { kind: "cruise", dur: 80,  peak: 90 },
      { kind: "decel",  dur: 8,   peak: 90 },
      { kind: "accel",  dur: 11,  peak: 118 },
      { kind: "cruise", dur: 60,  peak: 95 },
      { kind: "decel",  dur: 8,   peak: 95 },
      { kind: "accel",  dur: 12,  peak: 122 },
      { kind: "cruise", dur: 50,  peak: 100 },
      { kind: "decel",  dur: 7,   peak: 100 },
      { kind: "city",   dur: 120, peak: 60 },
      { kind: "accel",  dur: 10,  peak: 115 },
      { kind: "cruise", dur: 70,  peak: 95 },
      { kind: "city",   dur: 360, peak: 70 },
      { kind: "idle",   dur: 60,  peak: 0 },
      { kind: "accel",  dur: 9,   peak: 80 },
      { kind: "cruise", dur: 200, peak: 60 },
      { kind: "idle",   dur: 155, peak: 0 },
    ],
  }),
  buildSession({
    id: "s_2026-05-02_errands",
    name: "Saturday errands",
    seed: 311,
    startedAt: "2026-05-02T10:30:11-07:00",
    duration: 980,
    vehicle: VEHICLE,
    fileSize: 994100,
    fileName: "trackLog-20260502-103011.csv",
    notes: "",
    gpsStart: { lat: 37.4842, lon: -122.2356 },
    phases: [
      { kind: "idle",   dur: 20, peak: 0 },
      { kind: "city",   dur: 380, peak: 30 },
      { kind: "idle",   dur: 90, peak: 0 },
      { kind: "city",   dur: 320, peak: 28 },
      { kind: "idle",   dur: 60, peak: 0 },
      { kind: "city",   dur: 110, peak: 22 },
    ],
  }),
];

// Summary aggregation
function summarize(s) {
  const d = s.data;
  let maxSpeed=0, peakHp=0, peakTq=0, maxBoost=-99, maxCool=0, sumMpg=0, mpgN=0;
  let dist=0;
  let t0to30=null, t0to60=null;
  // 0-60 detection: from any 0 mph point to next 60+ mph
  for (let i = 0; i < d.length; i++) {
    const r = d[i];
    if (r.speed_mph > maxSpeed) maxSpeed = r.speed_mph;
    if (r.hp > peakHp) peakHp = r.hp;
    if (r.tq_lbft > peakTq) peakTq = r.tq_lbft;
    if (r.boost_psi > maxBoost) maxBoost = r.boost_psi;
    if (r.coolant_f > maxCool) maxCool = r.coolant_f;
    if (r.mpg > 0) { sumMpg += r.mpg; mpgN++; }
  }
  dist = d[d.length-1].odo;
  // 0-60
  for (let i = 0; i < d.length-1; i++) {
    if (d[i].speed_mph < 1 && d[i+1].speed_mph >= 1) {
      for (let j = i+1; j < Math.min(d.length, i+30); j++) {
        if (d[j].speed_mph >= 30 && t0to30 === null) t0to30 = j - i;
        if (d[j].speed_mph >= 60) { t0to60 = j - i; break; }
      }
      if (t0to60) break;
    }
  }
  return {
    maxSpeed, peakHp, peakTq, maxBoost, maxCool,
    avgMpg: mpgN > 0 ? sumMpg/mpgN : 0,
    dist, duration: s.meta.duration,
    t0to30, t0to60,
  };
}

// PID catalog — grouped, with units
const PID_CATEGORIES = [
  { id: "perf", label: "Performance", pids: [
    { key: "rpm",        label: "Engine RPM",                unit: "rpm",  color: "var(--d-rpm)",    range: [0, 7000] },
    { key: "speed_mph",  label: "Vehicle Speed",             unit: "mph",  color: "var(--d-speed)",  range: [0, 140], altUnit: { metric: { unit:"km/h", key:"speed_kph" } } },
    { key: "hp",         label: "Horsepower (at wheels)",    unit: "hp",   color: "var(--d-hp)",     range: [0, 320] },
    { key: "kw",         label: "Engine kW (at wheels)",     unit: "kW",   color: "var(--d-hp)",     range: [0, 240] },
    { key: "tq_lbft",    label: "Torque",                    unit: "lb·ft", color: "var(--d-torque)", range: [0, 360], altUnit: { metric: { unit:"Nm", key:"tq_nm" } } },
    { key: "tq_actual_pct", label: "Actual engine % torque", unit: "%",    color: "var(--d-torque)", range: [0, 100] },
    { key: "tq_demand_pct", label: "Driver demand % torque", unit: "%",    color: "#9ca3af",         range: [0, 100] },
  ]},
  { id: "vitals", label: "Engine Vitals", pids: [
    { key: "coolant_f",  label: "Coolant Temp",              unit: "°F",   color: "var(--d-coolant)",range: [60, 230], altUnit:{metric:{unit:"°C",key:"coolant_c"}}},
    { key: "oil_f",      label: "Oil Temp",                  unit: "°F",   color: "#fb7185",         range: [60, 240], altUnit:{metric:{unit:"°C",key:"oil_c"}}},
    { key: "trans_f",    label: "Transmission Temp",         unit: "°F",   color: "#f472b6",         range: [60, 230], altUnit:{metric:{unit:"°C",key:"trans_c"}}},
    { key: "iat_f",      label: "Intake Air Temp",           unit: "°F",   color: "var(--d-iat)",    range: [40, 140], altUnit:{metric:{unit:"°C",key:"iat_c"}}},
    { key: "voltage",    label: "Voltage (Control Module)",  unit: "V",    color: "#a78bfa",         range: [11, 15] },
    { key: "timing",     label: "Timing Advance",            unit: "°",    color: "#22d3ee",         range: [-10, 40] },
  ]},
  { id: "throttle", label: "Throttle / Load", pids: [
    { key: "throttle",   label: "Throttle Position (Manifold)", unit: "%", color: "var(--d-throttle)", range:[0,100] },
    { key: "pedal",      label: "Accelerator Pedal",         unit: "%",    color: "#e879f9",         range: [0, 100] },
    { key: "load",       label: "Engine Load",               unit: "%",    color: "var(--d-load)",   range: [0, 100] },
    { key: "load_abs",   label: "Engine Load (Absolute)",    unit: "%",    color: "#22c55e",         range: [0, 100] },
    { key: "ve",         label: "Volumetric Efficiency",     unit: "%",    color: "#84cc16",         range: [0, 120] },
  ]},
  { id: "airfuel", label: "Air & Fuel", pids: [
    { key: "afr_cmd",    label: "AFR — Commanded",           unit: ":1",   color: "var(--d-afr-cmd)",range: [10, 16] },
    { key: "afr_meas",   label: "AFR — Measured",            unit: ":1",   color: "var(--d-afr-meas)",range:[10,16] },
    { key: "lambda",     label: "Equivalence Ratio (lambda)",unit: "λ",    color: "#facc15",         range: [.7, 1.2] },
    { key: "boost_psi",  label: "Turbo Boost / Vacuum",      unit: "psi",  color: "var(--d-boost)",  range: [-10, 20], altUnit:{metric:{unit:"kPa",key:"boost_kpa"}}},
    { key: "maf",        label: "Mass Air Flow Rate",        unit: "g/s",  color: "#fb923c",         range: [0, 90] },
    { key: "manifold_kpa", label: "Intake Manifold Pressure", unit: "kPa", color: "#fbbf24",         range: [20, 200] },
    { key: "fuel_rate",  label: "Fuel Rate",                 unit: "L/h",  color: "#fde047",         range: [0, 24] },
    { key: "fuel_pressure", label: "Fuel Pressure",          unit: "psi",  color: "#fed7aa",         range: [40, 80] },
  ]},
  { id: "econ", label: "Economy", pids: [
    { key: "mpg",        label: "MPG",                       unit: "mpg",  color: "#4ade80",         range: [0, 50] },
    { key: "co2",        label: "CO₂",                       unit: "g/km", color: "#86efac",         range: [80, 420] },
  ]},
  { id: "gps", label: "GPS / Motion", pids: [
    { key: "altitude",   label: "Altitude",                  unit: "m",    color: "#67e8f9",         range: [350, 500] },
    { key: "bearing",    label: "Bearing",                   unit: "°",    color: "#a5b4fc",         range: [0, 360] },
    { key: "gcal",       label: "G (calibrated)",            unit: "g",    color: "#fda4af",         range: [0, 1.2] },
    { key: "hdop",       label: "HDOP",                      unit: "",     color: "#cbd5e1",         range: [0, 3] },
  ]},
];

// Flat lookup
const PID_BY_KEY = {};
PID_CATEGORIES.forEach((c) => c.pids.forEach((p) => { PID_BY_KEY[p.key] = { ...p, category: c.id }; }));

Object.assign(window, { SESSIONS, PID_CATEGORIES, PID_BY_KEY, summarize });
