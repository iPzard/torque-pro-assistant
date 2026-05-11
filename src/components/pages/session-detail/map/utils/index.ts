/**
 * Barrel for utils consumed only by the Map tab sub-tree. Add re-
 * exports here as the Map tab grows (route smoothing, etc.).
 */
export type { Hotspot, HotspotKind } from './detect-hotspots';
export { detectHotspots } from './detect-hotspots';
