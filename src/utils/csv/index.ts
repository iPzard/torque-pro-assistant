import Papa from 'papaparse';

import type { SessionDataRow } from 'types/session';

/**
 * CSV ingestion adapter for Torque Pro exports.
 *
 * Real Torque Pro CSV headers carry the source unit in trailing
 * parentheses, e.g. `"Speed (OBD)(mph)"`, `"Coolant Temperature(°F)"`,
 * `"Engine RPM(rpm)"`. The user's chosen PID set determines which
 * columns the export contains, so the adapter has to be tolerant —
 * unknown columns are reported but otherwise ignored, missing values
 * become `undefined`.
 *
 * Sampling rate is variable in real exports (sub-second early on,
 * ~1 Hz once the OBD-II adapter settles), so the row's `t` field is
 * elapsed seconds from the first parseable timestamp — not the sample
 * index. `ts` is the wall-clock millisecond timestamp.
 *
 * `parseCsv` returns:
 *   - `rows`             — one `SessionDataRow` per non-header CSV row.
 *   - `detectedColumns`  — original CSV header order plus which
 *                          `SessionDataRow` field each one mapped to
 *                          (or `null` if the column was unrecognized).
 *                          The Import-flow validation panel reads this.
 *
 * Disambiguation policy: SPECIFIC matchers come before GENERIC ones.
 * Real Torque exports have many columns that share substrings (multiple
 * boost columns, multiple voltage columns, multiple MAF columns). The
 * mapping table is ordered so that, e.g. `Voltage (OBD Adapter)` matches
 * `voltage_obd` first and never falls through to the generic `voltage`
 * pattern.
 */

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
  header.includes('afr')
  || containsAll(header, ['air/fuel', 'ratio'])
  || containsAll(header, ['air fuel', 'ratio']);

/**
 * Recognizes a Torque suffix-letter variant of a header — `' a('`
 * appears in `Boost Pressure Sensor A(psi)`, `' b('` in `B`, etc. Using
 * the leading space + opening paren as the marker avoids false positives
 * like the standalone 'b' in `absolute` or the 'a' in `air`.
 */
const hasVariantLetter = (header: string, letter: 'a' | 'b'): boolean =>
  header.includes(` ${letter}(`);

/**
 * One column-recognition rule. `matcher` runs against the lower-cased
 * header text; the first rule whose `matcher` returns true claims the
 * column. Specific matchers come before generic ones.
 */
interface ColumnMapping {
  readonly field: string;
  readonly matcher: (lowerHeader: string) => boolean;
}

/**
 * Header-to-field mapping table. Each entry's matcher runs against the
 * lower-cased header; first match wins. Order matters: more-specific
 * patterns must come before more-general ones (e.g. `relative throttle
 * position` before plain `throttle position`).
 */
const COLUMN_MAPPINGS: readonly ColumnMapping[] = [
  /**
   * Trip-average speed — must precede generic speed_mph because both
   * `Average trip speed(...)(mph)` and `Speed (OBD)(mph)` contain
   * `speed` and `mph`.
   */
  /**
   * Two Torque average-speed columns share substrings (both contain
   * `average trip speed` and `moving`). Disambiguate via "moving only"
   * vs "stopped or moving" before falling back to the generic matcher.
   */
  { field: 'avg_speed_moving_mph', matcher: (h) => containsAll(h, ['average', 'trip', 'speed', 'moving only']) && h.includes('mph') },
  { field: 'avg_speed_total_mph',  matcher: (h) => containsAll(h, ['average', 'trip', 'speed', 'stopped or moving']) && h.includes('mph') },

  // Speed (instantaneous, OBD or GPS)
  { field: 'speed_mph', matcher: (h) => containsAll(h, ['speed', '(obd)']) && h.includes('mph') },
  { field: 'speed_kph', matcher: (h) => h.includes('speed') && (h.includes('km/h') || h.includes('kph')) && !h.includes('average') },
  { field: 'speed_ms',  matcher: (h) => h.includes('speed') && (h.includes('m/s') || containsAll(h, ['meters', 'second'])) },

  // Throttle family — relative & absolute-B variants precede generic throttle
  { field: 'throttle_rel',   matcher: (h) => containsAll(h, ['relative', 'throttle', 'position']) },
  { field: 'throttle_b_abs', matcher: (h) => containsAll(h, ['absolute', 'throttle', 'position']) && hasVariantLetter(h, 'b') },
  { field: 'throttle',       matcher: (h) => containsAll(h, ['throttle', 'position']) },

  // Pedal / load / VE
  { field: 'pedal',    matcher: (h) => containsAll(h, ['accelerator', 'pedal']) || containsAll(h, ['pedal', 'position']) },
  { field: 'load_abs', matcher: (h) => containsAll(h, ['engine', 'load', 'absolute']) || containsAll(h, ['load', 'absolute']) },
  { field: 'load',     matcher: (h) => containsAll(h, ['engine', 'load']) || containsAll(h, ['calculated', 'load']) },
  { field: 've',       matcher: (h) => containsAll(h, ['volumetric', 'eff']) },

  // RPM — `engine rpm` is the canonical phrasing; `reference torque` also contains `engine` but not `rpm`
  { field: 'rpm', matcher: (h) => h.includes('engine rpm') || (h.includes('rpm') && !h.includes('reference')) },

  // Torque family — reference / actual%/ demand% precede plain torque
  { field: 'tq_reference_nm', matcher: (h) => containsAll(h, ['reference', 'torque']) && h.includes('nm') },
  { field: 'tq_actual_pct',   matcher: (h) => containsAll(h, ['actual', 'torque']) && h.includes('%') },
  { field: 'tq_demand_pct',   matcher: (h) => (containsAll(h, ['demand', 'torque']) || containsAll(h, ['demanded', 'torque'])) && h.includes('%') },
  { field: 'tq_lbft',         matcher: (h) => h.includes('torque') && (h.includes('lb') || h.includes('ft-lb') || h.includes('lbft')) },
  { field: 'tq_nm',           matcher: (h) => h.includes('torque') && h.includes('nm') && !h.includes('reference') },

  // Boost family — variant matchers (commanded / sensor + A/B) precede generic
  { field: 'boost_cmd_a_psi',    matcher: (h) => containsAll(h, ['boost', 'commanded']) && hasVariantLetter(h, 'a') && h.includes('psi') },
  { field: 'boost_cmd_b_psi',    matcher: (h) => containsAll(h, ['boost', 'commanded']) && hasVariantLetter(h, 'b') && h.includes('psi') },
  { field: 'boost_sensor_a_psi', matcher: (h) => containsAll(h, ['boost', 'sensor']) && hasVariantLetter(h, 'a') && h.includes('psi') },
  { field: 'boost_sensor_b_psi', matcher: (h) => containsAll(h, ['boost', 'sensor']) && hasVariantLetter(h, 'b') && h.includes('psi') },
  { field: 'boost_psi',          matcher: (h) => containsAll(h, ['turbo', 'boost']) && h.includes('psi') },
  { field: 'boost_kpa',          matcher: (h) => containsAll(h, ['turbo', 'boost']) && h.includes('kpa') },

  // Backward-compat boost (Library-side tests pass `Turbo Boost(psi)` without `Vacuum Gauge`)
  { field: 'boost_psi', matcher: (h) => h.includes('boost') && h.includes('psi') && !h.includes('commanded') && !h.includes('sensor') },
  { field: 'boost_kpa', matcher: (h) => h.includes('boost') && h.includes('kpa') && !h.includes('commanded') && !h.includes('sensor') },

  // AFR / lambda
  { field: 'afr_cmd',  matcher: (h) => isAfrHeader(h) && h.includes('commanded') },
  { field: 'afr_meas', matcher: (h) => isAfrHeader(h) && (h.includes('measured') || h.includes('actual')) },
  { field: 'lambda',   matcher: (h) => h.includes('lambda') || containsAll(h, ['equivalence', 'ratio']) },

  // MAF — sensor variants precede generic rate
  { field: 'maf_sensor_a', matcher: (h) => containsAll(h, ['mass air flow sensor']) && hasVariantLetter(h, 'a') },
  { field: 'maf_sensor_b', matcher: (h) => containsAll(h, ['mass air flow sensor']) && hasVariantLetter(h, 'b') },
  { field: 'maf',          matcher: (h) => containsAll(h, ['mass air flow rate']) || (containsAll(h, ['mass', 'air', 'flow']) && !h.includes('sensor')) },

  /**
   * Manifold pressure — Torque ships a typo here in some firmware
   * ("Manfold" instead of "Manifold"). Variant matchers for the typo'd
   * absolute-pressure columns AND the correctly-spelled generic, in
   * both psi and kPa.
   */
  { field: 'manifold_abs_a_psi', matcher: (h) => containsAll(h, ['intake', 'abs', 'pressure']) && hasVariantLetter(h, 'a') && h.includes('psi') },
  { field: 'manifold_abs_b_psi', matcher: (h) => containsAll(h, ['intake', 'abs', 'pressure']) && hasVariantLetter(h, 'b') && h.includes('psi') },
  { field: 'manifold_psi',       matcher: (h) => containsAll(h, ['intake', 'manifold', 'pressure']) && h.includes('psi') },
  { field: 'manifold_kpa',       matcher: (h) => containsAll(h, ['intake', 'manifold', 'pressure']) && h.includes('kpa') },

  // Fuel — rail-relative precedes rail-abs because both contain "fuel rail pressure"
  { field: 'fuel_rail_rel',  matcher: (h) => containsAll(h, ['fuel rail pressure', 'relative']) },
  { field: 'fuel_rail_abs',  matcher: (h) => containsAll(h, ['fuel rail pressure']) && !h.includes('relative') },
  { field: 'fuel_flow_gpm',  matcher: (h) => containsAll(h, ['fuel flow rate']) && h.includes('gal/min') },
  { field: 'fuel_rate',      matcher: (h) => containsAll(h, ['fuel', 'rate']) && !h.includes('flow') },
  { field: 'fuel_pressure',  matcher: (h) => containsAll(h, ['fuel pressure']) && !h.includes('rail') },
  { field: 'fuel_level_pct', matcher: (h) => containsAll(h, ['fuel level']) && h.includes('%') },
  { field: 'alcohol_pct',    matcher: (h) => containsAll(h, ['alcohol', 'fuel']) && h.includes('%') },

  // Power
  { field: 'hp', matcher: (h) => h.includes('horsepower') || containsAll(h, ['power', 'wheels']) },
  { field: 'kw', matcher: (h) => h.includes('kw') && (h.includes('engine') || h.includes('wheels')) },

  // Voltage — OBD-adapter variant precedes generic
  { field: 'voltage_obd', matcher: (h) => h.includes('voltage') && (h.includes('obd') || h.includes('adapter')) },
  { field: 'voltage',     matcher: (h) => h.includes('voltage') && h.includes('control') },

  // Temperatures (°F / °C variants for each thermometer)
  { field: 'coolant_f', matcher: (h) => h.includes('coolant') && hasFahrenheit(h) },
  { field: 'coolant_c', matcher: (h) => h.includes('coolant') && hasCelsius(h) },
  { field: 'oil_f',     matcher: (h) => containsAll(h, ['oil', 'temp']) && hasFahrenheit(h) },
  { field: 'oil_c',     matcher: (h) => containsAll(h, ['oil', 'temp']) && hasCelsius(h) },
  { field: 'trans_f',   matcher: (h) => containsAll(h, ['trans', 'temp']) && hasFahrenheit(h) },
  { field: 'trans_c',   matcher: (h) => containsAll(h, ['trans', 'temp']) && hasCelsius(h) },
  { field: 'iat_f',     matcher: (h) => (containsAll(h, ['intake', 'air', 'temp']) || h.includes('iat')) && hasFahrenheit(h) },
  { field: 'iat_c',     matcher: (h) => (containsAll(h, ['intake', 'air', 'temp']) || h.includes('iat')) && hasCelsius(h) },
  { field: 'ambient_f', matcher: (h) => containsAll(h, ['ambient', 'air', 'temp']) && hasFahrenheit(h) },
  { field: 'ambient_c', matcher: (h) => containsAll(h, ['ambient', 'air', 'temp']) && hasCelsius(h) },
  { field: 'cact_f',    matcher: (h) => (containsAll(h, ['charge', 'air', 'cooler']) || h.includes('cact')) && hasFahrenheit(h) },
  { field: 'cact_c',    matcher: (h) => (containsAll(h, ['charge', 'air', 'cooler']) || h.includes('cact')) && hasCelsius(h) },

  // Timing
  { field: 'timing', matcher: (h) => containsAll(h, ['timing', 'advance']) },

  // Economy — average variant precedes generic
  { field: 'co2_avg', matcher: (h) => (h.includes('co2') || h.includes('co₂')) && h.includes('average') },
  { field: 'co2',     matcher: (h) => (h.includes('co2') || h.includes('co₂')) && !h.includes('average') },
  { field: 'mpg',     matcher: (h) => h.includes('mpg') },

  // Driving profile
  { field: 'pct_city',    matcher: (h) => containsAll(h, ['percentage', 'city']) && h.includes('%') },
  { field: 'pct_highway', matcher: (h) => containsAll(h, ['percentage', 'highway']) && h.includes('%') },
  { field: 'pct_idle',    matcher: (h) => containsAll(h, ['percentage', 'idle']) && h.includes('%') },

  // G-forces — Torque emits literal `G(x)` etc.; design uses `Accel X` / `G-force X`
  { field: 'accel_total_g', matcher: (h) => containsAll(h, ['acceleration', 'sensor', 'total']) },
  { field: 'gx',   matcher: (h) => h === 'g(x)' || containsAll(h, ['g-force', 'x']) || containsAll(h, ['accel', 'x']) },
  { field: 'gy',   matcher: (h) => h === 'g(y)' || containsAll(h, ['g-force', 'y']) || containsAll(h, ['accel', 'y']) },
  { field: 'gz',   matcher: (h) => h === 'g(z)' || containsAll(h, ['g-force', 'z']) || containsAll(h, ['accel', 'z']) },
  { field: 'gcal', matcher: (h) => h === 'g(calibrated)' || containsAll(h, ['g', 'calibrated']) },

  // Misc
  { field: 'time_0_to_60_s', matcher: (h) => h.includes('0-60') && h.includes('time') },
  { field: 'odo',            matcher: (h) => h.includes('odometer') || containsAll(h, ['trip', 'distance']) },

  // GPS
  { field: 'lat',      matcher: (h) => h === 'latitude' || h.startsWith('latitude') || h === 'lat' },
  { field: 'lon',      matcher: (h) => h === 'longitude' || h.startsWith('longitude') || h === 'lon' },
  { field: 'altitude', matcher: (h) => h.includes('altitude') },
  { field: 'bearing',  matcher: (h) => h.includes('bearing') || h.includes('heading') },
  { field: 'hdop',     matcher: (h) => h.includes('hdop') || containsAll(h, ['horizontal', 'dilution', 'precision']) }
];

/**
 * Picks the canonical field for one CSV header, or `null` if the
 * header doesn't match any known pattern. Time columns (GPS Time /
 * Device Time) map to the sentinel `'time'` so the row builder knows
 * to parse a timestamp instead of a number.
 */
const detectColumn = (header: string): string | null => {
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
 * Handles two formats:
 *   - Device Time:  `"28-Oct-2024 13:50:51.185"` — reformatted before
 *                   handing to `Date.parse` (the dash separators
 *                   between day / month-name / year choke the parser).
 *   - GPS Time:     ISO 8601 or the verbose Java `Date.toString()`
 *                   form Torque uses (`"Mon Oct 28 15:46:36 PDT 2024"`)
 *                   — both go through `Date.parse` directly.
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
  readonly mappedTo: string | null;
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

  const fieldByHeader = new Map<string, string>();
  for (const detection of detectedColumns) {
    if (detection.mappedTo !== null) {
      fieldByHeader.set(detection.header, detection.mappedTo);
    }
  }

  /**
   * First pass: build per-row `{ data, parsedTs }`. Time-column writes
   * happen via the time sentinel ('time'); numeric columns write their
   * canonical field. Multiple time columns (GPS Time + Device Time) are
   * processed in header order — the last parseable value wins.
   */
  interface Intermediate { readonly data: Record<string, number>; readonly parsedTs: number | undefined }
  const intermediates: Intermediate[] = parsed.data.map((rawRow) => {
    const data: Record<string, number> = {};
    let parsedTs: number | undefined;
    for (const [header, value] of Object.entries(rawRow)) {
      const field = fieldByHeader.get(header);
      if (field === undefined) continue;
      if (field === 'time') {
        const parsed = parseTimestamp(value);
        if (parsed !== undefined) parsedTs = parsed;
        continue;
      }
      const numericValue = parseNumber(value);
      if (numericValue !== undefined) data[field] = numericValue;
    }
    return { data, parsedTs };
  });

  /**
   * Second pass: anchor `t` against the first parseable timestamp.
   * When NO row has a parseable timestamp, `t` falls back to the sample
   * index and `ts` synthesizes from `t * 1000` for chart compatibility.
   */
  const firstParsedTs = intermediates.find((row) => row.parsedTs !== undefined)?.parsedTs;
  const rows: SessionDataRow[] = intermediates.map((intermediate, sampleIndex) => {
    const ts = intermediate.parsedTs ?? sampleIndex * 1000;
    const t = firstParsedTs !== undefined && intermediate.parsedTs !== undefined
      ? (intermediate.parsedTs - firstParsedTs) / 1000
      : sampleIndex;
    /**
     * Dynamic key assignment requires the builder to use an
     * index-signature type (`Record<string, number>`). `t` and `ts`
     * are initialized above and every other `SessionDataRow` field is
     * optional, so the cast is structurally sound.
     */
    return { t, ts, ...intermediate.data } as unknown as SessionDataRow;
  });

  return { detectedColumns, rows };
};
