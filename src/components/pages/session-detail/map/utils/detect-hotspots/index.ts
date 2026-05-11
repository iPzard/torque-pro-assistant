import type { SessionDataRow } from 'types/session';

/** Kind of hotspot. Stable id strings so the renderer can switch on
 *  them for color + icon choices. */
export type HotspotKind = 'max-boost' | 'max-rpm' | 'max-speed';

/** One hotspot — the GPS-anchored peak of a single PID. */
export interface Hotspot {
  /** Stable id — `${ kind }`. Unique per kind per session. */
  readonly id: string;
  readonly kind: HotspotKind;
  readonly label: string;
  readonly lat: number;
  readonly lon: number;
  /** Elapsed seconds at the peak sample. */
  readonly t: number;
  readonly unit: string;
  readonly value: number;
}

/**
 * Internal mutable working state — one row's contribution to a single
 * PID's running maximum. Kept inside the function; not exported.
 */
interface Tracker {
  readonly kind: HotspotKind;
  readonly label: string;
  readonly pid: 'boost_psi' | 'rpm' | 'speed_mph';
  readonly unit: string;
}

const TRACKERS: readonly Tracker[] = [
  { kind: 'max-speed', label: 'Max Speed', pid: 'speed_mph', unit: 'mph' },
  { kind: 'max-rpm',   label: 'Max RPM',   pid: 'rpm',       unit: 'rpm' },
  { kind: 'max-boost', label: 'Max Boost', pid: 'boost_psi', unit: 'psi' }
];

/**
 * Walks the session's row data once and emits a hotspot for each
 * tracked PID (speed, RPM, boost) whose peak sample carries GPS.
 * Returned hotspots are ordered by the `TRACKERS` array, not by value
 * or position — keeps the UI rendering stable across re-imports of
 * the same file.
 *
 * A PID is dropped (not emitted) when:
 *   - It wasn't logged in the session (no row has a defined value), or
 *   - The peak sample has no `lat` / `lon` pair (no GPS at that moment).
 *
 * @param rows Full session row data.
 * @returns 0–3 hotspots, in `TRACKERS` order.
 */
export const detectHotspots = (rows: readonly SessionDataRow[]): readonly Hotspot[] => {
  const peaks = new Map<HotspotKind, { row: SessionDataRow; value: number }>();
  for (const row of rows) {
    for (const tracker of TRACKERS) {
      const value = row[tracker.pid];
      if (value === undefined) continue;
      const current = peaks.get(tracker.kind);
      if (current === undefined || value > current.value) {
        peaks.set(tracker.kind, { row, value });
      }
    }
  }

  const hotspots: Hotspot[] = [];
  for (const tracker of TRACKERS) {
    const peak = peaks.get(tracker.kind);
    if (peak === undefined) continue;
    const { lat, lon } = peak.row;
    if (lat === undefined || lon === undefined) continue;
    hotspots.push({
      id:    tracker.kind,
      kind:  tracker.kind,
      label: tracker.label,
      lat,
      lon,
      t:     peak.row.t,
      unit:  tracker.unit,
      value: peak.value
    });
  }
  return hotspots;
};
