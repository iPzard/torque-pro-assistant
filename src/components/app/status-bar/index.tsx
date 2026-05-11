import { Group, Text } from '@mantine/core';
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
 * and any unrecognized path.
 */
const labelFor = (pathname: string): string => {
  if (pathname === '/' || pathname === '') return 'Library';
  return ROUTE_LABELS[pathname] ?? 'Library';
};

interface StatusBarProps {
  readonly testId?: string;
  /** Imperial / metric label for the rightmost segment. Sourced from
   *  the preferences slice once that lands; defaults to imperial for
   *  now. */
  readonly units?: 'imperial' | 'metric';
}

/**
 * 24px footer pinned to the bottom of `AppShell.Main`. Renders the
 * design's `READY · <route> · <units>` strip in the mono font + dim
 * color. Sub-component of the App shell — pages don't import it
 * directly; the App's `AppShell.Footer` hosts it.
 *
 * @returns A fixed-height status strip.
 */
function StatusBar({ testId, units = 'imperial' }: StatusBarProps) {
  const location = useLocation();
  const routeLabel = labelFor(location.pathname);
  const unitsLabel = units === 'metric' ? 'Metric units' : 'Imperial units';

  return (
    <Group
      className={ styles.bar }
      data-testid={ testId }
      gap="md"
      h="100%"
      px="md"
      wrap="nowrap"
    >
      <Text c="dimmed" className={ styles.text } data-testid={ testId ? `${testId}-ready` : undefined }>
        READY
      </Text>
      <Text c="dimmed" className={ styles.text }>·</Text>
      <Text c="dimmed" className={ styles.text } data-testid={ testId ? `${testId}-route` : undefined }>
        { routeLabel }
      </Text>
      <Text c="dimmed" className={ styles.text }>·</Text>
      <Text c="dimmed" className={ styles.text } data-testid={ testId ? `${testId}-units` : undefined }>
        { unitsLabel }
      </Text>
    </Group>
  );
}

export default StatusBar;
