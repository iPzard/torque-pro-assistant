import { Icons } from 'components/app/icons';

import styles from './index.module.scss';

interface NoGpsEmptyProps {
  /** Total row count for the session — surfaced in the bottom-most
   *  check line so the user sees how much data IS captured. */
  readonly rowCount: number;
  readonly testId?: string;
}

/**
 * Rich "no GPS data" empty state for the Map tab. Replaces the prior
 * one-line placeholder with a dashed-icon card, headline, a soft
 * copy block, and a 2-column mono checklist that lists which signals
 * the session DOES carry so the user can still find the PIDs worth
 * charting.
 *
 * Shown when `buildRoutePolyline` returns null start / end — i.e.
 * fewer than two GPS-bearing samples — typically OBD-only captures
 * where the phone's GPS was off.
 *
 * @returns A no-GPS empty state React element.
 */
function NoGpsEmpty({ rowCount, testId }: NoGpsEmptyProps) {
  return (
    <div className={ styles.empty } data-testid={ testId }>
      <div className={ styles.icon } data-testid={ testId === undefined ? undefined : `${ testId }-icon` }>
        { Icons.map }
      </div>
      <h4 className={ styles.headline } data-testid={ testId === undefined ? undefined : `${ testId }-headline` }>
        No GPS data in this session
      </h4>
      <div className={ styles.sub } data-testid={ testId === undefined ? undefined : `${ testId }-sub` }>
        Torque Pro didn&apos;t log latitude/longitude — maybe location permission was off, or the dongle was indoors. Other PIDs are fine to chart.
      </div>
      <div className={ styles.checks } data-testid={ testId === undefined ? undefined : `${ testId }-checks` }>
        <span className={ styles['check-bad'] }>×</span>
        <span>GPS coordinates</span>
        <span className={ styles['check-ok'] }>✓</span>
        <span>Engine RPM, speed, throttle</span>
        <span className={ styles['check-ok'] }>✓</span>
        <span>Boost, AFR, temps</span>
        <span className={ styles['check-neutral'] }>·</span>
        <span>{ rowCount.toLocaleString() } rows logged</span>
      </div>
    </div>
  );
}

export default NoGpsEmpty;
