import { Stack } from '@mantine/core';
import { useState } from 'react';

import Brush from 'components/charts/brush';
import LineChart, { type LineChartSeries } from 'components/charts/line-chart';
import Card from 'components/primitives/card';
import { useAppSelector } from 'state/hooks';
import { selectUnits } from 'state/preferences';
import type { SessionDataRow } from 'types/session';
import { resolvePidForUnits } from 'utils';

export interface SpeedRpmChartProps {
  readonly data: readonly SessionDataRow[];
  /** Cross-chart cursor sync id. Pass the same value to sibling charts
   *  on the Overview tab so the hover cursor stays in lockstep. */
  readonly syncId?: string;
  readonly testId?: string;
}

/**
 * Speed + Engine RPM dual-axis chart with a brush strip below for
 * windowing. Pairs the design's Overview centerpiece — speed read off
 * the left axis (cyan), RPM off the right (amber) — with a controlled
 * brush that zooms both series together.
 *
 * Series key + unit resolve through the PID catalog's `altUnit.metric`
 * companion, so toggling units in Settings flips the chart and brush
 * to `speed_kph` (km/h) without a re-import.
 *
 * Initial brush range covers the whole session. Local component state
 * keeps the brush in sync with the chart; no Redux state is involved
 * since the window is presentation-only.
 *
 * Empty data falls through to `LineChart`'s built-in empty placeholder.
 *
 * @returns A card containing the dual-axis chart and brush strip.
 */
function SpeedRpmChart({ data, syncId, testId }: SpeedRpmChartProps) {
  const units = useAppSelector((state) => selectUnits(state.preferences));
  const speed = resolvePidForUnits('speed_mph', units);
  const lastIndex = Math.max(0, data.length - 1);
  const [range, setRange] = useState<readonly [number, number]>([0, lastIndex]);

  const speedSeries: LineChartSeries = {
    axis:  'left',
    color: 'var(--mantine-color-cyan-4)',
    key:   speed.key,
    label: 'Speed',
    unit:  speed.unit
  };
  const rpmSeries: LineChartSeries = {
    axis:  'right',
    color: 'var(--mantine-color-amber-6)',
    key:   'rpm',
    label: 'Engine RPM',
    unit:  'rpm'
  };

  return (
    <Card
      subtitle="dual-axis · brush below to zoom"
      testId={ testId }
      title="Speed & RPM"
    >
      <Stack gap="xs">
        <LineChart
          data={ data }
          height={ 240 }
          series={ [speedSeries, rpmSeries] }
          syncId={ syncId }
          testId={ testId === undefined ? undefined : `${ testId }-chart` }
          xRange={ range }
        />
        { data.length > 1 && (
          <Brush
            data={ data }
            dataKey={ speed.key }
            onChange={ setRange }
            range={ range }
            testId={ testId === undefined ? undefined : `${ testId }-brush` }
          />
        ) }
      </Stack>
    </Card>
  );
}

export default SpeedRpmChart;
