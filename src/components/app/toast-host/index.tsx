import { useEffect, useRef, useState } from 'react';

import { Icons } from 'components/app/icons';
import { subscribeToToasts, toast, type ToastEntry, type ToastKind } from 'utils';

import styles from './index.module.scss';

/** Class name for the leading colored dot, keyed off the toast kind. */
const DOT_CLASS: Record<ToastKind, string> = {
  error:   styles['toast-dot-error'],
  info:    styles['toast-dot-info'],
  success: styles['toast-dot-success'],
  warning: styles['toast-dot-warning']
};

/** Class name for the bottom progress bar, keyed off the kind. */
const PROGRESS_CLASS: Record<ToastKind, string> = {
  error:   styles['toast-progress-error'],
  info:    styles['toast-progress-info'],
  success: styles['toast-progress-success'],
  warning: styles['toast-progress-warning']
};

/** Slide-out animation duration. Keep in lockstep with the
 *  `toast-out` keyframes in the module so the entry leaves cleanly
 *  before being unmounted. */
const LEAVE_MS = 180;

/** Maximum toasts visible at once. Newer queue entries above the cap
 *  wait their turn (the host keeps the newest three). */
const MAX_VISIBLE = 3;

export interface ToastItemProps {
  readonly entry: ToastEntry;
  readonly onClose: () => void;
}

/**
 * Single rendered toast — owns its auto-dismiss timer (paused on
 * hover, resumed on leave), the close button, and an optional action
 * button. Slides out on dismiss before unmount.
 */
function ToastItem({ entry, onClose }: ToastItemProps) {
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paused = useRef(false);

  const close = (): void => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onClose, LEAVE_MS);
  };

  const armTimer = (): void => {
    if (paused.current) return;
    const duration = entry.duration;
    if (duration === 0 || !Number.isFinite(duration)) return;
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(close, duration);
  };

  useEffect(() => {
    armTimer();
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
    };
    // armTimer + close close over `leaving`; we intentionally only
    // arm on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showProgress = entry.duration > 0 && Number.isFinite(entry.duration);

  return (
    <div
      className={ leaving ? styles['toast-leaving'] : styles.toast }
      data-testid={ `app-toast-${ entry.id }` }
      onMouseEnter={ () => {
        paused.current = true;
        if (timer.current !== null) clearTimeout(timer.current);
      } }
      onMouseLeave={ () => {
        paused.current = false;
        armTimer();
      } }
      role="status"
    >
      <span aria-hidden className={ DOT_CLASS[entry.kind] } />
      <div className={ styles['toast-body'] }>
        <div className={ styles['toast-title'] } data-testid={ `app-toast-${ entry.id }-title` }>
          { entry.title }
        </div>
        { entry.subtitle !== undefined && (
          <div className={ styles['toast-sub'] }>{ entry.subtitle }</div>
        ) }
        { entry.action !== undefined && (
          <div className={ styles['toast-actions'] }>
            <button
              className={ entry.kind === 'error' ? styles['toast-action-error'] : styles['toast-action'] }
              data-testid={ `app-toast-${ entry.id }-action` }
              onClick={ () => {
                try {
                  entry.action?.onClick();
                } finally {
                  close();
                }
              } }
              type="button"
            >
              { entry.action.label }
            </button>
          </div>
        ) }
      </div>
      <button
        aria-label="Dismiss notification"
        className={ styles['toast-close'] }
        data-testid={ `app-toast-${ entry.id }-close` }
        onClick={ close }
        type="button"
      >
        { Icons.cross }
      </button>
      { showProgress && (
        <div
          aria-hidden
          className={ PROGRESS_CLASS[entry.kind] }
          style={ { animationDuration: `${ entry.duration }ms` } }
        />
      ) }
    </div>
  );
}

export interface ToastHostProps {
  readonly testId?: string;
}

/**
 * Bottom-right toast stack — subscribes to the global `utils/toast`
 * queue and renders up to `MAX_VISIBLE` newest entries. When the
 * queue is empty, returns `null` (no wrapper, no chrome) so the host
 * doesn't intercept clicks on whatever sits underneath.
 *
 * Pure UI: every state-changing call (success / error / dismiss /
 * clear) goes through the imperative `toast` API exported from
 * `utils/toast`. Nothing in the React tree owns the queue.
 *
 * @returns The toast stack React element, or `null`.
 */
function ToastHost({ testId }: ToastHostProps = {}) {
  const [entries, setEntries] = useState<readonly ToastEntry[]>([]);

  useEffect(() => subscribeToToasts(setEntries), []);

  const visible = entries.slice(-MAX_VISIBLE);
  if (visible.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      aria-live="polite"
      className={ styles['toast-host'] }
      data-testid={ testId }
      role="region"
    >
      { visible.map((entry) => (
        <ToastItem
          key={ entry.id }
          entry={ entry }
          onClose={ () => toast.dismiss(entry.id) }
        />
      )) }
    </div>
  );
}

export default ToastHost;
