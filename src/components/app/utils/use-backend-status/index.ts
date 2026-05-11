import { useEffect, useState } from 'react';

import { pingFlask } from 'components/app/utils/ping-flask';

/** How many consecutive failures the displayed counter caps at — the
 *  design uses "(N/10)" copy so we max out at 10. */
const MAX_ATTEMPTS = 10;

/** Production retry cadence — 4s between pings while offline. */
const DEFAULT_RETRY_MS = 4000;

/** Reactive snapshot of the Flask backend's reachability + the banner's
 *  user-controlled visibility state. */
export interface BackendStatus {
  /** Failure count, capped at 10. Resets on reconnect or manual retry. */
  readonly attempts: number;
  /** Hide the banner until the backend recovers + fails again. */
  readonly dismiss: () => void;
  /** True once the user has dismissed the active outage. */
  readonly dismissed: boolean;
  /** True while the backend is unreachable. */
  readonly offline: boolean;
  /** Fire an immediate ping; resets the attempt counter to 1. */
  readonly retry: () => void;
}

export interface UseBackendStatusOptions {
  /** Poll cadence between failed pings, in ms. Defaulted to the
   *  production 4s; tests override to keep runs fast. */
  readonly retryIntervalMs?: number;
}

/**
 * Polls the Flask backend on a fixed cadence and surfaces a reactive
 * snapshot of its reachability + the offline banner's user-controlled
 * dismissal state.
 *
 * Lives as a hook (not inline in `<OfflineBanner>`) so the App shell
 * can branch its CSS grid template on the same `offline` boolean —
 * the banner steals a 28-px row at the top of the grid and the rest
 * of the layout shifts down by that amount.
 *
 * @param options Optional overrides (currently just `retryIntervalMs`).
 * @returns Snapshot + actions: `offline`, `attempts`, `dismissed`,
 *   plus `retry()` / `dismiss()`.
 */
export const useBackendStatus = ({ retryIntervalMs = DEFAULT_RETRY_MS }: UseBackendStatusOptions = {}): BackendStatus => {
  const [online, setOnline] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async (): Promise<void> => {
      const ok = await pingFlask();
      if (cancelled) return;
      if (ok) {
        setOnline(true);
      } else {
        setOnline(false);
        setAttempts(1);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (online) return undefined;
    const handle = window.setInterval(() => {
      void (async (): Promise<void> => {
        const ok = await pingFlask();
        if (ok) {
          setOnline(true);
          setAttempts(0);
          setDismissed(false);
        } else {
          setAttempts((count) => Math.min(MAX_ATTEMPTS, count + 1));
        }
      })();
    }, retryIntervalMs);
    return () => { window.clearInterval(handle); };
  }, [online, retryIntervalMs]);

  const retry = (): void => {
    setAttempts(1);
    void (async (): Promise<void> => {
      const ok = await pingFlask();
      if (ok) {
        setOnline(true);
        setAttempts(0);
        setDismissed(false);
      }
    })();
  };

  const dismiss = (): void => setDismissed(true);

  return { attempts, dismiss, dismissed, offline: !online, retry };
};
