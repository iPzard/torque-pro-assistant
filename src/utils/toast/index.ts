/**
 * Global toast / notification queue + imperative API. Matches the
 * handoff-5 contract (`toasts.jsx`):
 *
 *   toast({ kind, title, subtitle?, action?, duration? })
 *   toast.success(title, opts?) · toast.info(...) · .warning(...) · .error(...)
 *   toast.dismiss(id) · toast.clear()
 *
 * State lives at module scope so the API can be called from anywhere
 * (event handlers, async callbacks, slice dispatch chains) without
 * threading a context. The `<ToastHost>` component subscribes to the
 * queue and re-renders when it changes; when the queue empties, the
 * host returns `null` (no wrapper, no chrome).
 */

/** Severity / kind of a toast. Drives the leading dot color + action
 *  button accent. */
export type ToastKind = 'error' | 'info' | 'success' | 'warning';

/** Optional one-button action surfaced inside the toast (e.g. "Undo"
 *  on a destructive op, "View" on a successful import). */
export interface ToastAction {
  readonly label: string;
  readonly onClick: () => void;
}

/** Input shape for the base `toast(...)` call. `kind` and `duration`
 *  default to `info` / `4000` ms. Pass `duration: 0` or `Infinity` to
 *  pin the toast until the user dismisses it. */
export interface ToastOptions {
  readonly action?: ToastAction;
  readonly duration?: number;
  readonly kind?: ToastKind;
  readonly subtitle?: string;
  readonly title: string;
}

/** Realized toast as the queue stores + the host renders. */
export interface ToastEntry {
  readonly action?: ToastAction;
  readonly duration: number;
  readonly id: number;
  readonly kind: ToastKind;
  readonly subtitle?: string;
  readonly title: string;
}

/** Subscriber callback signature. Receives a snapshot of the queue. */
export type ToastSubscriber = (queue: readonly ToastEntry[]) => void;

const DEFAULT_DURATION_MS = 4000;

const queue: ToastEntry[] = [];
const subscribers = new Set<ToastSubscriber>();
let nextId = 1;

const emit = (): void => {
  const snapshot = queue.slice();
  subscribers.forEach((fn) => fn(snapshot));
};

/**
 * Push a toast onto the queue. Returns the assigned id so callers
 * can dismiss programmatically (e.g. cancel a sticky toast when the
 * underlying work finishes).
 *
 * Convenience wrappers `toast.success` / `toast.info` / `toast.warning`
 * / `toast.error` pre-fill `kind`.
 */
function pushToast(opts: ToastOptions): number {
  const entry: ToastEntry = {
    action:   opts.action,
    duration: opts.duration ?? DEFAULT_DURATION_MS,
    id:       nextId,
    kind:     opts.kind ?? 'info',
    subtitle: opts.subtitle,
    title:    opts.title
  };
  nextId += 1;
  queue.push(entry);
  emit();
  return entry.id;
}

/** Remove a queued toast by id. No-op when the id has already
 *  auto-dismissed. */
const dismiss = (id: number): void => {
  const index = queue.findIndex((entry) => entry.id === id);
  if (index >= 0) {
    queue.splice(index, 1);
    emit();
  }
};

/** Drop the entire queue. Useful from "clear all" UX or on route
 *  navigation when stale notifications no longer apply. */
const clear = (): void => {
  queue.length = 0;
  emit();
};

/** Internal subscribe hook used by the `ToastHost` component. Each
 *  subscriber receives the full snapshot; unsubscribe is the returned
 *  callback. */
export const subscribeToToasts = (subscriber: ToastSubscriber): (() => void) => {
  subscribers.add(subscriber);
  subscriber(queue.slice());
  return () => {
    subscribers.delete(subscriber);
  };
};

/** Read the current queue snapshot — used by tests so they don't
 *  need to subscribe + unsubscribe through the React layer. */
export const peekToasts = (): readonly ToastEntry[] => queue.slice();

export interface ToastApi {
  (opts: ToastOptions): number;
  readonly clear:   () => void;
  readonly dismiss: (id: number) => void;
  readonly error:   (title: string, rest?: Omit<ToastOptions, 'kind' | 'title'>) => number;
  readonly info:    (title: string, rest?: Omit<ToastOptions, 'kind' | 'title'>) => number;
  readonly success: (title: string, rest?: Omit<ToastOptions, 'kind' | 'title'>) => number;
  readonly warning: (title: string, rest?: Omit<ToastOptions, 'kind' | 'title'>) => number;
}

/**
 * Imperative toast API. Mounted at module scope so any consumer can
 * fire a notification without prop-drilling.
 *
 * @example
 *   toast.success('Imported drive.csv', { subtitle: '2,418 rows' });
 *   toast.error('Parse failed', { action: { label: 'Retry', onClick: retry } });
 */
const toast = ((opts: ToastOptions): number => pushToast(opts)) as ToastApi;

(toast as { -readonly [K in keyof ToastApi]: ToastApi[K] }).success = (title, rest) =>
  pushToast({ kind: 'success', title, ...(rest ?? {}) });
(toast as { -readonly [K in keyof ToastApi]: ToastApi[K] }).info = (title, rest) =>
  pushToast({ kind: 'info', title, ...(rest ?? {}) });
(toast as { -readonly [K in keyof ToastApi]: ToastApi[K] }).warning = (title, rest) =>
  pushToast({ kind: 'warning', title, ...(rest ?? {}) });
(toast as { -readonly [K in keyof ToastApi]: ToastApi[K] }).error = (title, rest) =>
  pushToast({ kind: 'error', title, ...(rest ?? {}) });
(toast as { -readonly [K in keyof ToastApi]: ToastApi[K] }).dismiss = dismiss;
(toast as { -readonly [K in keyof ToastApi]: ToastApi[K] }).clear = clear;

export default toast;
