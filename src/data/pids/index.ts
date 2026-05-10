/**
 * PID catalog — the canonical list of OBD-II parameters Torque Pro can
 * log, grouped by category for the PID picker drawer. Each entry carries
 * the key the CSV adapter writes into `SessionDataRow`, a human-readable
 * label, its display unit, the line color to use in charts, and the
 * expected display range for axis scaling.
 *
 * Categories follow the design's `data.jsx` PID grouping:
 *   - perf       Performance (RPM, speed, HP, torque)
 *   - vitals     Engine vitals (coolant, oil, trans, IAT, voltage, timing)
 *   - throttle   Throttle / load (pedal position, engine load, VE)
 *   - airfuel    Air & fuel (AFR, lambda, boost, MAF, fuel rate / pressure)
 *   - econ       Economy (MPG, CO2)
 *   - gps        GPS & motion (altitude, bearing, G-forces, HDOP)
 *
 * Colors are hex literals taken from the design's CSS custom properties
 * (`--d-rpm`, `--d-speed`, etc.). When shared theme tokens land, swap
 * these for `var(--mantine-color-...)` strings without changing the rest
 * of the surface.
 */

/**
 * Optional alternate-unit mapping for PIDs that have a metric companion
 * field in the CSV (e.g. `speed_mph` → `speed_kph`, `tq_lbft` → `tq_nm`).
 * Used by the renderer to swap which `SessionDataRow` field drives the
 * chart when units mode is metric.
 */
export interface PidAltUnit {
  readonly metric: {
    /** Field name on `SessionDataRow` carrying the metric value. */
    readonly key: string;
    /** Display unit for the metric value (e.g. `'km/h'`, `'Nm'`). */
    readonly unit: string;
  };
}

/**
 * A single PID definition. `key` matches a field on `SessionDataRow`;
 * `category` is filled in by the `PID_BY_KEY` index and is therefore
 * optional on raw catalog entries.
 */
export interface PidEntry {
  /** Optional metric companion. Present only for PIDs that carry a
   *  metric value under a different field name. */
  readonly altUnit?: PidAltUnit;
  /** Identifier of the category this PID belongs to. Populated by
   *  `PID_BY_KEY`; absent from raw catalog entries. */
  readonly category?: PidCategoryId;
  /** Hex color used for this PID's line / fill in charts. */
  readonly color: string;
  /** `SessionDataRow` field name. */
  readonly key: string;
  /** Human-readable display label. */
  readonly label: string;
  /** Expected axis range for charts: `[min, max]` in display units. */
  readonly range: readonly [number, number];
  /** Display unit (e.g. `'rpm'`, `'mph'`, `'°F'`). */
  readonly unit: string;
}

/** Stable category identifiers used in URLs, drawer filters, and indices. */
export type PidCategoryId =
  | 'airfuel'
  | 'econ'
  | 'gps'
  | 'perf'
  | 'throttle'
  | 'vitals';

/**
 * A grouped set of PIDs. Categories render as the section headers in the
 * Charts-tab PID picker drawer.
 */
export interface PidCategory {
  readonly id: PidCategoryId;
  readonly label: string;
  readonly pids: readonly PidEntry[];
}

/**
 * The catalog itself. Order within each `pids` array matches the design's
 * picker drawer; categories themselves are listed in display order.
 */
export const PID_CATEGORIES: readonly PidCategory[] = [
  {
    id: 'perf',
    label: 'Performance',
    pids: [
      { color: '#ffb020', key: 'rpm',            label: 'Engine RPM',                 range: [0, 7000], unit: 'rpm' },
      { altUnit: { metric: { key: 'speed_kph', unit: 'km/h' } }, color: '#6fd3f7', key: 'speed_mph', label: 'Vehicle Speed', range: [0, 140], unit: 'mph' },
      { color: '#ff6f3c', key: 'hp',             label: 'Horsepower (at wheels)',     range: [0, 320], unit: 'hp' },
      { color: '#ff6f3c', key: 'kw',             label: 'Engine kW (at wheels)',      range: [0, 240], unit: 'kW' },
      { altUnit: { metric: { key: 'tq_nm', unit: 'Nm' } }, color: '#61dafb', key: 'tq_lbft', label: 'Torque', range: [0, 360], unit: 'lb·ft' },
      { color: '#61dafb', key: 'tq_actual_pct',  label: 'Actual engine % torque',     range: [0, 100], unit: '%' },
      { color: '#9ca3af', key: 'tq_demand_pct',  label: 'Driver demand % torque',     range: [0, 100], unit: '%' }
    ]
  },
  {
    id: 'vitals',
    label: 'Engine Vitals',
    pids: [
      { altUnit: { metric: { key: 'coolant_c', unit: '°C' } }, color: '#fb923c', key: 'coolant_f', label: 'Coolant Temp', range: [60, 230], unit: '°F' },
      { altUnit: { metric: { key: 'oil_c', unit: '°C' } },     color: '#fb7185', key: 'oil_f',     label: 'Oil Temp',     range: [60, 240], unit: '°F' },
      { altUnit: { metric: { key: 'trans_c', unit: '°C' } },   color: '#f472b6', key: 'trans_f',   label: 'Transmission Temp', range: [60, 230], unit: '°F' },
      { altUnit: { metric: { key: 'iat_c', unit: '°C' } },     color: '#a3e635', key: 'iat_f',     label: 'Intake Air Temp',   range: [40, 140], unit: '°F' },
      { color: '#a78bfa', key: 'voltage', label: 'Voltage (Control Module)', range: [11, 15], unit: 'V' },
      { color: '#22d3ee', key: 'timing',  label: 'Timing Advance',           range: [-10, 40], unit: '°' }
    ]
  },
  {
    id: 'throttle',
    label: 'Throttle / Load',
    pids: [
      { color: '#c084fc', key: 'throttle', label: 'Throttle Position (Manifold)', range: [0, 100], unit: '%' },
      { color: '#e879f9', key: 'pedal',    label: 'Accelerator Pedal',            range: [0, 100], unit: '%' },
      { color: '#34d399', key: 'load',     label: 'Engine Load',                  range: [0, 100], unit: '%' },
      { color: '#22c55e', key: 'load_abs', label: 'Engine Load (Absolute)',       range: [0, 100], unit: '%' },
      { color: '#84cc16', key: 've',       label: 'Volumetric Efficiency',        range: [0, 120], unit: '%' }
    ]
  },
  {
    id: 'airfuel',
    label: 'Air & Fuel',
    pids: [
      { color: '#94a3b8', key: 'afr_cmd',      label: 'AFR — Commanded',       range: [10, 16], unit: ':1' },
      { color: '#ffd166', key: 'afr_meas',     label: 'AFR — Measured',        range: [10, 16], unit: ':1' },
      { color: '#facc15', key: 'lambda',       label: 'Equivalence Ratio (lambda)', range: [0.7, 1.2], unit: 'λ' },
      { altUnit: { metric: { key: 'boost_kpa', unit: 'kPa' } }, color: '#f87171', key: 'boost_psi', label: 'Turbo Boost / Vacuum', range: [-10, 20], unit: 'psi' },
      { color: '#fb923c', key: 'maf',          label: 'Mass Air Flow Rate',    range: [0, 90], unit: 'g/s' },
      { color: '#fbbf24', key: 'manifold_kpa', label: 'Intake Manifold Pressure', range: [20, 200], unit: 'kPa' },
      { color: '#fde047', key: 'fuel_rate',    label: 'Fuel Rate',             range: [0, 24], unit: 'L/h' },
      { color: '#fed7aa', key: 'fuel_pressure', label: 'Fuel Pressure',        range: [40, 80], unit: 'psi' }
    ]
  },
  {
    id: 'econ',
    label: 'Economy',
    pids: [
      { color: '#4ade80', key: 'mpg', label: 'MPG', range: [0, 50],   unit: 'mpg' },
      { color: '#86efac', key: 'co2', label: 'CO₂', range: [80, 420], unit: 'g/km' }
    ]
  },
  {
    id: 'gps',
    label: 'GPS / Motion',
    pids: [
      { color: '#67e8f9', key: 'altitude', label: 'Altitude',           range: [350, 500], unit: 'm' },
      { color: '#a5b4fc', key: 'bearing',  label: 'Bearing',            range: [0, 360],   unit: '°' },
      { color: '#fda4af', key: 'gcal',     label: 'G (calibrated)',     range: [0, 1.2],   unit: 'g' },
      { color: '#cbd5e1', key: 'hdop',     label: 'HDOP',               range: [0, 3],     unit: '' }
    ]
  }
];

/**
 * Flat key → entry index. Built once at module load by flattening
 * `PID_CATEGORIES` and tagging each entry with its `category` id. Use
 * this when you have a PID key and want its metadata in one hop —
 * e.g. resolving the line color for `'boost_psi'` without walking the
 * tree.
 */
export const PID_BY_KEY: Readonly<Record<string, PidEntry>> = (() => {
  const index: Record<string, PidEntry> = {};
  for (const category of PID_CATEGORIES) {
    for (const pid of category.pids) {
      index[pid.key] = { ...pid, category: category.id };
    }
  }
  return index;
})();
