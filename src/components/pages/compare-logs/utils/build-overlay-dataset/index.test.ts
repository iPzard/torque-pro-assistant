import type { Session, SessionDataRow } from 'types/session';

import { buildOverlayDataset } from '.';

const makeRow = (overrides: Partial<SessionDataRow>): SessionDataRow => ({
  t:  0,
  ts: 0,
  ...overrides
});

const makeSession = (id: string, name: string, rows: SessionDataRow[]): Session => ({
  data: rows,
  meta: {
    duration:  rows.length,
    fileName:  `${ name }.csv`,
    fileSize:  1024,
    gpsStart:  { lat: 0, lon: 0 },
    id,
    name,
    notes:     '',
    startedAt: '2024-10-28T13:50:51.000Z',
    vehicle:   { make: '', model: '', vin: '', year: 0 }
  }
});

describe('pages/compare-logs/utils/build-overlay-dataset', () => {
  it('emits one series per session × PID combination', () => {
    const sessions = [
      makeSession('s_1', 'run-a', [makeRow({ speed_mph: 30, t: 0 })]),
      makeSession('s_2', 'run-b', [makeRow({ speed_mph: 25, t: 0 })])
    ];
    const result = buildOverlayDataset(sessions, 'trip-start', ['speed_mph']);
    expect(result.series).toHaveLength(2);
    expect(result.series.map((entry) => entry.key)).toEqual([
      's_1::speed_mph',
      's_2::speed_mph'
    ]);
  });

  it('cycles colors so sibling sessions are visually distinct', () => {
    const sessions = [
      makeSession('s_1', 'a', [makeRow({ speed_mph: 0, t: 0 })]),
      makeSession('s_2', 'b', [makeRow({ speed_mph: 0, t: 0 })])
    ];
    const result = buildOverlayDataset(sessions, 'trip-start', ['speed_mph']);
    expect(result.series[0].color).not.toBe(result.series[1].color);
  });

  it('writes session-prefixed keys into the merged dataset', () => {
    const sessions = [
      makeSession('s_1', 'a', [makeRow({ speed_mph: 30, t: 5 })])
    ];
    const result = buildOverlayDataset(sessions, 'trip-start', ['speed_mph']);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({ 's_1::speed_mph': 30, t: 5 });
  });

  it('sorts the merged dataset ascending by `t`', () => {
    const sessions = [
      makeSession('s_1', 'a', [makeRow({ t: 5 }), makeRow({ t: 10 })]),
      makeSession('s_2', 'b', [makeRow({ t: 0 }), makeRow({ t: 7 })])
    ];
    const result = buildOverlayDataset(sessions, 'trip-start', ['speed_mph']);
    const times = result.data.map((row) => row.t);
    expect(times).toEqual([...times].sort((rowA, rowB) => rowA - rowB));
  });

  it('keeps t as-is for trip-start alignment', () => {
    const sessions = [
      makeSession('s_1', 'a', [
        makeRow({ t: 0 }),
        makeRow({ lat: 45.6, lon: -122.4, t: 30 })
      ])
    ];
    const result = buildOverlayDataset(sessions, 'trip-start', ['speed_mph']);
    expect(result.data.map((row) => row.t)).toEqual([0, 30]);
  });

  it('shifts t so the first GPS lock lands at zero for gps alignment', () => {
    const sessions = [
      makeSession('s_1', 'a', [
        makeRow({ t: 0 }),
        makeRow({ lat: 45.6, lon: -122.4, t: 30 }),
        makeRow({ lat: 45.7, lon: -122.3, t: 60 })
      ])
    ];
    const result = buildOverlayDataset(sessions, 'gps', ['speed_mph']);
    expect(result.data.map((row) => row.t)).toEqual([-30, 0, 30]);
  });

  it('falls back to trip-start for a session with no GPS lock', () => {
    const sessions = [
      makeSession('s_1', 'a', [makeRow({ t: 5 }), makeRow({ t: 10 })])
    ];
    const result = buildOverlayDataset(sessions, 'gps', ['speed_mph']);
    expect(result.data.map((row) => row.t)).toEqual([5, 10]);
  });

  it('omits PIDs whose value is undefined on a given row', () => {
    const sessions = [
      makeSession('s_1', 'a', [
        makeRow({ speed_mph: 30, t: 0 }),
        makeRow({ rpm: 1500, t: 1 })
      ])
    ];
    const result = buildOverlayDataset(sessions, 'trip-start', ['speed_mph', 'rpm']);
    expect(result.data[0]['s_1::speed_mph']).toBe(30);
    expect(result.data[0]['s_1::rpm']).toBeUndefined();
    expect(result.data[1]['s_1::speed_mph']).toBeUndefined();
    expect(result.data[1]['s_1::rpm']).toBe(1500);
  });
});
