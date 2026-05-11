/**
 * Barrel for utils consumed only by the App shell (window-control wiring,
 * sidebar predicates, boot-time effects).
 */
export type { AccentSwatch } from './apply-preferences';
export { ACCENT_SWATCHES, applyPreferencesToDom, useApplyPreferences } from './apply-preferences';
export { isActive } from './is-active';
export { pingFlask } from './ping-flask';
export type { BackendStatus } from './use-backend-status';
export { useBackendStatus } from './use-backend-status';
