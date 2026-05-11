import type { ParsedCsv } from 'utils';

/** Hybrid-specific PIDs whose presence flags the session as a hybrid /
 *  EV capture. The catalog doesn't (yet) carry these — they're more
 *  recent Torque additions — so we string-match on the row's
 *  index-signature accessor. */
const HYBRID_PID_HINTS: readonly string[] = ['hybrid_battery_pct', 'state_of_charge', 'ev_motor_kw'];

/** Severity of a validation flag. `info` = neutral, `warn` = soft
 *  issue, `error` = blocker. The composer only blocks Save on
 *  `error`-level flags. */
export type ValidationLevel = 'error' | 'info' | 'warn';

/** One validation result — id + level + human-readable message +
 *  optional secondary detail (e.g. a row count or a unit hint). */
export interface ValidationFlag {
  readonly detail?: string;
  readonly id: string;
  readonly level: ValidationLevel;
  readonly message: string;
}

/**
 * Walk a `ParsedCsv` once and emit a flat list of validation flags
 * for the Import preview's checklist panel.
 *
 * Flags emitted (always; level varies):
 *   - `row-count` — error when zero rows, info otherwise (with the
 *     count).
 *   - `gps`       — info when any row carries `lat` + `lon`, warn
 *     when none do (the Map / MiniMap fall back to placeholders).
 *   - `monotonic` — info when timestamps strictly ascend, warn
 *     when any pair is out of order.
 *   - `hybrid`    — info when any hybrid-specific PID appears.
 *
 * @param parsed Output of `parseCsv`.
 * @returns A list of validation flags in stable order.
 */
export const validateParsed = (parsed: ParsedCsv): readonly ValidationFlag[] => {
  const flags: ValidationFlag[] = [];
  const rowCount = parsed.rows.length;

  flags.push({
    id:      'row-count',
    level:   rowCount === 0 ? 'error' : 'info',
    message: rowCount === 0
      ? 'No data rows detected.'
      : `${ rowCount.toLocaleString() } data rows.`
  });

  const hasGps = parsed.rows.some((row) => row.lat !== undefined && row.lon !== undefined);
  flags.push({
    id:      'gps',
    level:   hasGps ? 'info' : 'warn',
    message: hasGps
      ? 'GPS samples present — Map / MiniMap will render the route.'
      : 'No GPS samples — Map tab will fall back to placeholder.'
  });

  let backwardsCount = 0;
  for (let index = 1; index < parsed.rows.length; index += 1) {
    if (parsed.rows[index].ts < parsed.rows[index - 1].ts) {
      backwardsCount += 1;
    }
  }
  const monotonic = backwardsCount === 0;
  flags.push({
    detail: monotonic
      ? 'No backwards jumps'
      : `${ backwardsCount.toLocaleString() } row${ backwardsCount === 1 ? '' : 's' } jump backwards in time — likely a clock drift during recording. They will be re-sorted on import.`,
    id:    'monotonic',
    level: monotonic ? 'info' : 'warn',
    message: monotonic
      ? 'Time series is monotonic'
      : 'Non-monotonic timestamps'
  });

  const hybridHit = parsed.rows.some((row) =>
    HYBRID_PID_HINTS.some((pid) => row[pid] !== undefined)
  );
  if (hybridHit) {
    flags.push({
      id:      'hybrid',
      level:   'info',
      message: 'Hybrid / EV-specific PIDs detected.'
    });
  }

  return flags;
};
