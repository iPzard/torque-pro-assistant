import type { Session, SessionDataRow, SessionMeta } from 'types/session';

import { summarize } from '.';

/**
 * Build a Session out of a row factory. Caller supplies the data rows;
 * metadata is filled with a minimal sensible default so tests don't
 * have to repeat the vehicle / GPS / file bookkeeping that summarize
 * never touches (apart from `meta.duration`).
 */
function buildSession(
  rows: readonly SessionDataRow[],
  metaOverrides: Partial<SessionMeta> = {}
): Session {
  const meta: SessionMeta = {
    duration: rows.length,
    fileName: 'test.csv',
    fileSize: 0,
    gpsStart: { lat: 0, lon: 0 },
    id: 'test',
    name: 'test session',
    notes: '',
    startedAt: '2026-01-01T00:00:00Z',
    vehicle: { make: 'Test', model: 'Test', vin: '', year: 2020 },
    ...metaOverrides
  };
  return { data: rows, meta };
}

/**
 * Build a single data row. Helper keeps the per-row noise out of the
 * tests — every row gets the minimum required `t` + `ts` fields plus
 * whatever overrides the test supplies.
 */
function row(index: number, overrides: Partial<SessionDataRow> = {}): SessionDataRow {
  return { t: index, ts: index * 1000, ...overrides };
}

describe('utils/summarize', () => {
  it('returns zeros across the board for an empty session', () => {
    const result = summarize(buildSession([], { duration: 0 }));
    expect(result).toEqual({
      avgMpg: 0,
      dist: 0,
      duration: 0,
      maxBoost: 0,
      maxCool: 0,
      maxSpeed: 0,
      peakHp: 0,
      peakTq: 0,
      t0to30: null,
      t0to60: null
    });
  });

  it('preserves duration from session.meta', () => {
    const result = summarize(buildSession([row(0)], { duration: 1820 }));
    expect(result.duration).toBe(1820);
  });

  it('tracks peak speed / HP / torque / boost / coolant across rows', () => {
    const rows: SessionDataRow[] = [
      row(0, { boost_psi: -8, coolant_f: 70,  hp: 0,   speed_mph: 0,   tq_lbft: 0 }),
      row(1, { boost_psi: 4,  coolant_f: 150, hp: 90,  speed_mph: 25,  tq_lbft: 120 }),
      row(2, { boost_psi: 12, coolant_f: 210, hp: 280, speed_mph: 110, tq_lbft: 340 }),
      row(3, { boost_psi: 6,  coolant_f: 205, hp: 240, speed_mph: 95,  tq_lbft: 300 })
    ];
    const result = summarize(buildSession(rows));
    expect(result.maxSpeed).toBe(110);
    expect(result.peakHp).toBe(280);
    expect(result.peakTq).toBe(340);
    expect(result.maxBoost).toBe(12);
    expect(result.maxCool).toBe(210);
  });

  it('skips rows that don\'t carry the source PID', () => {
    const rows: SessionDataRow[] = [
      row(0, { speed_mph: 80 }),
      row(1, {}),
      row(2, { speed_mph: 70 })
    ];
    const result = summarize(buildSession(rows));
    expect(result.maxSpeed).toBe(80);
  });

  it('keeps maxBoost at 0 when no boost PID was logged', () => {
    const rows: SessionDataRow[] = [row(0, { speed_mph: 30 }), row(1, { speed_mph: 60 })];
    const result = summarize(buildSession(rows));
    expect(result.maxBoost).toBe(0);
  });

  it('records negative maxBoost (vacuum) when only sub-zero readings exist', () => {
    const rows: SessionDataRow[] = [
      row(0, { boost_psi: -10 }),
      row(1, { boost_psi: -6 }),
      row(2, { boost_psi: -8 })
    ];
    const result = summarize(buildSession(rows));
    expect(result.maxBoost).toBe(-6);
  });

  it('averages MPG across moving samples only (idle skipped)', () => {
    const rows: SessionDataRow[] = [
      row(0, { mpg: 0 }),
      row(1, { mpg: 30 }),
      row(2, { mpg: 0 }),
      row(3, { mpg: 40 })
    ];
    const result = summarize(buildSession(rows));
    expect(result.avgMpg).toBe(35);
  });

  it('avgMpg is 0 when no rows have positive MPG', () => {
    const rows: SessionDataRow[] = [row(0, { mpg: 0 }), row(1, {})];
    const result = summarize(buildSession(rows));
    expect(result.avgMpg).toBe(0);
  });

  it('reads distance from the last row\'s odo', () => {
    const rows: SessionDataRow[] = [
      row(0, { odo: 0 }),
      row(1, { odo: 5 }),
      row(2, { odo: 12.4 })
    ];
    const result = summarize(buildSession(rows));
    expect(result.dist).toBe(12.4);
  });

  it('distance falls back to 0 when the last row has no odo', () => {
    const rows: SessionDataRow[] = [row(0, { odo: 7 }), row(1, {})];
    const result = summarize(buildSession(rows));
    expect(result.dist).toBe(0);
  });

  it('detects a clean 0-60 launch and reports t0to30 + t0to60', () => {
    // Sample 0 sits at 0 mph (still); samples 1+ ramp at 10 mph/sec.
    const speeds = [0, 10, 20, 30, 40, 50, 60, 70];
    const rows: SessionDataRow[] = speeds.map((speed, index) => row(index, { speed_mph: speed }));
    const result = summarize(buildSession(rows));
    // Launch starts at index 0 (sample 0 < 1 mph, sample 1 >= 1 mph).
    // 30 mph first occurs at index 3 → t0to30 = 3. 60 mph at index 6 → t0to60 = 6.
    expect(result.t0to30).toBe(3);
    expect(result.t0to60).toBe(6);
  });

  it('returns null for t0to30 / t0to60 when no launch reaches the thresholds', () => {
    const rows: SessionDataRow[] = [
      row(0, { speed_mph: 0 }),
      row(1, { speed_mph: 5 }),
      row(2, { speed_mph: 10 }),
      row(3, { speed_mph: 12 })
    ];
    const result = summarize(buildSession(rows));
    expect(result.t0to30).toBeNull();
    expect(result.t0to60).toBeNull();
  });

  it('reports t0to30 even when the launch never reaches 60', () => {
    const speeds = [0, 10, 20, 30, 38, 42, 40, 35];
    const rows: SessionDataRow[] = speeds.map((speed, index) => row(index, { speed_mph: speed }));
    const result = summarize(buildSession(rows));
    expect(result.t0to30).toBe(3);
    expect(result.t0to60).toBeNull();
  });

  it('measures the first 0-60 launch only — later ones are ignored', () => {
    // Two launches: indices 0→6 (0→60) and indices 8→14 (0→60 again).
    // Only the first should drive t0to60.
    const speeds = [0, 10, 20, 30, 40, 50, 60, 0, 0, 10, 20, 30, 40, 50, 60];
    const rows: SessionDataRow[] = speeds.map((speed, index) => row(index, { speed_mph: speed }));
    const result = summarize(buildSession(rows));
    expect(result.t0to30).toBe(3);
    expect(result.t0to60).toBe(6);
  });

  it('ignores a single-sample session with no launch context', () => {
    const result = summarize(buildSession([row(0, { speed_mph: 5 })]));
    expect(result.t0to30).toBeNull();
    expect(result.t0to60).toBeNull();
  });

  it('does not start a launch from a rolling sample', () => {
    // First sample is already moving (10 mph) — should NOT trigger a launch.
    const speeds = [10, 20, 30, 40, 50, 60];
    const rows: SessionDataRow[] = speeds.map((speed, index) => row(index, { speed_mph: speed }));
    const result = summarize(buildSession(rows));
    expect(result.t0to30).toBeNull();
    expect(result.t0to60).toBeNull();
  });
});
