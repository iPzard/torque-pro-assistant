import { useEffect } from 'react';

import { Icons } from 'components/app/icons';
import type { SessionMeta } from 'types/session';
import { formatDuration } from 'utils';

interface DeleteDialogProps {
  readonly meta: SessionMeta;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly testId?: string;
}

/** Format bytes the way handoff-4's `fmtFileSize` does. */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${ bytes } B`;
  if (bytes < 1024 * 1024) return `${ (bytes / 1024).toFixed(0) } KB`;
  return `${ (bytes / 1024 / 1024).toFixed(2) } MB`;
};

/**
 * Delete confirmation modal — matches handoff-4's
 * `ConfirmDeleteDialog`. Destructive red icon-circle + headline, a
 * read-only summary grid (File / Recorded / Duration / Size), and
 * Cancel / Delete buttons. Enter confirms, Escape cancels.
 *
 * @returns The delete confirmation modal React element.
 */
function DeleteDialog({ meta, onCancel, onConfirm, testId }: DeleteDialogProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onCancel();
      if (event.key === 'Enter')  onConfirm();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel, onConfirm]);

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
      <div className="modal">
        <div className="modal-h">
          <div className="icon-circle danger">{ Icons.trash }</div>
          <div style={ { flex: 1 } }>
            <div className="title">Delete this session?</div>
            <div className="sub">
              <span style={ { color: 'var(--text-1)' } }>&ldquo;{ meta.name }&rdquo;</span>
              { ' will be removed from your library. The original CSV stays on disk — re-import it any time.' }
            </div>
          </div>
        </div>
        <div className="modal-body">
          <div
            style={ {
              background:          'var(--bg-2)',
              border:              '1px solid var(--border)',
              borderRadius:        8,
              columnGap:           14,
              display:             'grid',
              fontSize:            12,
              gridTemplateColumns: 'auto 1fr',
              padding:             '10px 12px',
              rowGap:              6
            } }
          >
            <span className="dim">File</span>
            <span className="mono" style={ { color: 'var(--text-1)' } }>{ meta.fileName }</span>
            <span className="dim">Recorded</span>
            <span>
              { new Date(meta.startedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) }
              { ' · ' }
              { new Date(meta.startedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }
            </span>
            <span className="dim">Duration</span>
            <span className="mono">{ formatDuration(meta.duration) }</span>
            <span className="dim">Size</span>
            <span className="mono">{ formatFileSize(meta.fileSize) }</span>
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
            className="btn danger"
            data-testid={ testId === undefined ? undefined : `${ testId }-confirm` }
            onClick={ onConfirm }
            type="button"
          >
            { Icons.trash }
            <span>Delete session</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteDialog;
