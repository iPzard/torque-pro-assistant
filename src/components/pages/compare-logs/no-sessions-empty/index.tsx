import { useNavigate } from 'react-router-dom';

import { Icons } from 'components/app/icons';
import Card from 'components/primitives/card';

import styles from './index.module.scss';

export interface NoSessionsEmptyProps {
  readonly testId?: string;
}

/**
 * Compare page's "zero sessions imported" empty state. Renders when
 * the user navigates to `/compare` with an empty session library —
 * Compare can't overlay anything without rows, so the page bails to
 * an explainer card with a primary `Import a session` action.
 *
 * Distinct from the picker stage (which renders when sessions exist
 * but fewer than two are selected) — that one shows the session list
 * + explainer; this one is a single centered card.
 *
 * @returns A no-sessions empty-state React element.
 */
function NoSessionsEmpty({ testId }: NoSessionsEmptyProps) {
  const navigate = useNavigate();
  return (
    <Card testId={ testId }>
      <div className={ styles.empty }>
        <div className={ styles.art } data-testid={ testId === undefined ? undefined : `${ testId }-art` }>
          { Icons.compare }
        </div>
        <h3 className={ styles.headline } data-testid={ testId === undefined ? undefined : `${ testId }-headline` }>
          Compare needs at least two sessions
        </h3>
        <p className={ styles.copy } data-testid={ testId === undefined ? undefined : `${ testId }-copy` }>
          You haven&apos;t imported anything yet. Compare overlays speed, RPM, throttle and boost from up to four sessions so you can see how a tune, a route, or a driver changed the run.
        </p>
        <div className={ styles.actions }>
          <button
            className="btn primary"
            data-testid={ testId === undefined ? undefined : `${ testId }-import` }
            onClick={ () => navigate('/import') }
            type="button"
          >
            { Icons.plus }<span>Import a session</span>
          </button>
        </div>
      </div>
    </Card>
  );
}

export default NoSessionsEmpty;
