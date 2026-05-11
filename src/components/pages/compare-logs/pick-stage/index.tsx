import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icons } from 'components/app/icons';
import Card from 'components/primitives/card';
import type { UnitsPreference } from 'state/preferences';
import type { Session } from 'types/session';
import { convertDistance, summarize } from 'utils';

import styles from './index.module.scss';

interface PickStageProps {
  /** Hex / CSS var palette per chip color, indexed by selection order. */
  readonly colors: readonly string[];
  /** Hard cap on the number of sessions that can be picked. */
  readonly max: number;
  /** Caller commits the picked ids (writes them to the URL). */
  readonly onPick: (ids: readonly string[]) => void;
  /** Currently-picked ids — used to seed the local selection so the
   *  picker survives a re-render driven by a URL change. */
  readonly seededIds: readonly string[];
  /** All sessions in the library, in display order. */
  readonly sessions: readonly Session[];
  readonly testId?: string;
  readonly units: UnitsPreference;
}

interface FeatureProps {
  readonly body: string;
  readonly icon: React.ReactNode;
  readonly title: string;
}

function Feature({ body, icon, title }: FeatureProps) {
  return (
    <div className={ styles.feature }>
      <span className={ styles['feature-icon'] }>{ icon }</span>
      <div>
        <div className={ styles['feature-title'] }>{ title }</div>
        <div className={ styles['feature-body'] }>{ body }</div>
      </div>
    </div>
  );
}

/**
 * Compare picker stage — shown when sessions exist but fewer than two
 * are selected. Two-column grid: a left card carries a searchable
 * session list with a checkbox per row + a footer with Clear /
 * Compare actions; the right column carries an explainer card +
 * a live preview of picked sessions.
 *
 * Selection is local state (a Set). When the user hits Compare, the
 * picker hands the ids list up via `onPick` so the parent can update
 * the URL's `?ids=` param + flip the page into the overlay view.
 *
 * The selection caps at `max` (4 by default); rows past the cap render
 * disabled. A 1-picked state surfaces an inline warn hint above the
 * Compare button.
 *
 * @returns The picker stage React element.
 */
function PickStage({ colors, max, onPick, sessions, seededIds, testId, units }: PickStageProps) {
  const navigate = useNavigate();
  const [picked, setPicked] = useState<ReadonlySet<string>>(() => new Set(seededIds));
  const [query, setQuery] = useState('');

  const pickedArr = useMemo(() => [...picked], [picked]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term === '') return sessions;
    return sessions.filter(
      (session) => session.meta.name.toLowerCase().includes(term)
        || session.meta.fileName.toLowerCase().includes(term)
    );
  }, [sessions, query]);

  const toggle = (id: string): void => {
    const next = new Set(picked);
    if (next.has(id)) {
      next.delete(id);
    } else if (next.size < max) {
      next.add(id);
    }
    setPicked(next);
  };

  const footTone = picked.size === 1 ? styles['foot-detail-warn'] : styles['foot-detail'];
  const footCopy = picked.size === 0
    ? 'Pick at least two sessions to start comparing.'
    : picked.size === 1
      ? 'Pick at least one more session to start comparing.'
      : `Ready — ${ picked.size } selected.`;

  return (
    <>
      <div className={ styles.grid } data-testid={ testId }>
        {/* ── Left: picker ── */}
        <Card flush testId={ testId === undefined ? undefined : `${ testId }-picker` }>
          <div className={ styles['pick-header'] }>
            <div>
              <div className={ styles['pick-header-title'] }>Pick sessions to compare</div>
              <div className={ styles['pick-header-detail'] }>
                Choose 2 to { max }. Currently selected:{ ' ' }
                <span
                  className="mono"
                  data-testid={ testId === undefined ? undefined : `${ testId }-counter` }
                  style={ { color: picked.size === 0 ? 'var(--text-3)' : 'var(--text-0)' } }
                >
                  { picked.size }/{ max }
                </span>
              </div>
            </div>
            <label className={ styles.search }>
              <span aria-hidden>{ Icons.search }</span>
              <input
                data-testid={ testId === undefined ? undefined : `${ testId }-search` }
                onChange={ (event) => setQuery(event.currentTarget.value) }
                placeholder="Filter sessions…"
                value={ query }
              />
            </label>
          </div>

          <div className={ styles['session-list'] } data-testid={ testId === undefined ? undefined : `${ testId }-list` }>
            { filtered.map((session) => {
              const summary = summarize(session);
              const distance = convertDistance(summary.dist, units);
              const index = pickedArr.indexOf(session.meta.id);
              const on = index >= 0;
              const disabled = !on && picked.size >= max;
              return (
                <button
                  key={ session.meta.id }
                  className={ on ? styles['row-on'] : styles.row }
                  data-testid={ testId === undefined ? undefined : `${ testId }-row-${ session.meta.id }` }
                  disabled={ disabled }
                  onClick={ () => toggle(session.meta.id) }
                  type="button"
                >
                  <span className={ on ? styles['checkbox-on'] : styles.checkbox } />
                  <span
                    className={ on ? styles.swatch : styles['swatch-empty'] }
                    style={ on ? { background: colors[index] } : undefined }
                  />
                  <div className={ styles['row-name'] }>
                    <div className={ styles['row-name-text'] }>{ session.meta.name }</div>
                    <div className={ styles['row-meta'] }>
                      { new Date(session.meta.startedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) }
                      { ' · ' }{ distance.value.toFixed(1) } { distance.unit }
                      { ' · peak ' }{ Math.round(summary.peakHp) } hp
                    </div>
                  </div>
                  <span className={ styles['row-file'] }>{ session.meta.fileName }</span>
                </button>
              );
            }) }
            { filtered.length === 0 && (
              <div className={ styles['no-match'] } data-testid={ testId === undefined ? undefined : `${ testId }-no-match` }>
                No sessions match &ldquo;{ query }&rdquo;.
              </div>
            ) }
          </div>

          <div className={ styles.foot }>
            <div
              className={ footTone }
              data-testid={ testId === undefined ? undefined : `${ testId }-foot-detail` }
            >
              { footCopy }
            </div>
            <span style={ { flex: 1 } } />
            <button
              className="btn ghost sm"
              data-testid={ testId === undefined ? undefined : `${ testId }-clear` }
              disabled={ picked.size === 0 }
              onClick={ () => setPicked(new Set()) }
              type="button"
            >
              Clear
            </button>
            <button
              className="btn primary"
              data-testid={ testId === undefined ? undefined : `${ testId }-compare` }
              disabled={ picked.size < 2 }
              onClick={ () => onPick(pickedArr) }
              type="button"
            >
              { Icons.compare }
              <span>Compare { picked.size >= 2 ? `${ picked.size } ` : '' }sessions</span>
            </button>
          </div>
        </Card>

        {/* ── Right: explainer + picked previews ── */}
        <div className={ styles.side }>
          <Card
            subtitle="Read this once — it pays off"
            testId={ testId === undefined ? undefined : `${ testId }-explainer` }
            title="What Compare does"
          >
            <div className={ styles.explain }>
              <Feature
                body="Speed, RPM, throttle and boost plotted on the same axes so you can see where two runs diverge."
                icon={ Icons.compare }
                title="Overlay charts"
              />
              <Feature
                body="Snap by start-of-trip or by GPS location — useful when comparing identical routes at different times."
                icon={ Icons.session }
                title="Aligned timelines"
              />
              <Feature
                body="Peak HP, max boost, 0–60, MPG. Δ column shows how much each metric moved between the first two picks."
                icon={ Icons.table }
                title="Side-by-side summary"
              />
            </div>
            <div className={ styles['cap-note'] }>
              Up to <span className="mono" style={ { color: 'var(--text-1)' } }>{ max }</span> sessions overlay smoothly on a modern laptop. Beyond that, lines start to crowd and the comparison gets hard to read.
            </div>
          </Card>

          <Card
            subtitle={ picked.size === 0 ? `Up to ${ max } sessions` : `${ picked.size } of ${ max }` }
            testId={ testId === undefined ? undefined : `${ testId }-picked` }
            title={ picked.size === 0 ? 'Nothing picked yet' : 'Picked' }
          >
            { picked.size === 0 && (
              <div>
                <div className={ styles['side-empty-copy'] }>
                  Selected sessions will preview here with their color swatch and headline stats.
                </div>
                <div className={ styles['side-ghosts'] }>
                  { [0, 1].map((slot) => (
                    <div key={ slot } className={ styles['side-ghost'] }>
                      <span className={ styles['side-ghost-swatch'] } />
                      <div className={ styles['side-ghost-lines'] }>
                        <div />
                        <div style={ { width: '60%' } } />
                      </div>
                    </div>
                  )) }
                </div>
              </div>
            ) }
            { pickedArr.map((id, index) => {
              const session = sessions.find((entry) => entry.meta.id === id);
              if (session === undefined) return null;
              const summary = summarize(session);
              const distance = convertDistance(summary.dist, units);
              return (
                <div
                  key={ id }
                  className={ styles['picked-row'] }
                  data-testid={ testId === undefined ? undefined : `${ testId }-picked-${ id }` }
                >
                  <span className={ styles.swatch } style={ { background: colors[index] } } />
                  <div style={ { flex: 1, minWidth: 0 } }>
                    <div className={ styles['picked-row-name'] }>{ session.meta.name }</div>
                    <div className={ styles['picked-row-meta'] }>
                      { new Date(session.meta.startedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) }
                      { ' · peak ' }{ Math.round(summary.peakHp) } hp
                      { ' · ' }{ distance.value.toFixed(1) } { distance.unit }
                    </div>
                  </div>
                  <button
                    aria-label="Remove"
                    className="btn ghost icon sm"
                    data-testid={ testId === undefined ? undefined : `${ testId }-remove-${ id }` }
                    onClick={ () => toggle(id) }
                    type="button"
                  >
                    { Icons.cross }
                  </button>
                </div>
              );
            }) }
            { picked.size === 1 && (
              <div className={ styles['need-more'] } data-testid={ testId === undefined ? undefined : `${ testId }-need-more` }>
                <span aria-hidden>{ Icons.warn }</span>
                <span>Pick one more session to start comparing.</span>
              </div>
            ) }
          </Card>
        </div>
      </div>

      <div className={ styles['footer-note'] }>
        Looking for a specific session?{ ' ' }
        <button
          className="link-btn"
          onClick={ () => navigate('/library') }
          type="button"
        >
          Open the Library
        </button>
        { ' or ' }
        <button
          className="link-btn"
          onClick={ () => navigate('/import') }
          type="button"
        >
          import a new CSV
        </button>
        .
      </div>
    </>
  );
}

export default PickStage;
