import { useNavigate } from 'react-router-dom';

import { Icons } from 'components/app/icons';

import styles from './index.module.scss';

interface NotFoundProps {
  /** Route id from the URL — embedded in the pseudo-stack-trace card so
   *  the user (or a screenshot they send us) can see exactly which id
   *  missed the index. */
  readonly routeId: string;
  readonly testId?: string;
}

/**
 * Full-page 404 takeover for the session-detail route. Renders when
 * `/sessions/:id` resolves to a session that's not in the slice — a
 * deep link from a deleted / reinstalled / never-existed id.
 *
 * Visual matches the handoff's instrument-cluster style: a giant
 * ghosted "404" gradient numeral, an uppercase mono tag, a headline +
 * explanatory copy, a mono pseudo-stack-trace card showing the missing
 * path + 404 status, and two ghost actions (Back to Library + Import).
 *
 * @returns A 404 takeover React element.
 */
function NotFound({ routeId, testId }: NotFoundProps) {
  const navigate = useNavigate();
  return (
    <div className="page" data-testid={ testId }>
      <div className={ styles.notfound }>
        <div className={ styles.code } data-testid={ testId === undefined ? undefined : `${ testId }-code` }>
          404
        </div>
        <div className={ styles.tag } data-testid={ testId === undefined ? undefined : `${ testId }-tag` }>
          Session not found
        </div>
        <h2 className={ styles.headline } data-testid={ testId === undefined ? undefined : `${ testId }-headline` }>
          That session isn&apos;t in your library
        </h2>
        <p className={ styles.copy } data-testid={ testId === undefined ? undefined : `${ testId }-copy` }>
          The link points at a session that has been deleted, moved to another vehicle profile, or never existed on this machine. Sessions are stored locally — deep links don&apos;t survive a fresh install.
        </p>
        <div className={ styles.trace } data-testid={ testId === undefined ? undefined : `${ testId }-trace` }>
          GET <span className={ styles['trace-path'] }>/sessions/{ routeId }</span>
          { '  →  ' }
          <span className={ styles['trace-status'] }>404</span>
          <span className={ styles['trace-aside'] }>
            no row in <span className={ styles['trace-db'] }>~/Library/TorqueProAssistant/sessions.db</span>
          </span>
        </div>
        <div className={ styles.actions }>
          <button
            className="btn primary"
            data-testid={ testId === undefined ? undefined : `${ testId }-back` }
            onClick={ () => navigate('/library') }
            type="button"
          >
            { Icons.library }
            <span>Back to Library</span>
          </button>
          <button
            className="btn"
            data-testid={ testId === undefined ? undefined : `${ testId }-import` }
            onClick={ () => navigate('/import') }
            type="button"
          >
            { Icons.importArrow }
            <span>Import a CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
