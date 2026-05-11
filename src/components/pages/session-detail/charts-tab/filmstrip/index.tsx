import { Stack, Text } from '@mantine/core';

import LineChart, { type LineChartSeries } from 'components/charts/line-chart';
import Card from 'components/primitives/card';
import { PID_BY_KEY } from 'data/pids';
import type { SessionDataRow } from 'types/session';

export interface FilmstripProps {
  readonly data: readonly SessionDataRow[];
  readonly selectedPids: readonly string[];
  /** Cross-chart cursor sync id. Filmstrip charts all share it so
   *  the hover position stays in lockstep down the stack. */
  readonly syncId?: string;
  readonly testId?: string;
}

/**
 * Filmstrip of one chart per selected PID. Each card pulls its
 * color / label / unit from the PID catalog and renders a single-
 * series `LineChart` at a fixed sub-chart height. Unknown PID keys
 * (e.g. a previously-saved selection whose key was renamed) are
 * skipped silently — the picker drawer will never offer them, so
 * this only matters for forward-compat with persisted state.
 *
 * Empty selection renders a centered helper line steering the user
 * toward the picker drawer.
 *
 * @returns The filmstrip stack React element.
 */
function Filmstrip({ data, selectedPids, syncId, testId }: FilmstripProps) {
  if (selectedPids.length === 0) {
    return (
      <Stack data-testid={ testId === undefined ? undefined : `${ testId }-empty` } gap="xs">
        <Text c="dimmed" size="sm">
          No PIDs selected. Open the PID picker to choose channels.
        </Text>
      </Stack>
    );
  }

  return (
    <Stack data-testid={ testId } gap="md">
      { selectedPids.map((pidKey) => {
        const pid = PID_BY_KEY[pidKey];
        if (pid === undefined) return null;
        const series: LineChartSeries = {
          color: pid.color,
          key:   pid.key,
          label: pid.label,
          unit:  pid.unit
        };
        return (
          <Card
            key={ pidKey }
            subtitle={ pid.unit }
            testId={ testId === undefined ? undefined : `${ testId }-card-${ pidKey }` }
            title={ pid.label }
          >
            <LineChart
              data={ data }
              height={ 140 }
              series={ [series] }
              syncId={ syncId }
              testId={ testId === undefined ? undefined : `${ testId }-chart-${ pidKey }` }
            />
          </Card>
        );
      }) }
    </Stack>
  );
}

export default Filmstrip;
