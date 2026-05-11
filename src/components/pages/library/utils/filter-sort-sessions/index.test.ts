import type { SessionMeta } from 'types/session';

import { filterAndSortSessions } from '.';

const makeMeta = (overrides: Partial<SessionMeta>): SessionMeta => ({
  duration:  60,
  fileName:  'drive.csv',
  fileSize:  1024,
  gpsStart:  { lat: 0, lon: 0 },
  id:        's_default',
  name:      'drive',
  notes:     '',
  startedAt: '2024-10-28T13:50:51.000Z',
  vehicle:   { make: '', model: '', vin: '', year: 0 },
  ...overrides
});

const noFilters = { fromDate: null, query: '', toDate: null };

describe('pages/library/utils/filter-sort-sessions', () => {
  it('returns sessions unchanged when no filters are active and sort is asc by name', () => {
    const sessions = [
      makeMeta({ id: 's_a', name: 'alpha' }),
      makeMeta({ id: 's_b', name: 'bravo' })
    ];
    const result = filterAndSortSessions(sessions, noFilters, { key: 'name', order: 'asc' });
    expect(result.map((entry) => entry.id)).toEqual(['s_a', 's_b']);
  });

  it('sorts by name descending', () => {
    const sessions = [
      makeMeta({ id: 's_a', name: 'alpha' }),
      makeMeta({ id: 's_b', name: 'bravo' })
    ];
    const result = filterAndSortSessions(sessions, noFilters, { key: 'name', order: 'desc' });
    expect(result.map((entry) => entry.id)).toEqual(['s_b', 's_a']);
  });

  it('sorts by duration numerically', () => {
    const sessions = [
      makeMeta({ duration: 100, id: 's_a' }),
      makeMeta({ duration: 25,  id: 's_b' }),
      makeMeta({ duration: 250, id: 's_c' })
    ];
    const result = filterAndSortSessions(sessions, noFilters, { key: 'duration', order: 'asc' });
    expect(result.map((entry) => entry.id)).toEqual(['s_b', 's_a', 's_c']);
  });

  it('sorts by fileSize descending', () => {
    const sessions = [
      makeMeta({ fileSize: 1000,  id: 's_a' }),
      makeMeta({ fileSize: 500,   id: 's_b' }),
      makeMeta({ fileSize: 10000, id: 's_c' })
    ];
    const result = filterAndSortSessions(sessions, noFilters, { key: 'fileSize', order: 'desc' });
    expect(result.map((entry) => entry.id)).toEqual(['s_c', 's_a', 's_b']);
  });

  it('sorts by startedAt using ISO lexicographic ordering', () => {
    const sessions = [
      makeMeta({ id: 's_a', startedAt: '2024-10-28T13:50:51.000Z' }),
      makeMeta({ id: 's_b', startedAt: '2024-09-15T08:10:00.000Z' }),
      makeMeta({ id: 's_c', startedAt: '2025-01-02T11:30:00.000Z' })
    ];
    const result = filterAndSortSessions(sessions, noFilters, { key: 'startedAt', order: 'asc' });
    expect(result.map((entry) => entry.id)).toEqual(['s_b', 's_a', 's_c']);
  });

  it('filters by case-insensitive name substring', () => {
    const sessions = [
      makeMeta({ id: 's_a', name: 'Morning drive' }),
      makeMeta({ id: 's_b', name: 'Evening commute' }),
      makeMeta({ id: 's_c', name: 'Drive home' })
    ];
    const result = filterAndSortSessions(
      sessions,
      { ...noFilters, query: 'DRIVE' },
      { key: 'name', order: 'asc' }
    );
    expect(result.map((entry) => entry.id).sort()).toEqual(['s_a', 's_c']);
  });

  it('filters by date range — inclusive lower bound', () => {
    const sessions = [
      makeMeta({ id: 's_a', startedAt: '2024-10-01T00:00:00.000Z' }),
      makeMeta({ id: 's_b', startedAt: '2024-10-15T00:00:00.000Z' }),
      makeMeta({ id: 's_c', startedAt: '2024-11-01T00:00:00.000Z' })
    ];
    const result = filterAndSortSessions(
      sessions,
      { ...noFilters, fromDate: new Date('2024-10-15T00:00:00.000Z') },
      { key: 'startedAt', order: 'asc' }
    );
    expect(result.map((entry) => entry.id)).toEqual(['s_b', 's_c']);
  });

  it('filters by date range — inclusive upper bound, end-of-day', () => {
    const sessions = [
      makeMeta({ id: 's_a', startedAt: '2024-10-15T01:00:00.000Z' }),
      makeMeta({ id: 's_b', startedAt: '2024-10-15T23:30:00.000Z' }),
      makeMeta({ id: 's_c', startedAt: '2024-10-16T00:30:00.000Z' })
    ];
    const result = filterAndSortSessions(
      sessions,
      { ...noFilters, toDate: new Date('2024-10-15T00:00:00.000Z') },
      { key: 'startedAt', order: 'asc' }
    );
    /** Both same-day sessions should be included; only s_c (next day)
     *  is filtered out. */
    expect(result.map((entry) => entry.id)).toEqual(['s_a', 's_b']);
  });

  it('does not mutate the input array', () => {
    const sessions = [
      makeMeta({ id: 's_a', name: 'bravo' }),
      makeMeta({ id: 's_b', name: 'alpha' })
    ];
    const before = [...sessions];
    filterAndSortSessions(sessions, noFilters, { key: 'name', order: 'asc' });
    expect(sessions).toEqual(before);
  });
});
