import { get } from 'utils';

/**
 * Fires a one-shot GET /ping against the Flask backend as a proof-of-life
 * check. Resolves `true` when the backend answers, `false` on any
 * failure. Logs both outcomes for the dev console.
 *
 * Lives as a util (not inline in the App effect) so it can be unit-tested
 * in isolation and so consumers — the boot-time ping and the offline
 * banner's retry loop — share one source of truth.
 *
 * @returns A promise that resolves with the reachability boolean.
 */
export const pingFlask = (): Promise<boolean> => new Promise((resolve) => {
  get<string>(
    'ping',
    (response) => { console.log('Flask /ping:', response); resolve(true); },
    (error) => { console.error('Flask /ping failed:', error); resolve(false); }
  );
});
