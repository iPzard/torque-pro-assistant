import LineChart, { type LineChartSeries } from 'components/charts/line-chart';
import Card from 'components/primitives/card';
import type { SessionDataRow } from 'types/session';

export interface AfrChartProps {
  readonly data: readonly SessionDataRow[];
  /** Cross-chart cursor sync id. Pair sibling Overview charts with the
   *  same value so the hover position stays in lockstep. */
  readonly syncId?: string;
  readonly testId?: string;
}

const AFR_CMD_SERIES: LineChartSeries = {
  color:  'var(--mantine-color-dimmed)',
  dashed: true,
  key:    'afr_cmd',
  label:  'AFR Commanded',
  unit:   ':1'
};

const AFR_MEAS_SERIES: LineChartSeries = {
  color: 'var(--mantine-color-amber-6)',
  key:   'afr_meas',
  label: 'AFR Measured',
  unit:  ':1'
};

/**
 * Air-fuel ratio chart — commanded (dashed dimmed) under measured
 * (solid amber). Together they show whether the ECU's mixture target
 * tracked reality; gaps between the lines are tuning red flags.
 *
 * Both series share the left axis. If neither AFR PID was logged the
 * chart falls through to the empty placeholder.
 *
 * @returns A card containing the AFR chart.
 */
function AfrChart({ data, syncId, testId }: AfrChartProps) {
  return (
    <Card subtitle="commanded vs measured" testId={ testId } title="AFR">
      <LineChart
        data={ data }
        height={ 180 }
        series={ [AFR_CMD_SERIES, AFR_MEAS_SERIES] }
        syncId={ syncId }
        testId={ testId === undefined ? undefined : `${ testId }-chart` }
      />
    </Card>
  );
}

export default AfrChart;
