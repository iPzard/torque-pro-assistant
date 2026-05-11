/**
 * Barrel for utils consumed only by the App shell (window-control wiring,
 * sidebar predicates, boot-time effects).
 */
export { isActive } from './is-active';
export { pingFlask } from './ping-flask';
export type { BackendStatus } from './use-backend-status';
export { useBackendStatus } from './use-backend-status';
