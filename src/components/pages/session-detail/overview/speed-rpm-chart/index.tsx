import { Stack } from '@mantine/core';
import { useState } from 'react';

import Brush from 'components/charts/brush';
import LineChart, { type LineChartSeries } from 'components/charts/line-chart';
import Card from 'components/primitives/card';
import type { SessionDataRow } from 'types/session';

interface SpeedRpmChartProps {
  readonly data: readonly SessionDataRow[];
  /** Cross-chart cursor sync id. Pass the same value to sibling charts
   *  on the Overview tab so the hover cursor stays in lockstep. */
  readonly syncId?: string;
  readonly testId?: string;
}

const SPEED_SERIES: LineChartSeries = {
  axis:  'left',
  color: 'var(--mantine-color-cyan-4)',
  key:   'speed_mph',
  label: 'Speed',
  unit:  'mph'
};

const RPM_SERIES: LineChartSeries = {
  axis:  'right',
  color: 'var(--mantine-color-amber-6)',
  key:   'rpm',
  label: 'Engine RPM',
  unit:  'rpm'
};

/**
 * Speed + Engine RPM dual-axis chart with a brush strip below for
 * windowing. Pairs the design's Overview centerpiece — speed read off
 * the left axis (cyan), RPM off the right (amber) — with a controlled
 * brush that zooms both series together.
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
  const lastIndex = Math.max(0, data.length - 1);
  const [range, setRange] = useState<readonly [number, number]>([0, lastIndex]);

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
          series={ [SPEED_SERIES, RPM_SERIES] }
          syncId={ syncId }
          testId={ testId === undefined ? undefined : `${ testId }-chart` }
          xRange={ range }
        />
        { data.length > 1 && (
          <Brush
            data={ data }
            dataKey="speed_mph"
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
