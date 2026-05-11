import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { Icons } from 'components/app/icons';

import styles from './index.module.scss';

interface RowMenuProps {
  readonly anchor: { readonly x: number; readonly y: number };
  readonly onClose: () => void;
  readonly onDelete: () => void;
  readonly onDuplicate: () => void;
  readonly onExport: () => void;
  readonly onOpen: () => void;
  readonly onRename: () => void;
  readonly onShowInFolder: () => void;
  readonly sessionName: string;
  readonly testId?: string;
}

/**
 * Popover menu anchored to the row's `…` button — matches handoff-4
 * (screens-lib.jsx `RowMenu`). Renders fixed-position with smart
 * placement: opens above the anchor if it would overflow the
 * viewport. Mouse-outside + Escape close it; clicks inside don't
 * bubble out.
 *
 * Menu items, in design order:
 *   Open · Rename… · Duplicate · ─ · Export CSV · Show in folder
 *   · ─ · Delete… (danger).
 *
 * @returns The row action popover React element.
 */
function RowMenu({
  anchor,
  onClose,
  onDelete,
  onDuplicate,
  onExport,
  onOpen,
  onRename,
  onShowInFolder,
  sessionName,
  testId
}: RowMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ left: number; ready: boolean; top: number }>({
    left:  -9999,
    ready: false,
    top:   -9999
  });

  /**
   * Measure-then-position so the menu's right edge sits flush with
   * the anchor's right edge, and the menu flips above the anchor
   * when it would otherwise overflow the viewport bottom.
   */
  useLayoutEffect(() => {
    const element = ref.current;
    if (element === null) return;
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const margin = 8;
    let left = anchor.x - width;
    let top = anchor.y;
    if (left < margin) left = margin;
    if (top + height > window.innerHeight - margin) top = anchor.y - height - 36;
    setPosition({ left, ready: true, top });
  }, [anchor]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent): void => {
      if (ref.current !== null && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ ref }
      className={ styles['menu-pop'] }
      data-testid={ testId }
      onClick={ (event) => event.stopPropagation() }
      role="menu"
      style={ {
        left:       position.left,
        top:        position.top,
        visibility: position.ready ? 'visible' : 'hidden'
      } }
    >
      <div className={ styles['menu-label'] } style={ { alignItems: 'center', display: 'flex', gap: 8 } }>
        <span
          style={ {
            color:        'var(--text-2)',
            flex:         1,
            fontSize:     11,
            letterSpacing: 0,
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            textTransform: 'none',
            whiteSpace:   'nowrap'
          } }
        >
          { sessionName }
        </span>
      </div>
      <button
        className={ styles['menu-item'] }
        data-testid={ testId === undefined ? undefined : `${ testId }-open` }
        onClick={ onOpen }
        role="menuitem"
        type="button"
      >
        <span className={ styles['menu-ico'] }>{ Icons.ext }</span>
        <span>Open</span>
        <span className={ `${ styles['menu-kbd'] } kbd` }>↵</span>
      </button>
      <button
        className={ styles['menu-item'] }
        data-testid={ testId === undefined ? undefined : `${ testId }-rename` }
        onClick={ onRename }
        role="menuitem"
        type="button"
      >
        <span className={ styles['menu-ico'] }>{ Icons.pencil }</span>
        <span>Rename…</span>
        <span className={ `${ styles['menu-kbd'] } kbd` }>R</span>
      </button>
      <button
        className={ styles['menu-item'] }
        data-testid={ testId === undefined ? undefined : `${ testId }-duplicate` }
        onClick={ onDuplicate }
        role="menuitem"
        type="button"
      >
        <span className={ styles['menu-ico'] }>{ Icons.copy }</span>
        <span>Duplicate</span>
        <span className={ `${ styles['menu-kbd'] } kbd` }>{ '⌘D' }</span>
      </button>
      <div className={ styles['menu-sep'] } />
      <button
        className={ styles['menu-item'] }
        data-testid={ testId === undefined ? undefined : `${ testId }-export` }
        onClick={ onExport }
        role="menuitem"
        type="button"
      >
        <span className={ styles['menu-ico'] }>{ Icons.upload }</span>
        <span>Export CSV</span>
      </button>
      <button
        className={ styles['menu-item'] }
        data-testid={ testId === undefined ? undefined : `${ testId }-show-in-folder` }
        onClick={ onShowInFolder }
        role="menuitem"
        type="button"
      >
        <span className={ styles['menu-ico'] }>{ Icons.folder }</span>
        <span>Show in folder</span>
        <span className={ `${ styles['menu-kbd'] } kbd` }>{ '⌥⌘R' }</span>
      </button>
      <div className={ styles['menu-sep'] } />
      <button
        className={ styles['menu-item-danger'] }
        data-testid={ testId === undefined ? undefined : `${ testId }-delete` }
        onClick={ onDelete }
        role="menuitem"
        type="button"
      >
        <span className={ styles['menu-ico'] }>{ Icons.trash }</span>
        <span>Delete…</span>
        <span
          className={ `${ styles['menu-kbd'] } kbd` }
          style={ { borderColor: 'rgba(255,90,90,.3)', color: 'var(--danger)' } }
        >
          { '⌫' }
        </span>
      </button>
    </div>
  );
}

export default RowMenu;
