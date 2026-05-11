import { Stack } from '@mantine/core';

import type { Session, SessionSummary } from 'types/session';

import MetricGrid from './metric-grid';
import SpeedRpmChart from './speed-rpm-chart';

interface OverviewProps {
  readonly session: Session;
  readonly summary: SessionSummary;
  readonly testId?: string;
}

/**
 * Renders the contents of the Session Detail page's Overview tab.
 * Composes the eight-cell `MetricGrid` (peak / summary stats) above
 * the dual-axis Speed + RPM chart with brush. Subsequent overview
 * charts (Throttle/Load, AFR, Boost, Engine Vitals, Power & Torque,
 * MiniMap) land in the next pass.
 *
 * The shared `syncId` (`'session-overview'`) wires cross-chart cursor
 * sync for every chart inside Overview — Recharts handles the cursor
 * coordination when sibling charts on the page share an id.
 *
 * @returns The Overview tab body React element.
 */
function Overview({ session, summary, testId }: OverviewProps) {
  return (
    <Stack data-testid={ testId } gap="md">
      <MetricGrid
        summary={ summary }
        testId={ testId === undefined ? undefined : `${ testId }-metric-grid` }
      />
      <SpeedRpmChart
        data={ session.data }
        syncId="session-overview"
        testId={ testId === undefined ? undefined : `${ testId }-speed-rpm` }
      />
    </Stack>
  );
}

export default Overview;
