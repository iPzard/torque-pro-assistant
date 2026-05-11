import { useEffect, useRef, useState } from 'react';

import { Icons } from 'components/app/icons';
import type { SessionMeta } from 'types/session';

interface RenameDialogProps {
  readonly meta: SessionMeta;
  readonly onCancel: () => void;
  readonly onSave: (nextName: string) => void;
  readonly testId?: string;
}

/** Max length for a session name. Mirrors handoff-4's `maxLength={80}`. */
const MAX_NAME_LENGTH = 80;

/**
 * Rename modal — matches handoff-4's `RenameDialog`. Single text input
 * pre-selected with the current name, a character counter, and
 * Save / Cancel buttons. Save is disabled while the trimmed input is
 * empty or unchanged.
 *
 * Backdrop click + Escape both close. The original CSV file is left
 * untouched — only the display name changes.
 *
 * @returns The rename modal React element.
 */
function RenameDialog({ meta, onCancel, onSave, testId }: RenameDialogProps) {
  const [name, setName] = useState(meta.name);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const trimmed = name.trim();
  const unchanged = trimmed === meta.name;
  const canSave = trimmed !== '' && !unchanged;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!canSave) return;
    onSave(trimmed);
  };

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
      <form className="modal" onSubmit={ handleSubmit }>
        <div className="modal-h">
          <div className="icon-circle">{ Icons.pencil }</div>
          <div style={ { flex: 1 } }>
            <div className="title">Rename session</div>
            <div className="sub">
              Choose a new display name. The original CSV file
              { ' ' }
              <span className="mono" style={ { color: 'var(--text-1)' } }>{ meta.fileName }</span>
              { ' ' }
              is left untouched.
            </div>
          </div>
        </div>
        <div className="modal-body">
          <label
            className="dim"
            style={ {
              display:       'block',
              fontSize:      10,
              letterSpacing: '.08em',
              marginBottom:  6,
              textTransform: 'uppercase'
            } }
          >
            Session name
          </label>
          <input
            ref={ inputRef }
            className="input"
            data-testid={ testId === undefined ? undefined : `${ testId }-input` }
            maxLength={ MAX_NAME_LENGTH }
            onChange={ (event) => setName(event.currentTarget.value) }
            style={ { fontSize: 13, height: 36, width: '100%' } }
            value={ name }
          />
          <div
            className="dim"
            style={ { display: 'flex', fontSize: 11, justifyContent: 'space-between', marginTop: 6 } }
          >
            <span>Max { MAX_NAME_LENGTH } characters</span>
            <span className="mono">{ name.length }/{ MAX_NAME_LENGTH }</span>
          </div>
        </div>
        <div className="modal-foot">
          <button
            className="btn ghost"
            data-testid={ testId === undefined ? undefined : `${ testId }-cancel` }
            onClick={ onCancel }
            type="button"
          >
            Cancel
          </button>
          <button
            className="btn primary"
            data-testid={ testId === undefined ? undefined : `${ testId }-save` }
            disabled={ !canSave }
            type="submit"
          >
            { Icons.check }
            <span>Save</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default RenameDialog;
