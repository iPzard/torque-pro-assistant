import type { SessionDataRow } from 'types/session';

import { buildRoutePolyline } from '.';

const makeRow = (overrides: Partial<SessionDataRow>): SessionDataRow => ({
  t:  0,
  ts: 0,
  ...overrides
});

describe('pages/session-detail/utils/build-route-polyline', () => {
  it('returns an empty path when no rows carry GPS', () => {
    const result = buildRoutePolyline(
      [makeRow({ rpm: 800 }), makeRow({ rpm: 900 })],
      200,
      120
    );
    expect(result.path).toBe('');
    expect(result.pointCount).toBe(0);
  });

  it('returns an empty path when only one row carries GPS', () => {
    const result = buildRoutePolyline(
      [makeRow({ lat: 45.60, lon: -122.38 })],
      200,
      120
    );
    expect(result.path).toBe('');
    expect(result.pointCount).toBe(1);
  });

  it('emits a path starting with M and continuing with L commands', () => {
    const result = buildRoutePolyline(
      [
        makeRow({ lat: 45.60, lon: -122.40 }),
        makeRow({ lat: 45.62, lon: -122.38 }),
        makeRow({ lat: 45.64, lon: -122.36 })
      ],
      200,
      120
    );
    expect(result.path.startsWith('M')).toBe(true);
    expect(result.path.split('L').length - 1).toBe(2);
    expect(result.pointCount).toBe(3);
  });

  it('projects the bbox-corner points into the inset SVG window', () => {
    /**
     * Two diagonal corners — top-left lat-max + lon-min, bottom-right
     * lat-min + lon-max. With a 6px padding on a 200x120 viewBox, the
     * mapped points land at (6, 6) and (194, 114).
     */
    const result = buildRoutePolyline(
      [
        makeRow({ lat: 45.70, lon: -122.40 }),
        makeRow({ lat: 45.60, lon: -122.30 })
      ],
      200,
      120
    );
    expect(result.path).toContain('M6.00,6.00');
    expect(result.path).toContain('L194.00,114.00');
  });

  it('skips rows missing either lat or lon', () => {
    const result = buildRoutePolyline(
      [
        makeRow({ lat: 45.60, lon: -122.40 }),
        makeRow({ lat: 45.62 }),
        makeRow({ lon: -122.36 }),
        makeRow({ lat: 45.64, lon: -122.34 })
      ],
      200,
      120
    );
    expect(result.pointCount).toBe(2);
    expect(result.path.split('L').length - 1).toBe(1);
  });

  it('does not divide by zero when all points share the same latitude', () => {
    const result = buildRoutePolyline(
      [
        makeRow({ lat: 45.60, lon: -122.40 }),
        makeRow({ lat: 45.60, lon: -122.30 })
      ],
      200,
      120
    );
    expect(result.path).not.toContain('NaN');
    expect(result.pointCount).toBe(2);
  });

  it('returns an empty markers array when none are provided', () => {
    const result = buildRoutePolyline(
      [
        makeRow({ lat: 45.60, lon: -122.40 }),
        makeRow({ lat: 45.62, lon: -122.38 })
      ],
      200,
      120
    );
    expect(result.markers).toEqual([]);
  });

  it('projects supplied markers using the route bbox', () => {
    const result = buildRoutePolyline(
      [
        makeRow({ lat: 45.70, lon: -122.40 }),
        makeRow({ lat: 45.60, lon: -122.30 })
      ],
      200,
      120,
      [
        { id: 'top-left',     lat: 45.70, lon: -122.40 },
        { id: 'bottom-right', lat: 45.60, lon: -122.30 }
      ]
    );
    expect(result.markers).toHaveLength(2);
    expect(result.markers[0]).toMatchObject({ id: 'top-left',     x: 6,   y: 6 });
    expect(result.markers[1]).toMatchObject({ id: 'bottom-right', x: 194, y: 114 });
  });

  it('returns no projected markers when the route itself is empty', () => {
    const result = buildRoutePolyline(
      [makeRow({ rpm: 800 })],
      200,
      120,
      [{ id: 'orphan', lat: 45.60, lon: -122.30 }]
    );
    expect(result.markers).toEqual([]);
  });
});
