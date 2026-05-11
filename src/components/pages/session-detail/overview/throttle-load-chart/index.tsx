import LineChart, { type LineChartSeries } from 'components/charts/line-chart';
import Card from 'components/primitives/card';
import type { SessionDataRow } from 'types/session';

export interface ThrottleLoadChartProps {
  readonly data: readonly SessionDataRow[];
  /** Cross-chart cursor sync id. Pair sibling Overview charts with the
   *  same value so the hover position stays in lockstep. */
  readonly syncId?: string;
  readonly testId?: string;
}

const THROTTLE_SERIES: LineChartSeries = {
  color: 'var(--mantine-color-amber-6)',
  key:   'throttle',
  label: 'Throttle',
  type:  'area',
  unit:  '%'
};

const LOAD_SERIES: LineChartSeries = {
  color: 'var(--mantine-color-cyan-4)',
  key:   'load',
  label: 'Engine Load',
  unit:  '%'
};

/**
 * Throttle + Engine Load chart for the Session Overview tab. Both
 * series ride the same y-axis (0–100%) since they're both percentage
 * readings. Throttle renders as an amber area (the headline driver
 * input) with Engine Load as a cyan line on top.
 *
 * @returns A card containing the throttle / load chart.
 */
function ThrottleLoadChart({ data, syncId, testId }: ThrottleLoadChartProps) {
  return (
    <Card subtitle="0–100%" testId={ testId } title="Throttle & Load">
      <LineChart
        data={ data }
        height={ 180 }
        series={ [THROTTLE_SERIES, LOAD_SERIES] }
        syncId={ syncId }
        testId={ testId === undefined ? undefined : `${ testId }-chart` }
      />
    </Card>
  );
}

export default ThrottleLoadChart;
