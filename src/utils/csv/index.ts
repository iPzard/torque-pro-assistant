import Papa from 'papaparse';

import type { SessionDataRow } from 'types/session';

/**
 * CSV ingestion adapter for Torque Pro exports.
 *
 * Real Torque Pro CSV headers carry the source unit in trailing
 * parentheses, e.g. `"Speed (OBD)(mph)"`, `"Coolant Temperature(°F)"`,
 * `"Engine RPM(rpm)"`. The user's chosen PID set determines which
 * columns the export contains, so the adapter has to be tolerant —
 * unknown columns are ignored, missing values become `undefined`.
 *
 * `parseCsv` returns:
 *   - `rows`             — one `SessionDataRow` per non-header CSV row.
 *                          `t` is the zero-based sample index; `ts` is
 *                          parsed from the time column if present,
 *                          otherwise reconstructed as `t * 1000`.
 *   - `detectedColumns`  — original CSV header order plus which
 *                          `SessionDataRow` field each one mapped to
 *                          (or `null` if the column was ignored). The
 *                          Import-flow validation panel reads this.
 *
 * This module covers the most common ~25 PIDs the Torque Pro UI offers
 * out of the box. Less-common headers can be added to
 * `COLUMN_MAPPINGS` without touching the rest of the pipeline.
 */

/** Fields the CSV adapter writes into; `t` and `ts` are managed separately. */
type CsvField = Exclude<keyof SessionDataRow, 't' | 'ts'>;

/**
 * One column-recognition rule. `matcher` runs against the lower-cased
 * header text; the first rule whose `matcher` returns true claims the
 * column.
 */
interface ColumnMapping {
  readonly field: CsvField;
  readonly matcher: (lowerHeader: string) => boolean;
}

/** Returns true when `haystack` contains every needle (caller lower-cases first). */
const containsAll = (haystack: string, needles: readonly string[]): boolean =>
  needles.every((needle) => haystack.includes(needle));

/** Recognizes the °F / (F) / Fahrenheit unit suffix in a header. */
const hasFahrenheit = (header: string): boolean =>
  header.includes('°f') || header.includes('(f)') || header.includes('fahrenheit');

/** Recognizes the °C / (C) / Celsius unit suffix in a header. */
const hasCelsius = (header: string): boolean =>
  header.includes('°c') || header.includes('(c)') || header.includes('celsius');

/** Returns true when the header references AFR in either common spelling. */
const isAfrHeader = (header: string): boolean =>
  header.includes('afr') || containsAll(header, ['air/fuel', 'ratio']) || containsAll(header, ['air fuel', 'ratio']);

/**
 * Header-to-field mapping table. Patterns target substrings of the
 * lower-cased header so the rules survive minor Torque Pro labelling
 * differences (`"Coolant Temperature(°F)"` vs `"Coolant Temp(F)"`).
 *
 * Order matters: more-specific patterns must come before more-general
 * ones (e.g. `engine load (absolute)` before plain `engine load`).
 */
const COLUMN_MAPPINGS: readonly ColumnMapping[] = [
  // Speed
  { field: 'speed_mph', matcher: (h) => containsAll(h, ['speed', 'mph']) },
  { field: 'speed_kph', matcher: (h) => h.includes('speed') && (h.includes('km/h') || h.includes('kph')) },
  { field: 'speed_ms',  matcher: (h) => h.includes('speed') && (h.includes('m/s') || containsAll(h, ['meters', 'second'])) },

  // Throttle / load / VE
  { field: 'throttle', matcher: (h) => containsAll(h, ['throttle', 'position']) },
  { field: 'pedal',    matcher: (h) => containsAll(h, ['accelerator', 'pedal']) || containsAll(h, ['pedal', 'position']) },
  { field: 'load_abs', matcher: (h) => containsAll(h, ['engine', 'load', 'absolute']) || containsAll(h, ['load', 'absolute']) },
  { field: 'load',     matcher: (h) => containsAll(h, ['engine', 'load']) || containsAll(h, ['calculated', 'load']) },
  { field: 've',       matcher: (h) => containsAll(h, ['volumetric', 'eff']) },

  // RPM (after speed so "Engine Speed (rpm)" style still routes correctly)
  { field: 'rpm', matcher: (h) => h.includes('rpm') || (containsAll(h, ['engine', 'speed']) && !h.includes('mph') && !h.includes('kph')) },

  // Boost
  { field: 'boost_psi', matcher: (h) => h.includes('boost') && h.includes('psi') },
  { field: 'boost_kpa', matcher: (h) => h.includes('boost') && h.includes('kpa') },

  // AFR / lambda
  { field: 'afr_cmd',  matcher: (h) => isAfrHeader(h) && h.includes('commanded') },
  { field: 'afr_meas', matcher: (h) => isAfrHeader(h) && (h.includes('measured') || h.includes('actual')) },
  { field: 'lambda',   matcher: (h) => h.includes('lambda') || containsAll(h, ['equivalence', 'ratio']) },

  // Air & fuel
  { field: 'maf',            matcher: (h) => containsAll(h, ['mass', 'air', 'flow']) },
  { field: 'manifold_kpa',   matcher: (h) => h.includes('manifold') && (h.includes('pressure') || h.includes('kpa')) },
  { field: 'fuel_rate',      matcher: (h) => containsAll(h, ['fuel', 'rate']) || containsAll(h, ['instant', 'fuel']) },
  { field: 'fuel_rail_abs',  matcher: (h) => containsAll(h, ['fuel', 'rail', 'absolute']) },
  { field: 'fuel_rail_rel',  matcher: (h) => containsAll(h, ['fuel', 'rail']) },
  { field: 'fuel_pressure',  matcher: (h) => containsAll(h, ['fuel', 'pressure']) && !h.includes('rail') },

  // Power / torque
  { field: 'hp',             matcher: (h) => h.includes('horsepower') || containsAll(h, ['power', 'wheels']) },
  { field: 'kw',             matcher: (h) => h.includes('kw') && h.includes('engine') },
  { field: 'tq_actual_pct',  matcher: (h) => containsAll(h, ['actual', 'torque']) && h.includes('%') },
  { field: 'tq_demand_pct',  matcher: (h) => (containsAll(h, ['demand', 'torque']) || containsAll(h, ['demanded', 'torque'])) && h.includes('%') },
  { field: 'tq_lbft',        matcher: (h) => h.includes('torque') && (h.includes('lb') || h.includes('ft-lb') || h.includes('lbft')) },
  { field: 'tq_nm',          matcher: (h) => h.includes('torque') && h.includes('nm') },

  // Vitals — temperatures (°F vs °C)
  { field: 'coolant_f', matcher: (h) => h.includes('coolant') && hasFahrenheit(h) },
  { field: 'coolant_c', matcher: (h) => h.includes('coolant') && hasCelsius(h) },
  { field: 'oil_f',     matcher: (h) => containsAll(h, ['oil', 'temp']) && hasFahrenheit(h) },
  { field: 'oil_c',     matcher: (h) => containsAll(h, ['oil', 'temp']) && hasCelsius(h) },
  { field: 'trans_f',   matcher: (h) => containsAll(h, ['trans', 'temp']) && hasFahrenheit(h) },
  { field: 'trans_c',   matcher: (h) => containsAll(h, ['trans', 'temp']) && hasCelsius(h) },
  { field: 'iat_f',     matcher: (h) => (containsAll(h, ['intake', 'air']) || h.includes('iat')) && hasFahrenheit(h) },
  { field: 'iat_c',     matcher: (h) => (containsAll(h, ['intake', 'air']) || h.includes('iat')) && hasCelsius(h) },

  // Misc vitals
  { field: 'voltage', matcher: (h) => h.includes('voltage') || containsAll(h, ['control', 'module']) },
  { field: 'timing',  matcher: (h) => containsAll(h, ['timing', 'advance']) },

  // Economy
  { field: 'mpg', matcher: (h) => h.includes('mpg') },
  { field: 'co2', matcher: (h) => h.includes('co2') || h.includes('co₂') },

  // GPS / motion
  { field: 'odo',      matcher: (h) => h.includes('odometer') || containsAll(h, ['trip', 'distance']) },
  { field: 'lat',      matcher: (h) => h === 'latitude' || h.startsWith('latitude') || h === 'lat' },
  { field: 'lon',      matcher: (h) => h === 'longitude' || h.startsWith('longitude') || h === 'lon' },
  { field: 'altitude', matcher: (h) => h.includes('altitude') },
  { field: 'bearing',  matcher: (h) => h.includes('bearing') || h.includes('heading') },
  { field: 'hdop',     matcher: (h) => h.includes('hdop') },
  { field: 'gx',       matcher: (h) => containsAll(h, ['accel', 'x']) || containsAll(h, ['g-force', 'x']) },
  { field: 'gy',       matcher: (h) => containsAll(h, ['accel', 'y']) || containsAll(h, ['g-force', 'y']) },
  { field: 'gz',       matcher: (h) => containsAll(h, ['accel', 'z']) || containsAll(h, ['g-force', 'z']) },
  { field: 'gcal',     matcher: (h) => containsAll(h, ['g', 'calibrated']) || h.includes('g(calibrated)') }
];

/**
 * Picks the canonical field for one CSV header, or `null` if the
 * header doesn't match any known pattern. Time columns (GPS Time /
 * Device Time) map to the sentinel `'time'` so the row builder knows
 * to parse a timestamp instead of a number.
 */
const detectColumn = (header: string): CsvField | 'time' | null => {
  const lower = header.toLowerCase().trim();
  if (lower.includes('gps time') || lower.includes('device time') || lower === 'time') return 'time';
  for (const mapping of COLUMN_MAPPINGS) {
    if (mapping.matcher(lower)) return mapping.field;
  }
  return null;
};

/**
 * Parse a numeric string from a Torque Pro CSV cell. Returns `undefined`
 * for empty strings, `'-'`, `'?'`, `NaN`, or anything else that fails
 * `Number()` — those become missing fields on the row.
 */
const parseNumber = (raw: string | undefined): number | undefined => {
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === '-' || trimmed === '?') return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/**
 * Parse a Torque Pro time cell into a milliseconds-since-epoch number.
 * The Torque Pro export uses dates like `"10-May-2026 09:34:12.345"`,
 * which `Date.parse` chokes on; we reformat to ISO-like before passing.
 * Falls back to `Date.parse` for already-ISO inputs.
 */
const parseTimestamp = (raw: string | undefined): number | undefined => {
  if (raw === undefined || raw.trim() === '') return undefined;
  const trimmed = raw.trim();
  const torqueShape = /^(\d{1,2})-([A-Za-z]{3})-(\d{4}) (\d{1,2}:\d{2}:\d{2}(?:\.\d+)?)$/.exec(trimmed);
  if (torqueShape !== null) {
    const [, day, month, year, time] = torqueShape;
    const reformatted = `${day} ${month} ${year} ${time}`;
    const millis = Date.parse(reformatted);
    if (!Number.isNaN(millis)) return millis;
  }
  const direct = Date.parse(trimmed);
  return Number.isNaN(direct) ? undefined : direct;
};

/** Describes how one CSV column was interpreted. */
export interface ColumnDetection {
  /** Original header text from the CSV. */
  readonly header: string;
  /** Canonical field this column maps to, or `null` if unrecognized. */
  readonly mappedTo: CsvField | 'time' | null;
}

/** Parsed CSV output. */
export interface ParsedCsv {
  readonly detectedColumns: readonly ColumnDetection[];
  readonly rows: readonly SessionDataRow[];
}

/**
 * Parses a Torque Pro CSV export into typed session rows.
 *
 * @param csvText Raw CSV body. Must include a header row.
 * @returns Parsed rows + the column-by-column mapping report. The
 *   report is what the Import-flow validation panel renders to show
 *   which PIDs were recognized.
 */
export const parseCsv = (csvText: string): ParsedCsv => {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  const headers = parsed.meta.fields ?? [];
  const detectedColumns = headers.map((header): ColumnDetection => ({
    header,
    mappedTo: detectColumn(header)
  }));

  const fieldByHeader = new Map<string, CsvField | 'time'>();
  for (const detection of detectedColumns) {
    if (detection.mappedTo !== null) {
      fieldByHeader.set(detection.header, detection.mappedTo);
    }
  }

  const rows: SessionDataRow[] = parsed.data.map((rawRow, sampleIndex) => {
    const row: Record<string, number> = { t: sampleIndex, ts: sampleIndex * 1000 };
    for (const [header, value] of Object.entries(rawRow)) {
      const field = fieldByHeader.get(header);
      if (field === undefined) continue;
      if (field === 'time') {
        const parsedTs = parseTimestamp(value);
        if (parsedTs !== undefined) row.ts = parsedTs;
        continue;
      }
      const numericValue = parseNumber(value);
      if (numericValue !== undefined) row[field] = numericValue;
    }
    /**
     * Dynamic key assignment requires the builder to use an
     * index-signature type (`Record<string, number>`). `t` and `ts`
     * are initialized above and every other `SessionDataRow` field is
     * optional, so the cast is structurally sound — there's no narrower
     * path that satisfies both the index access and the final type.
     */
    return row as unknown as SessionDataRow;
  });

  return { detectedColumns, rows };
};
