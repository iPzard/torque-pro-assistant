import type { ReactNode } from 'react';

import { Icons } from 'components/app/icons';

import styles from './index.module.scss';

/** Severity of an inline alert. `danger` = blocker (red tint), `warn`
 *  = recoverable issue (amber), `info` = neutral status (accent). */
export type AlertVariant = 'danger' | 'info' | 'warn';

export interface AlertProps {
  /** Right-aligned action row — typically a primary `Try again` plus
   *  a ghost `Cancel`. Renders only when supplied. */
  readonly actions?: ReactNode;
  /** Tightens padding + shrinks the icon for inline use (e.g. near a
   *  dropzone). */
  readonly compact?: boolean;
  /** Optional monospace code block beneath the subtitle — used for
   *  parser line previews + raw error traces. */
  readonly detail?: ReactNode;
  /** Optional close (✕) button on the far right; fires `onClose`. */
  readonly onClose?: () => void;
  readonly subtitle?: ReactNode;
  readonly testId?: string;
  readonly title: ReactNode;
  readonly variant?: AlertVariant;
}

/**
 * Inline alert card — a bordered surface with a circular icon, title,
 * optional subtitle, optional monospace `detail` block, and an
 * optional action row.
 *
 * Three variants tint the icon background + title color: `danger`
 * (red) for blocking errors, `warn` (amber) for recoverable issues,
 * `info` (accent) for neutral status. A `compact` flag shrinks the
 * padding + icon for use as a banner near a dropzone.
 *
 * Consumers control the action row content (buttons / link-btns) by
 * passing a node into `actions` — keeps the primitive layout-agnostic.
 *
 * @returns An alert card React element.
 */
function Alert({
  actions,
  compact = false,
  detail,
  onClose,
  subtitle,
  testId,
  title,
  variant = 'info'
}: AlertProps) {
  const variantClass = styles[variant];
  const className = compact ? `${ variantClass } ${ styles.compact }` : variantClass;
  return (
    <div className={ className } data-testid={ testId } role="alert">
      <span className={ styles.icon } data-testid={ testId === undefined ? undefined : `${ testId }-icon` }>
        { Icons.warn }
      </span>
      <div className={ styles.body }>
        <div className={ styles.title } data-testid={ testId === undefined ? undefined : `${ testId }-title` }>
          { title }
        </div>
        { subtitle !== undefined && (
          <div className={ styles.sub } data-testid={ testId === undefined ? undefined : `${ testId }-sub` }>
            { subtitle }
          </div>
        ) }
        { detail !== undefined && (
          <div className={ styles.detail } data-testid={ testId === undefined ? undefined : `${ testId }-detail` }>
            { detail }
          </div>
        ) }
        { actions !== undefined && (
          <div className={ styles.actions } data-testid={ testId === undefined ? undefined : `${ testId }-actions` }>
            { actions }
          </div>
        ) }
      </div>
      { onClose !== undefined && (
        <button
          aria-label="Dismiss"
          className={ styles.close }
          data-testid={ testId === undefined ? undefined : `${ testId }-close` }
          onClick={ onClose }
          type="button"
        >
          { Icons.cross }
        </button>
      ) }
    </div>
  );
}

export default Alert;
