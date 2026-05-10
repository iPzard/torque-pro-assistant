/**
 * Canonical session shape used across the renderer — slices, charts,
 * tables, and the CSV ingestion adapter all operate against this contract.
 *
 * Sessions are immutable after import. Field names mirror Torque Pro's
 * CSV column conventions (snake_case) so the CSV adapter is a straight
 * column-to-field map without a translation layer.
 */

/**
 * Vehicle metadata captured at import time. VIN is optional in the CSV
 * but the design uses it as the dedup key for "the same vehicle"; if the
 * CSV doesn't include one, the import flow asks the user.
 */
export interface Vehicle {
  readonly make: string;
  readonly model: string;
  readonly vin: string;
  readonly year: number;
}

/**
 * Session metadata — everything you can browse without loading the row
 * data. The Library table reads from this; the Session detail screen
 * pairs it with the companion `data` array.
 */
export interface SessionMeta {
  /** Duration in seconds. */
  readonly duration: number;
  readonly fileName: string;
  /** Source CSV size in bytes. */
  readonly fileSize: number;
  /** First GPS fix in the session — anchors mini-map previews. */
  readonly gpsStart: { readonly lat: number; readonly lon: number };
  /** Stable session identifier. */
  readonly id: string;
  readonly name: string;
  readonly notes: string;
  /** ISO 8601 start time including offset. */
  readonly startedAt: string;
  readonly vehicle: Vehicle;
}

/**
 * One sample from a Torque Pro CSV at one-second resolution. Field
 * naming mirrors Torque Pro's own column headers — `speed_mph`,
 * `coolant_f`, `afr_meas` — so the CSV adapter can do a straight
 * column-to-field map.
 *
 * Only `t` (sample index from start) and `ts` (wall-clock timestamp
 * milliseconds) are guaranteed; the user's chosen Torque Pro PID set
 * determines which other fields are present. Consumers must handle
 * missing fields.
 */
export interface SessionDataRow {
  readonly afr_cmd?: number;
  readonly afr_meas?: number;
  readonly altitude?: number;
  readonly bearing?: number;
  readonly boost_kpa?: number;
  readonly boost_psi?: number;
  readonly co2?: number;
  readonly coolant_c?: number;
  readonly coolant_f?: number;
  readonly fuel_pressure?: number;
  readonly fuel_rail_abs?: number;
  readonly fuel_rail_rel?: number;
  readonly fuel_rate?: number;
  readonly gcal?: number;
  readonly gx?: number;
  readonly gy?: number;
  readonly gz?: number;
  readonly hdop?: number;
  readonly hp?: number;
  readonly iat_c?: number;
  readonly iat_f?: number;
  readonly kw?: number;
  readonly lambda?: number;
  readonly lat?: number;
  readonly load?: number;
  readonly load_abs?: number;
  readonly lon?: number;
  readonly maf?: number;
  readonly manifold_kpa?: number;
  readonly mpg?: number;
  readonly odo?: number;
  readonly oil_c?: number;
  readonly oil_f?: number;
  readonly pedal?: number;
  readonly rpm?: number;
  readonly speed_kph?: number;
  readonly speed_mph?: number;
  readonly speed_ms?: number;
  /** Sample index — seconds from session start. */
  readonly t: number;
  readonly throttle?: number;
  readonly timing?: number;
  readonly tq_actual_pct?: number;
  readonly tq_demand_pct?: number;
  readonly tq_lbft?: number;
  readonly tq_nm?: number;
  readonly trans_c?: number;
  readonly trans_f?: number;
  /** Wall-clock timestamp in milliseconds since epoch. */
  readonly ts: number;
  readonly ve?: number;
  readonly voltage?: number;
}

/**
 * Aggregate metrics derived from a session's row data. Produced by
 * `summarize` in `utils/summarize/`. Numbers are imperial units (mph /
 * lb·ft / °F / psi / mpg / miles) per the design's Library defaults;
 * the renderer converts at display time when units mode is metric.
 */
export interface SessionSummary {
  /** Average MPG across moving samples (idle skipped). */
  readonly avgMpg: number;
  /** Distance traveled in miles. */
  readonly dist: number;
  /** Duration in seconds. */
  readonly duration: number;
  /** Peak boost pressure in psi. */
  readonly maxBoost: number;
  /** Peak coolant temperature in °F. */
  readonly maxCool: number;
  /** Top speed in mph. */
  readonly maxSpeed: number;
  /** Peak wheel horsepower. */
  readonly peakHp: number;
  /** Peak torque in lb·ft. */
  readonly peakTq: number;
  /** 0-to-30 mph time in seconds. `null` when no full launch was detected. */
  readonly t0to30: number | null;
  /** 0-to-60 mph time in seconds. `null` when no full launch was detected. */
  readonly t0to60: number | null;
}

/**
 * A complete session — metadata + the row data. Sessions persist in the
 * Redux store; the row data is large (~1 MB per 30-minute session), so
 * consumers that only need meta should select against `SessionMeta`
 * directly.
 */
export interface Session {
  readonly data: readonly SessionDataRow[];
  readonly meta: SessionMeta;
}
