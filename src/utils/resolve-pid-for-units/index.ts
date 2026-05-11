import { PID_BY_KEY } from 'data/pids';
import type { UnitsPreference } from 'state/preferences';

/** Resolved (key, unit) pair for a PID under the active units mode. */
export interface ResolvedPid {
  /** `SessionDataRow` field name to read values from. Swapped to the
   *  metric companion (e.g. `speed_kph` instead of `speed_mph`) when
   *  `units === 'metric'` and the catalog defines an `altUnit.metric`. */
  readonly key: string;
  /** Display unit suffix for tooltips / axis ticks. */
  readonly unit: string;
}

/**
 * Pick the (key, unit) pair to use for a PID under the active units
 * preference. When `units === 'metric'` and the catalog entry carries
 * an `altUnit.metric` companion, returns the metric key + unit; in
 * every other case returns the catalog entry's native key + unit, or
 * the raw input + an empty unit when the PID isn't in the catalog.
 *
 * Charts and tables that want runtime unit swapping read their series
 * key + unit through this helper instead of hardcoding `'speed_mph'` /
 * `'mph'` constants.
 *
 * @param pidKey Catalog key for the PID (e.g. `'speed_mph'`).
 * @param units  Active units preference.
 * @returns The resolved key + unit pair.
 */
export const resolvePidForUnits = (
  pidKey: string,
  units: UnitsPreference
): ResolvedPid => {
  const entry = PID_BY_KEY[pidKey];
  if (entry === undefined) {
    return { key: pidKey, unit: '' };
  }
  if (units === 'metric' && entry.altUnit?.metric !== undefined) {
    return { key: entry.altUnit.metric.key, unit: entry.altUnit.metric.unit };
  }
  return { key: entry.key, unit: entry.unit };
};
