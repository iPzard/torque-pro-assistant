import type { Session, SessionDataRow } from 'types/session';

/** Alignment modes — how to shift each session's elapsed `t` axis so
 *  multi-session overlays line up sensibly. */
export type Alignment = 'gps' | 'trip-start';

/** Color palette cycled across overlaid sessions. Cyan / amber / red /
 *  green / violet — visible on both light + dark backgrounds and avoids
 *  the AFR / boost defaults so chart legends stay readable. */
const SESSION_COLORS: readonly string[] = [
  'var(--mantine-color-cyan-4)',
  'var(--mantine-color-amber-6)',
  'var(--mantine-color-red-5)',
  'var(--mantine-color-green-5)',
  'var(--mantine-color-violet-4)'
];

/** One series of the overlay dataset — a single session's contribution
 *  for a single PID. The chart renders one of these per session per PID. */
export interface OverlaySeries {
  readonly color: string;
  /** Resolves to `SessionDataRow` field name with the session id
   *  prefixed: `${ sessionId }::${ pid }`. */
  readonly key: string;
  readonly label: string;
  readonly pid: string;
  readonly sessionId: string;
}

/** One row in the merged overlay dataset. `t` is the (alignment-shifted)
 *  elapsed seconds; every other key is `${ sessionId }::${ pid }`. */
export interface OverlayRow {
  readonly [key: string]: number | undefined;
  readonly t: number;
}

/** Output of {@link buildOverlayDataset}. */
export interface OverlayDataset {
  readonly data: readonly OverlayRow[];
  readonly series: readonly OverlaySeries[];
}

/**
 * Walks a session looking for the first row with both `lat` and `lon`
 * defined. Returns its `t`, or `0` if no GPS lock was found — keeps the
 * GPS alignment from blowing up on OBD-only sessions (they fall back
 * to trip-start alignment for that session).
 */
const findGpsLockOffset = (rows: readonly SessionDataRow[]): number => {
  for (const row of rows) {
    if (row.lat !== undefined && row.lon !== undefined) return row.t;
  }
  return 0;
};

/**
 * Build the merged dataset + series description for the Compare page's
 * overlay charts. Each input session contributes one row per sample to
 * the merged array with its values stored under the prefixed key
 * `${ sessionId }::${ pid }`, and the array is sorted ascending by `t`.
 *
 * Recharts plots each series independently — gaps in one session's
 * values (rows where another session contributed instead) get joined
 * by `connectNulls=true` at the chart layer.
 *
 * Alignment:
 *   - `trip-start` — `t` stays as-is (each session's elapsed seconds).
 *   - `gps`        — every session's `t` is shifted so its first GPS
 *     lock lands at `t = 0`. Sessions with no GPS samples fall back
 *     to trip-start.
 *
 * The returned `series` array is in `(session-order, pid-order)`
 * lexicographic order so chart legends stay deterministic across
 * re-renders.
 *
 * @param sessions Sessions to overlay (typically 2–4).
 * @param alignment Which alignment mode to apply.
 * @param pids PID keys to extract from each session row.
 * @returns The merged dataset + series descriptors.
 */
export const buildOverlayDataset = (
  sessions: readonly Session[],
  alignment: Alignment,
  pids: readonly string[]
): OverlayDataset => {
  const data: OverlayRow[] = [];
  const series: OverlaySeries[] = [];

  sessions.forEach((session, sessionIndex) => {
    const color = SESSION_COLORS[sessionIndex % SESSION_COLORS.length];
    const offset = alignment === 'gps' ? findGpsLockOffset(session.data) : 0;

    for (const pid of pids) {
      series.push({
        color,
        key:       `${ session.meta.id }::${ pid }`,
        label:     `${ session.meta.name } · ${ pid }`,
        pid,
        sessionId: session.meta.id
      });
    }

    for (const row of session.data) {
      const overlayRow: Record<string, number | undefined> = { t: row.t - offset };
      for (const pid of pids) {
        const value = row[pid];
        if (value !== undefined) {
          overlayRow[`${ session.meta.id }::${ pid }`] = value;
        }
      }
      data.push(overlayRow as OverlayRow);
    }
  });

  data.sort((rowA, rowB) => rowA.t - rowB.t);
  return { data, series };
};
