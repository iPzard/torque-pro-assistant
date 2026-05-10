// Barrel for shared utils. Kept narrow on purpose — only utils that are
// genuinely cross-page belong here. Page-local helpers live under
// src/components/pages/<page>/utils/.
export { get, post } from './requests';
export { app } from './services';
