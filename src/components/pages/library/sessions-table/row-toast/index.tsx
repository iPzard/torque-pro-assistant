import { useEffect } from 'react';

import { Icons } from 'components/app/icons';

/** Toast severity — drives the leading icon + accent. */
export type ToastKind = 'err' | 'ok';

interface RowToastProps {
  readonly kind: ToastKind;
  readonly onDismiss: () => void;
  readonly testId?: string;
  readonly text: string;
}

/** Auto-dismiss timeout — matches handoff-4's 3,200 ms. */
const DISMISS_MS = 3200;

/**
 * Bottom-center pill toast — matches handoff-4's `row-toast`. Renders
 * a single icon + line of text, auto-dismisses after {@link DISMISS_MS}
 * ms, and animates in from below.
 *
 * @returns The toast pill React element.
 */
function RowToast({ kind, onDismiss, testId, text }: RowToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={ `row-toast${ kind === 'err' ? ' err' : '' }` } data-testid={ testId }>
      <span className="ico">{ kind === 'err' ? Icons.trash : Icons.check }</span>
      <span>{ text }</span>
    </div>
  );
}

export default RowToast;
