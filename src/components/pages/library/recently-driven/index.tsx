import { useNavigate } from 'react-router-dom';

import Sparkline from 'components/charts/sparkline';
import type { UnitsPreference } from 'state/preferences';
import type { Session, SessionSummary } from 'types/session';
import { convertDistance, convertSpeed } from 'utils';

export interface RecentlyDrivenProps {
  /** Pre-computed (session, summary) pairs from the composer's
   *  `useMemo`. Sorted by `startedAt` descending; this strip slices
   *  the top three. */
  readonly rows: readonly { readonly session: Session; readonly summary: SessionSummary }[];
  readonly testId?: string;
  readonly units: UnitsPreference;
}

export interface KvProps {
  readonly label: string;
  readonly last?: boolean;
  readonly testId?: string;
  readonly value: string;
}

/** Single KV tile inside the recent card's bottom strip. */
function Kv({ label, last = false, testId, value }: KvProps) {
  return (
    <div
      data-testid={ testId }
      style={ {
        borderRight: last ? 0 : '1px solid var(--border)',
        padding:     '10px 12px'
      } }
    >
      <div
        className="dim"
        style={ { fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase' } }
      >
        { label }
      </div>
      <div className="mono" style={ { fontSize: 14, marginTop: 2 } }>{ value }</div>
    </div>
  );
}

const vehiclePillLabel = (session: Session): string => {
  const { make, model, year } = session.meta.vehicle;
  const parts = [year === 0 ? '' : String(year), make, model].filter((part) => part !== '');
  return parts.length === 0 ? 'Unknown vehicle' : parts.join(' ');
};

/**
 * "Recently driven" card strip beneath the Library table. Picks the
 * top three rows (composer pre-sorts by date descending) and renders
 * each as a clickable card with:
 *
 *   - Date + time header with a vehicle pill on the right.
 *   - Session name.
 *   - Filled speed sparkline.
 *   - Three KV tiles (Dist, Max, 0-60) at the foot.
 *
 * Hidden entirely when the input is empty.
 *
 * @returns A `<section>` with the recent card grid, or `null`.
 */
function RecentlyDriven({ rows, testId, units }: RecentlyDrivenProps) {
  const navigate = useNavigate();

  if (rows.length === 0) return null;
  const top = rows.slice(0, 3);

  return (
    <>
      <div className="section-title" data-testid={ testId === undefined ? undefined : `${ testId }-title` }>
        Recently driven
      </div>
      <div
        data-testid={ testId }
        style={ {
          display:             'grid',
          gap:                 12,
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
        } }
      >
        { top.map(({ session, summary }) => {
          const meta = session.meta;
          const distance = convertDistance(summary.dist, units);
          const speed = convertSpeed(summary.maxSpeed, units);
          return (
            <button
              key={ meta.id }
              className="card"
              data-testid={ testId === undefined ? undefined : `${ testId }-card-${ meta.id }` }
              onClick={ () => navigate(`/sessions/${ meta.id }`) }
              style={ {
                cursor:    'pointer',
                font:      'inherit',
                overflow:  'hidden',
                padding:   0,
                textAlign: 'left',
                width:     '100%'
              } }
              type="button"
            >
              <div style={ { padding: '12px 14px 6px' } }>
                <div style={ { alignItems: 'center', display: 'flex', justifyContent: 'space-between' } }>
                  <div
                    className="dim mono"
                    style={ { fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' } }
                  >
                    { new Date(meta.startedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) }
                    { ' · ' }
                    { new Date(meta.startedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }
                  </div>
                  <span className="pill amber">
                    <i className="dot" />
                    { vehiclePillLabel(session) }
                  </span>
                </div>
                <div style={ { fontSize: 14, fontWeight: 600, marginTop: 6 } }>{ meta.name }</div>
              </div>
              <div style={ { padding: '6px 14px' } }>
                <Sparkline
                  color="var(--d-speed)"
                  data={ session.data }
                  dataKey="speed_mph"
                  filled
                  height={ 36 }
                  width={ 250 }
                />
              </div>
              <div
                style={ {
                  borderTop:           '1px solid var(--border)',
                  display:             'grid',
                  gridTemplateColumns: '1fr 1fr 1fr'
                } }
              >
                <Kv
                  label="Dist"
                  testId={ testId === undefined ? undefined : `${ testId }-card-${ meta.id }-dist` }
                  value={ `${ distance.value.toFixed(1) } ${ distance.unit }` }
                />
                <Kv
                  label="Max"
                  testId={ testId === undefined ? undefined : `${ testId }-card-${ meta.id }-max` }
                  value={ `${ speed.value.toFixed(0) } ${ speed.unit }` }
                />
                <Kv
                  label="0-60"
                  last
                  testId={ testId === undefined ? undefined : `${ testId }-card-${ meta.id }-zero-to-sixty` }
                  value={ summary.t0to60 === null ? '—' : `${ summary.t0to60.toFixed(1) }s` }
                />
              </div>
            </button>
          );
        }) }
      </div>
    </>
  );
}

export default RecentlyDriven;
