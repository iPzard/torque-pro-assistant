import { useLocation } from 'react-router-dom';

import styles from './index.module.scss';

/** Display label for each top-level route. */
const ROUTE_LABELS: Readonly<Record<string, string>> = {
  '/compare':  'Compare',
  '/import':   'Import',
  '/library':  'Library',
  '/settings': 'Settings'
};

/**
 * Translate the current location pathname to the design's status-bar
 * route label. Defaults to `'Library'` for `/` (which redirects there)
 * and to a `Session · <id>` form for the detail route.
 */
const labelFor = (pathname: string): string => {
  if (pathname === '/' || pathname === '') return 'Library';
  if (pathname.startsWith('/sessions/')) {
    const id = pathname.slice('/sessions/'.length);
    return `Session · ${ id }`;
  }
  return ROUTE_LABELS[pathname] ?? 'Library';
};

/**
 * UTC offset string derived from the user's environment, formatted as
 * `UTC-7` / `UTC+0`. Computed once at render — the offset only changes
 * across daylight-saving transitions, which are rare enough to not
 * matter for a session-long viewer.
 */
const utcOffsetLabel = (): string => {
  const minutes = -new Date().getTimezoneOffset();
  const sign = minutes >= 0 ? '+' : '-';
  const hours = Math.abs(Math.trunc(minutes / 60));
  return `UTC${ sign }${ hours }`;
};

export interface StatusBarProps {
  readonly testId?: string;
  /** Imperial / metric label for the units segment. Sourced from the
   *  preferences slice by the caller. */
  readonly units: 'imperial' | 'metric';
}

/**
 * 24px footer pinned to the bottom of `app-main`. Renders the design's
 * `READY · <route> · <units> · UTC<offset> · <fps>` strip in mono
 * dim text. Sub-component of the App shell — pages don't import it
 * directly; the App's main hosts it.
 *
 * fps is a static design-flavor sentinel (the original prototype
 * showed `120 fps`); a real frame-rate counter belongs to a follow-up
 * once it's worth the perf-monitor wiring.
 *
 * @returns A fixed-height status strip.
 */
function StatusBar({ testId, units }: StatusBarProps) {
  const location = useLocation();
  const routeLabel = labelFor(location.pathname);
  const unitsLabel = units === 'metric' ? 'Metric units' : 'Imperial units';

  return (
    <div className={ styles['status-bar'] } data-testid={ testId }>
      <span data-testid={ testId === undefined ? undefined : `${ testId }-ready` }>READY</span>
      <span>·</span>
      <span data-testid={ testId === undefined ? undefined : `${ testId }-route` }>{ routeLabel }</span>
      <span>·</span>
      <span data-testid={ testId === undefined ? undefined : `${ testId }-units` }>{ unitsLabel }</span>
      <div style={ { flex: 1 } } />
      <span data-testid={ testId === undefined ? undefined : `${ testId }-utc` }>{ utcOffsetLabel() }</span>
      <span>·</span>
      <span data-testid={ testId === undefined ? undefined : `${ testId }-fps` }>120 fps</span>
    </div>
  );
}

export default StatusBar;
