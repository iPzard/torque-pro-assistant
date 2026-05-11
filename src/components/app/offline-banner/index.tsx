import { Icons } from 'components/app/icons';

import styles from './index.module.scss';

export interface OfflineBannerProps {
  /** Failure count, capped at the design's 10 max. */
  readonly attempts: number;
  /** Caller hides the banner without reconnecting — sticky until the
   *  next outage. */
  readonly onDismiss: () => void;
  /** Caller forces an immediate ping + resets the counter. */
  readonly onRetry: () => void;
  readonly testId?: string;
}

/** Visible upper bound the design copy bakes in ("retrying… (N/10)"). */
const MAX_ATTEMPTS = 10;

/**
 * Top-of-app banner shown when the Flask backend stops answering
 * `/ping`. Visual only — polling lives in `useBackendStatus`, which the
 * App shell owns so it can branch its grid template (28-px row above
 * the titlebar).
 *
 * Layout: pulsing amber dot · "Backend unreachable" headline · mono
 * "retrying… (N/10)" meta · spacer · "Retry now" button · "✕" close.
 *
 * @returns The banner element.
 */
function OfflineBanner({ attempts, onDismiss, onRetry, testId }: OfflineBannerProps) {
  return (
    <div className={ styles.banner } data-testid={ testId } role="status">
      <span className={ styles.pulse } data-testid={ testId === undefined ? undefined : `${ testId }-pulse` } />
      <span className={ styles.text } data-testid={ testId === undefined ? undefined : `${ testId }-text` }>
        Can&apos;t reach the local service
      </span>
      <span className={ styles.meta } data-testid={ testId === undefined ? undefined : `${ testId }-meta` }>
        — retrying… ({ attempts }/{ MAX_ATTEMPTS }) · some live features paused
      </span>
      <span className={ styles.spacer } />
      <button
        className={ styles.button }
        data-testid={ testId === undefined ? undefined : `${ testId }-retry` }
        onClick={ onRetry }
        type="button"
      >
        { Icons.reset }<span>Retry now</span>
      </button>
      <button
        aria-label="Dismiss"
        className={ styles.close }
        data-testid={ testId === undefined ? undefined : `${ testId }-close` }
        onClick={ onDismiss }
        type="button"
      >
        { Icons.cross }
      </button>
    </div>
  );
}

export default OfflineBanner;
