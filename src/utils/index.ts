/**
 * Barrel for utils consumed across multiple pages / components. Add
 * re-exports here only when a util is genuinely cross-cutting — page-
 * or component-local helpers belong under `<thing>/utils/`.
 */
export { get, post } from './requests';
export { windowControls } from './services';
export { summarize } from './summarize';
