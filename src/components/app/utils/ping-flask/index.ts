import { get } from 'utils';

/**
 * Fires a one-shot GET /ping against the Flask backend as a proof-of-life
 * check on app boot. The response is logged; failures are logged at the
 * error level.
 *
 * Lives as a util (not inline in the App effect) so it can be unit-tested
 * in isolation and so future expansion — e.g. dispatching a Redux action
 * with the bridge status — has a single source to grow from.
 */
export const pingFlask = (): void => {
  get<string>(
    'ping',
    (response) => console.log('Flask /ping:', response),
    (error) => console.error('Flask /ping failed:', error)
  );
};
