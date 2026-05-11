import { Stack } from '@mantine/core';

import Card from 'components/primitives/card';
import KvRow from 'components/primitives/kv-row';
import type { Session, SessionSummary } from 'types/session';
import { formatDuration } from 'utils';

interface TripStatsProps {
  readonly session: Session;
  readonly summary: SessionSummary;
  readonly testId?: string;
}

/**
 * Side panel listing the trip's high-level stats — date, vehicle,
 * distance, duration, max / avg speed, etc. Stacked KvRow primitives
 * keep the layout consistent with the design's other detail panels.
 *
 * Vehicle falls back to an em-dash placeholder when neither make nor
 * model was captured; mirrors the header KV strip's treatment.
 *
 * @returns A card containing the trip-stats KV stack.
 */
function TripStats({ session, summary, testId }: TripStatsProps) {
  const vehicleParts = [session.meta.vehicle.make, session.meta.vehicle.model]
    .filter((part) => part !== '');
  const vehicleLabel = vehicleParts.length === 0 ? '—' : vehicleParts.join(' ');

  return (
    <Card subtitle="session summary" testId={ testId } title="Trip Stats">
      <Stack gap={ 0 }>
        <KvRow
          label="Date"
          testId={ testId === undefined ? undefined : `${ testId }-date` }
          value={ new Date(session.meta.startedAt).toLocaleString() }
        />
        <KvRow
          label="Vehicle"
          testId={ testId === undefined ? undefined : `${ testId }-vehicle` }
          value={ vehicleLabel }
        />
        <KvRow
          label="Distance"
          testId={ testId === undefined ? undefined : `${ testId }-distance` }
          value={ `${ summary.dist.toFixed(1) } mi` }
        />
        <KvRow
          label="Duration"
          testId={ testId === undefined ? undefined : `${ testId }-duration` }
          value={ formatDuration(summary.duration) }
        />
        <KvRow
          label="Max Speed"
          testId={ testId === undefined ? undefined : `${ testId }-max-speed` }
          value={ `${ summary.maxSpeed.toFixed(0) } mph` }
        />
        <KvRow
          label="Avg MPG"
          testId={ testId === undefined ? undefined : `${ testId }-avg-mpg` }
          value={ summary.avgMpg.toFixed(1) }
        />
        <KvRow
          label="File"
          last
          testId={ testId === undefined ? undefined : `${ testId }-file` }
          value={ session.meta.fileName }
        />
      </Stack>
    </Card>
  );
}

export default TripStats;
