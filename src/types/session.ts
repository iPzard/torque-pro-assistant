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
 * One sample from a Torque Pro CSV. Field naming mirrors Torque Pro's
 * own column header conventions — `speed_mph`, `coolant_f`, `afr_meas` —
 * so the CSV adapter can do a straight column-to-field map.
 *
 * Sampling is variable rate in real Torque Pro exports (the adapter
 * sees gaps from sub-second up to several seconds depending on the
 * vehicle's OBD-II responsiveness). `t` is elapsed wall-clock seconds
 * from the first row's parsed timestamp — NOT the sample index.
 *
 * Only `t` and `ts` are guaranteed; the user's chosen Torque Pro PID
 * set determines which other fields are present. Consumers must handle
 * missing fields.
 *
 * The index signature catches CSV columns the adapter recognizes by key
 * but that don't yet have a typed entry on this interface — promote
 * them when chart code starts consuming them.
 */
export interface SessionDataRow {
  /**
   * Catch-all for CSV columns the adapter recognizes by key but that
   * don't yet have a typed entry on this interface (catalyst temps,
   * exhaust gas temps, hybrid battery PIDs, etc.). Promote a field to
   * the typed list when chart or table code starts consuming it.
   */
  readonly [field: string]: number | undefined;
  /** Acceleration sensor total magnitude (g). */
  readonly accel_total_g?: number;
  readonly afr_cmd?: number;
  readonly afr_meas?: number;
  /** Alcohol fuel percentage. */
  readonly alcohol_pct?: number;
  readonly altitude?: number;
  /** Ambient air temperature (°C). */
  readonly ambient_c?: number;
  /** Ambient air temperature (°F). */
  readonly ambient_f?: number;
  /** Average trip speed across moving samples (mph). */
  readonly avg_speed_moving_mph?: number;
  /** Average trip speed across all samples (mph). */
  readonly avg_speed_total_mph?: number;
  readonly bearing?: number;
  /** Boost pressure — commanded, manifold A (psi). */
  readonly boost_cmd_a_psi?: number;
  /** Boost pressure — commanded, manifold B (psi). */
  readonly boost_cmd_b_psi?: number;
  readonly boost_kpa?: number;
  readonly boost_psi?: number;
  /** Boost pressure — sensor A (psi). */
  readonly boost_sensor_a_psi?: number;
  /** Boost pressure — sensor B (psi). */
  readonly boost_sensor_b_psi?: number;
  /** Charge air cooler temperature (°C). */
  readonly cact_c?: number;
  /** Charge air cooler temperature (°F). */
  readonly cact_f?: number;
  readonly co2?: number;
  /** CO₂ average across the session (g/km). */
  readonly co2_avg?: number;
  readonly coolant_c?: number;
  readonly coolant_f?: number;
  /** Fuel flow rate (gal/min) — distinct from `fuel_rate` (L/min). */
  readonly fuel_flow_gpm?: number;
  /** Fuel level in tank (%). */
  readonly fuel_level_pct?: number;
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
  /** Mass air flow — sensor A (g/s). */
  readonly maf_sensor_a?: number;
  /** Mass air flow — sensor B (g/s). */
  readonly maf_sensor_b?: number;
  /** Intake manifold absolute pressure, sensor A (psi). */
  readonly manifold_abs_a_psi?: number;
  /** Intake manifold absolute pressure, sensor B (psi). */
  readonly manifold_abs_b_psi?: number;
  readonly manifold_kpa?: number;
  /** Intake manifold pressure (psi) — same physical quantity as
   *  `manifold_kpa`, different source unit. */
  readonly manifold_psi?: number;
  readonly mpg?: number;
  readonly odo?: number;
  readonly oil_c?: number;
  readonly oil_f?: number;
  /** Percentage of session classified as city driving. */
  readonly pct_city?: number;
  /** Percentage of session classified as highway driving. */
  readonly pct_highway?: number;
  /** Percentage of session classified as idle. */
  readonly pct_idle?: number;
  readonly pedal?: number;
  readonly rpm?: number;
  readonly speed_kph?: number;
  readonly speed_mph?: number;
  readonly speed_ms?: number;
  /** Elapsed seconds from the first parsed timestamp in the session. */
  readonly t: number;
  readonly throttle?: number;
  /** Absolute Throttle Position B (%). */
  readonly throttle_b_abs?: number;
  /** Relative Throttle Position (%). */
  readonly throttle_rel?: number;
  /** Vehicle's last-reported 0-to-60-mph time (seconds). */
  readonly time_0_to_60_s?: number;
  readonly timing?: number;
  readonly tq_actual_pct?: number;
  readonly tq_demand_pct?: number;
  readonly tq_lbft?: number;
  readonly tq_nm?: number;
  /** Engine reference torque — vehicle-published nominal max (Nm). */
  readonly tq_reference_nm?: number;
  readonly trans_c?: number;
  readonly trans_f?: number;
  /** Wall-clock timestamp in milliseconds since epoch. */
  readonly ts: number;
  readonly ve?: number;
  readonly voltage?: number;
  /** Voltage at the OBD-II adapter (V) — distinct from `voltage`
   *  (control module). */
  readonly voltage_obd?: number;
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
