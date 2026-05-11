import type { ParsedCsv } from 'utils';

import { buildSession } from '.';

const makeParsed = (): ParsedCsv => ({
  detectedColumns: [],
  rows: [
    { rpm: 800,  speed_mph: 0,  t: 0, ts: 1_730_127_051_000 },
    { lat: 45.6, lon: -122.38, rpm: 1500, speed_mph: 30, t: 1, ts: 1_730_127_052_000 },
    { rpm: 4500, speed_mph: 65, t: 9, ts: 1_730_127_060_000 }
  ]
});

const makeInput = (overrides: Partial<Parameters<typeof buildSession>[0]> = {}): Parameters<typeof buildSession>[0] => ({
  fileName: 'drive.csv',
  fileSize: 2048,
  name:     'morning-drive',
  notes:    'autumn commute',
  parsed:   makeParsed(),
  vehicle:  { make: 'Ford', model: 'Mustang', vin: '', year: 2018 },
  ...overrides
});

describe('pages/import-logs/utils/build-session', () => {
  it('carries form name / notes / vehicle into the session meta', () => {
    const session = buildSession(makeInput());
    expect(session.meta.name).toBe('morning-drive');
    expect(session.meta.notes).toBe('autumn commute');
    expect(session.meta.vehicle).toEqual({ make: 'Ford', model: 'Mustang', vin: '', year: 2018 });
  });

  it('carries file name + size from the form', () => {
    const session = buildSession(makeInput());
    expect(session.meta.fileName).toBe('drive.csv');
    expect(session.meta.fileSize).toBe(2048);
  });

  it('derives startedAt from the first row\'s timestamp', () => {
    const session = buildSession(makeInput());
    expect(session.meta.startedAt).toBe('2024-10-28T14:50:51.000Z');
  });

  it('derives duration from the gap between the first + last row', () => {
    const session = buildSession(makeInput());
    expect(session.meta.duration).toBe(9);
  });

  it('takes gpsStart from the first row carrying both lat + lon', () => {
    const session = buildSession(makeInput());
    expect(session.meta.gpsStart.lat).toBeCloseTo(45.6);
    expect(session.meta.gpsStart.lon).toBeCloseTo(-122.38);
  });

  it('falls back to {0, 0} when no rows carry GPS', () => {
    const session = buildSession(makeInput({
      parsed: { detectedColumns: [], rows: [
        { rpm: 800, t: 0, ts: 1000 },
        { rpm: 900, t: 1, ts: 2000 }
      ] }
    }));
    expect(session.meta.gpsStart).toEqual({ lat: 0, lon: 0 });
  });

  it('issues an id prefixed with `s_` containing the file name', () => {
    const session = buildSession(makeInput());
    expect(session.meta.id).toMatch(/^s_\d+_drive\.csv$/);
  });
});
