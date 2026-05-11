import { useEffect } from 'react';

import { Icons } from 'components/app/icons';
import type { SavedVehicle } from 'state/preferences';

import styles from './index.module.scss';

export interface DeleteDialogProps {
  /** Count of calibration overrides on the vehicle — surfaced in the
   *  copy so the user sees what additional state goes away. */
  readonly calibrationCount: number;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly testId?: string;
  readonly vehicle: SavedVehicle;
}

/**
 * Confirmation dialog for the Vehicle Detail page's delete action.
 * Modeled on the design — danger-tinted icon circle, destructive
 * primary action labeled `Delete vehicle`, copy explaining what
 * persists vs. what goes away.
 *
 * Esc closes; click-outside dismisses. The parent owns the actual
 * dispatch + navigate side effects.
 *
 * @returns The delete-confirm modal React element.
 */
function DeleteDialog({ calibrationCount, onCancel, onConfirm, testId, vehicle }: DeleteDialogProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      aria-modal="true"
      className="modal-backdrop"
      data-testid={ testId }
      onMouseDown={ (event) => {
        if (event.target === event.currentTarget) onCancel();
      } }
      role="dialog"
    >
      <div className="modal" style={ { width: 460 } }>
        <div className="modal-h">
          <span className={ `icon-circle ${ styles['icon-danger'] }` }>{ Icons.trash }</span>
          <div style={ { flex: 1 } }>
            <div className="title">Delete this vehicle?</div>
            <div className="sub">
              <span style={ { color: 'var(--text-1)' } }>
                &ldquo;{ vehicle.year === 0 ? '' : `${ vehicle.year } ` }{ vehicle.make } { vehicle.model }&rdquo;
              </span>
              { ' will be removed from your library along with ' }
              { calibrationCount } calibration override{ calibrationCount === 1 ? '' : 's' }.
              Sessions logged against this vehicle stay on disk but lose their vehicle assignment.
            </div>
          </div>
        </div>
        <div className={ styles.foot }>
          <button
            className="btn ghost"
            data-testid={ testId === undefined ? undefined : `${ testId }-cancel` }
            onClick={ onCancel }
            type="button"
          >
            Cancel
          </button>
          <span style={ { flex: 1 } } />
          <button
            className={ `btn ${ styles.confirm }` }
            data-testid={ testId === undefined ? undefined : `${ testId }-confirm` }
            onClick={ onConfirm }
            type="button"
          >
            { Icons.trash }<span>Delete vehicle</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteDialog;
