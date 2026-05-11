import type { SessionDataRow } from 'types/session';

/** Pixels of inset on every side so route points near the bbox edge
 *  don't kiss the SVG border. */
const ROUTE_PADDING = 6;

/** A point in the projected SVG coordinate space (pixels). */
export interface ProjectedPoint {
  readonly x: number;
  readonly y: number;
}

/** A caller-supplied marker (e.g. a Map hotspot) to project alongside
 *  the route. The `id` field is opaque and preserved on the output. */
export interface RouteMarker {
  readonly id: string;
  readonly lat: number;
  readonly lon: number;
}

/** `RouteMarker` projected into the same SVG coordinate space as the
 *  polyline path. */
export interface ProjectedMarker extends RouteMarker {
  readonly x: number;
  readonly y: number;
}

/** Output of {@link buildRoutePolyline}. */
export interface RoutePolyline {
  /** Last GPS-bearing row's projected position. `null` when the route
   *  has fewer than two contributing points. */
  readonly end: ProjectedPoint | null;
  /** Caller-supplied markers projected against the same bbox as the
   *  polyline. Empty when no markers were passed, or when the route
   *  itself is empty. */
  readonly markers: readonly ProjectedMarker[];
  /** SVG path `d` attribute. Empty string when there aren't at least
   *  two GPS-bearing rows to draw between. */
  readonly path: string;
  /** Number of GPS-bearing rows the polyline was built from. Callers
   *  can branch the empty-state on this. */
  readonly pointCount: number;
  /** First GPS-bearing row's projected position. `null` when the route
   *  has fewer than two contributing points. */
  readonly start: ProjectedPoint | null;
}

/**
 * Project a session's row data into an SVG polyline path string at the
 * requested pixel dimensions. Builds the route's bounding box from the
 * lat / lon pairs and linearly maps each point into the inset viewBox —
 * good enough for trip-scale routes (a few miles to a few hundred miles)
 * where Mercator distortion is negligible.
 *
 * SVG's y-axis grows downward, so the latitude axis is flipped — higher
 * latitude lands at smaller y.
 *
 * If fewer than two rows carry both `lat` and `lon`, the path is empty,
 * `start` / `end` are `null`, and `markers` is empty; callers should
 * render an empty-state placeholder in that case.
 *
 * Optional `markers` get projected using the same bbox so callers can
 * overlay hotspot circles / labels at known lat/lon positions without
 * re-deriving the projection.
 *
 * @param rows    Session row data — only rows with both `lat` and `lon`
 *   defined contribute to the route polyline.
 * @param width   SVG width in pixels.
 * @param height  SVG height in pixels.
 * @param markers Optional extra points to project alongside the route.
 * @returns The path string, contributing point count, projected start /
 *   end coordinates, and projected markers.
 */
export const buildRoutePolyline = (
  rows: readonly SessionDataRow[],
  width: number,
  height: number,
  markers: readonly RouteMarker[] = []
): RoutePolyline => {
  const points = rows.filter(
    (row): row is SessionDataRow & { readonly lat: number; readonly lon: number } =>
      row.lat !== undefined && row.lon !== undefined
  );
  if (points.length < 2) {
    return {
      end:        null,
      markers:    [],
      path:       '',
      pointCount: points.length,
      start:      null
    };
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;
  for (const point of points) {
    if (point.lat < minLat) minLat = point.lat;
    if (point.lat > maxLat) maxLat = point.lat;
    if (point.lon < minLon) minLon = point.lon;
    if (point.lon > maxLon) maxLon = point.lon;
  }
  /**
   * Avoid zero-span axes when the trip never moves on one axis (rare,
   * but happens on stationary OBD captures): nudge max by 1e-6 so the
   * projection divisor stays non-zero. The route collapses to a line
   * or a single dot in that case — fine.
   */
  if (maxLat - minLat < 1e-9) maxLat = minLat + 1e-9;
  if (maxLon - minLon < 1e-9) maxLon = minLon + 1e-9;

  const usableWidth = width - ROUTE_PADDING * 2;
  const usableHeight = height - ROUTE_PADDING * 2;

  const projectLatLon = (lat: number, lon: number): ProjectedPoint => ({
    x: ROUTE_PADDING + ((lon - minLon) / (maxLon - minLon)) * usableWidth,
    y: ROUTE_PADDING + (1 - (lat - minLat) / (maxLat - minLat)) * usableHeight
  });

  let path = '';
  for (let index = 0; index < points.length; index += 1) {
    const projected = projectLatLon(points[index].lat, points[index].lon);
    path += `${ index === 0 ? 'M' : 'L' }${ projected.x.toFixed(2) },${ projected.y.toFixed(2) }`;
  }

  const projectedMarkers = markers.map((marker) => {
    const { x, y } = projectLatLon(marker.lat, marker.lon);
    return { id: marker.id, lat: marker.lat, lon: marker.lon, x, y };
  });

  return {
    end:        projectLatLon(points[points.length - 1].lat, points[points.length - 1].lon),
    markers:    projectedMarkers,
    path,
    pointCount: points.length,
    start:      projectLatLon(points[0].lat, points[0].lon)
  };
};
