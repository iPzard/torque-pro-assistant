import { SimpleGrid, Stack } from '@mantine/core';

import type { Session, SessionSummary } from 'types/session';

import AfrChart from './afr-chart';
import BoostChart from './boost-chart';
import EngineVitalsChart from './engine-vitals-chart';
import MetricGrid from './metric-grid';
import MiniMap from './mini-map';
import PowerTorqueChart from './power-torque-chart';
import SpeedRpmChart from './speed-rpm-chart';
import ThrottleLoadChart from './throttle-load-chart';

interface OverviewProps {
  readonly session: Session;
  readonly summary: SessionSummary;
  readonly testId?: string;
}

/**
 * Cross-chart cursor sync id for every chart inside Overview. Recharts
 * routes hover events between sibling charts sharing the same id, so
 * mousing over the Speed/RPM centerpiece also moves the cursor in
 * Throttle, AFR, Boost, Engine Vitals, and Power & Torque.
 */
const OVERVIEW_SYNC_ID = 'session-overview';

/**
 * Renders the contents of the Session Detail page's Overview tab.
 * Composition:
 *   1. `MetricGrid` — eight-cell summary tiles.
 *   2. `SpeedRpmChart` — dual-axis centerpiece with brush.
 *   3. 2-column grid of supporting charts: Throttle/Load, AFR,
 *      Boost, Engine Vitals, Power & Torque.
 *   4. `MiniMap` — compact GPS route preview.
 *
 * Every chart receives the shared `OVERVIEW_SYNC_ID` so the hover
 * cursor moves in lockstep across the entire tab.
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
        syncId={ OVERVIEW_SYNC_ID }
        testId={ testId === undefined ? undefined : `${ testId }-speed-rpm` }
      />
      <SimpleGrid cols={ { base: 1, md: 2 } } spacing="md">
        <ThrottleLoadChart
          data={ session.data }
          syncId={ OVERVIEW_SYNC_ID }
          testId={ testId === undefined ? undefined : `${ testId }-throttle-load` }
        />
        <AfrChart
          data={ session.data }
          syncId={ OVERVIEW_SYNC_ID }
          testId={ testId === undefined ? undefined : `${ testId }-afr` }
        />
        <BoostChart
          data={ session.data }
          syncId={ OVERVIEW_SYNC_ID }
          testId={ testId === undefined ? undefined : `${ testId }-boost` }
        />
        <EngineVitalsChart
          data={ session.data }
          syncId={ OVERVIEW_SYNC_ID }
          testId={ testId === undefined ? undefined : `${ testId }-engine-vitals` }
        />
        <PowerTorqueChart
          data={ session.data }
          syncId={ OVERVIEW_SYNC_ID }
          testId={ testId === undefined ? undefined : `${ testId }-power-torque` }
        />
        <MiniMap
          data={ session.data }
          testId={ testId === undefined ? undefined : `${ testId }-mini-map` }
        />
      </SimpleGrid>
    </Stack>
  );
}

export default Overview;
