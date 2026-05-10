import type { Session, SessionDataRow, SessionSummary } from 'types/session';

/**
 * Number of samples to look ahead from a launch start when measuring
 * 0-30 / 0-60 mph times. At 1 Hz Torque Pro sampling that's ~30 seconds,
 * which is long enough to cover even the slowest real-world launches.
 */
const LAUNCH_LOOKAHEAD_SAMPLES = 30;

/** Output of {@link detectLaunchTimes}. */
interface LaunchTimes {
  readonly t0to30: number | null;
  readonly t0to60: number | null;
}

/**
 * Scans the row data for the first stand-still-to-cruise launch and
 * measures the time (in seconds at 1 Hz sampling) to 30 mph and 60 mph.
 * A "launch" is the transition from a row at `< 1 mph` to the next at
 * `>= 1 mph`. The scan looks ahead `LAUNCH_LOOKAHEAD_SAMPLES` rows from
 * each launch start; if the speed never reaches the threshold within
 * that window, the corresponding value stays `null`.
 *
 * Stops at the first launch that reaches 60 mph — subsequent launches
 * in the same session don't get measured. Matches the design's
 * single-launch convention.
 */
const detectLaunchTimes = (rows: readonly SessionDataRow[]): LaunchTimes => {
  let t0to30: number | null = null;
  let t0to60: number | null = null;

  for (let launchStart = 0; launchStart < rows.length - 1; launchStart += 1) {
    const speedHere = rows[launchStart].speed_mph;
    const speedNext = rows[launchStart + 1].speed_mph;
    if (speedHere === undefined || speedNext === undefined) continue;
    if (speedHere >= 1 || speedNext < 1) continue;

    const lookaheadEnd = Math.min(rows.length, launchStart + LAUNCH_LOOKAHEAD_SAMPLES);
    for (let candidate = launchStart + 1; candidate < lookaheadEnd; candidate += 1) {
      const speed = rows[candidate].speed_mph;
      if (speed === undefined) continue;
      if (speed >= 30 && t0to30 === null) t0to30 = candidate - launchStart;
      if (speed >= 60) {
        t0to60 = candidate - launchStart;
        break;
      }
    }
    if (t0to60 !== null) break;
  }

  return { t0to30, t0to60 };
};

/**
 * Walks a session's row data once and derives the headline metrics shown
 * across the Library table and the Session-detail Overview tab.
 *
 * Pass logic:
 *   1. Single-pass scan accumulating max speed, peak HP, peak torque,
 *      max boost, max coolant, and the MPG sum + sample count (idle
 *      samples — those with `mpg <= 0` — skipped).
 *   2. Distance read from the last row's `odo` (cumulative). Falls back
 *      to 0 if the last row has no `odo`.
 *   3. 0-30 / 0-60 detection delegated to `detectLaunchTimes`; returns
 *      `null` for either when no full launch is found in the data.
 *
 * Fields are imperial — convert at display time when units mode is
 * metric.
 *
 * @param session The session to summarize.
 * @returns Aggregate metrics. Individual fields may be 0 if the session
 *   doesn't carry the source data (e.g. `peakHp` is 0 when no horsepower
 *   PID was logged).
 */
export const summarize = (session: Session): SessionSummary => {
  const rows = session.data;
  let maxSpeed = 0;
  let peakHp = 0;
  let peakTq = 0;
  let maxBoost = -Infinity;
  let maxCool = 0;
  let mpgSum = 0;
  let mpgCount = 0;

  for (const row of rows) {
    if (row.speed_mph !== undefined && row.speed_mph > maxSpeed) maxSpeed = row.speed_mph;
    if (row.hp !== undefined && row.hp > peakHp) peakHp = row.hp;
    if (row.tq_lbft !== undefined && row.tq_lbft > peakTq) peakTq = row.tq_lbft;
    if (row.boost_psi !== undefined && row.boost_psi > maxBoost) maxBoost = row.boost_psi;
    if (row.coolant_f !== undefined && row.coolant_f > maxCool) maxCool = row.coolant_f;
    if (row.mpg !== undefined && row.mpg > 0) {
      mpgSum += row.mpg;
      mpgCount += 1;
    }
  }

  const dist = rows.length > 0 ? (rows[rows.length - 1].odo ?? 0) : 0;
  const { t0to30, t0to60 } = detectLaunchTimes(rows);

  return {
    avgMpg: mpgCount > 0 ? mpgSum / mpgCount : 0,
    dist,
    duration: session.meta.duration,
    /**
     * Boost can be negative (vacuum), so the accumulator starts at
     * -Infinity. Normalize to 0 when no boost PID was logged.
     */
    maxBoost: maxBoost === -Infinity ? 0 : maxBoost,
    maxCool,
    maxSpeed,
    peakHp,
    peakTq,
    t0to30,
    t0to60
  };
};
