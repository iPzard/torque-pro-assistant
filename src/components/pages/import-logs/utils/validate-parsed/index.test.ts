import type { ParsedCsv } from 'utils';

import { validateParsed } from '.';

const makeRow = (overrides: Partial<{ readonly [key: string]: number | undefined, readonly lat: number; readonly lon: number; readonly t: number; readonly ts: number; }> = {}) => ({
  t:  0,
  ts: 0,
  ...overrides
});

const makeParsed = (rows: ReturnType<typeof makeRow>[]): ParsedCsv => ({
  detectedColumns: [],
  rows
});

describe('pages/import-logs/utils/validate-parsed', () => {
  it('emits row-count as error when no rows are present', () => {
    const flags = validateParsed(makeParsed([]));
    const rowCountFlag = flags.find((flag) => flag.id === 'row-count');
    expect(rowCountFlag?.level).toBe('error');
  });

  it('emits row-count as info with the count when rows are present', () => {
    const flags = validateParsed(makeParsed([makeRow({ ts: 1000 }), makeRow({ ts: 2000 })]));
    const rowCountFlag = flags.find((flag) => flag.id === 'row-count');
    expect(rowCountFlag?.level).toBe('info');
    expect(rowCountFlag?.message).toContain('2');
  });

  it('flags gps as info when any row carries lat + lon', () => {
    const flags = validateParsed(makeParsed([
      makeRow({ ts: 1000 }),
      makeRow({ lat: 45.6, lon: -122.4, ts: 2000 })
    ]));
    const gpsFlag = flags.find((flag) => flag.id === 'gps');
    expect(gpsFlag?.level).toBe('info');
  });

  it('flags gps as warn when no rows carry lat + lon', () => {
    const flags = validateParsed(makeParsed([
      makeRow({ ts: 1000 }),
      makeRow({ ts: 2000 })
    ]));
    const gpsFlag = flags.find((flag) => flag.id === 'gps');
    expect(gpsFlag?.level).toBe('warn');
  });

  it('flags monotonic as info when timestamps ascend', () => {
    const flags = validateParsed(makeParsed([
      makeRow({ ts: 1000 }),
      makeRow({ ts: 2000 }),
      makeRow({ ts: 3000 })
    ]));
    const monoFlag = flags.find((flag) => flag.id === 'monotonic');
    expect(monoFlag?.level).toBe('info');
  });

  it('flags monotonic as warn when a row goes backward in time', () => {
    const flags = validateParsed(makeParsed([
      makeRow({ ts: 1000 }),
      makeRow({ ts: 500 })
    ]));
    const monoFlag = flags.find((flag) => flag.id === 'monotonic');
    expect(monoFlag?.level).toBe('warn');
  });

  it('emits a hybrid flag when an EV-specific PID is present', () => {
    const flags = validateParsed(makeParsed([
      makeRow({ hybrid_battery_pct: 80, ts: 1000 })
    ]));
    expect(flags.find((flag) => flag.id === 'hybrid')).toBeDefined();
  });

  it('omits the hybrid flag for a non-hybrid session', () => {
    const flags = validateParsed(makeParsed([makeRow({ ts: 1000 })]));
    expect(flags.find((flag) => flag.id === 'hybrid')).toBeUndefined();
  });
});
