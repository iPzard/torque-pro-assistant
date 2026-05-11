/**
 * Imperative controller for the OBD-II adapter pairing modal — an
 * imperative API that any non-component code can call to pop the
 * pairing flow open (Settings card, titlebar pill, future command-
 * palette entry, etc).
 *
 * Pattern mirrors `utils/toast`: module-level state singleton, a
 * Set of subscribers, plus a hook (`useAdapterPairing`) that the
 * mounted `<AdapterPairing>` host consumes to track open / close.
 *
 * The `instance` counter increments on every open so the host can key
 * its modal node off it — every fresh open forces a clean React mount
 * (no stale stage / picked-device / progress state bleeds over from
 * the previous run).
 */

/** Stages the pairing modal can be opened at. `done` / `pair` / etc
 *  let demos + tests skip ahead; production callers open at `scan`. */
export type PairingStage =
  | 'done'
  | 'failed'
  | 'no-adapters'
  | 'no-protocol'
  | 'pair'
  | 'probe'
  | 'scan';

/** Snapshot of the controller's open state. `null` means the modal is
 *  closed; otherwise an object carrying the initial stage + the
 *  monotonically-increasing instance id. */
export type PairingState = null | {
  readonly instance: number;
  readonly stage: PairingStage;
};

type PairingSubscriber = (state: PairingState) => void;

const subscribers = new Set<PairingSubscriber>();
let current: PairingState = null;
let nextInstance = 1;

/** Returns the current open state — `null` when the modal is closed.
 *  Useful for tests; renderers should use the hook instead so they
 *  re-render on changes. */
export const peekAdapterPairing = (): PairingState => current;

/** Subscribe to open / close events. Fires once on subscription with
 *  the current state, then on every mutation. Returns an unsubscribe
 *  function. */
export const subscribeToAdapterPairing = (
  subscriber: PairingSubscriber
): (() => void) => {
  subscribers.add(subscriber);
  subscriber(current);
  return () => { subscribers.delete(subscriber); };
};

const emit = (): void => {
  for (const subscriber of subscribers) subscriber(current);
};

interface PairingFacade {
  (stage?: PairingStage): number;
  /** Force-close the modal regardless of the underlying state. */
  readonly close: () => void;
}

/**
 * Opens the pairing modal at the given stage (default `scan`).
 * Returns the instance id so callers can correlate downstream events
 * (e.g. toast dispatch) with this specific open.
 */
const open: PairingFacade = ((stage: PairingStage = 'scan'): number => {
  const instance = nextInstance;
  nextInstance += 1;
  current = { instance, stage };
  emit();
  return instance;
}) as PairingFacade;

(open as { close: () => void }).close = (): void => {
  current = null;
  emit();
};

/**
 * Imperative facade. Call as a function — `adapterPairing()` — to open
 * at the default `scan` stage, or pass a stage name to jump straight
 * into Pair / Probe / Done / a failure. `adapterPairing.close()` shuts
 * the modal.
 */
const adapterPairing = open;

export default adapterPairing;
