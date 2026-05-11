/**
 * Barrel for utils consumed only by the MiniMap sub-component. Grows
 * with the BigMap port — hotspot detection, route smoothing, etc.
 */
export type { ProjectedPoint, RoutePolyline } from './build-route-polyline';
export { buildRoutePolyline } from './build-route-polyline';
