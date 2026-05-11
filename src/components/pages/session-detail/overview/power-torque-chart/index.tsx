import LineChart, { type LineChartSeries } from 'components/charts/line-chart';
import Card from 'components/primitives/card';
import type { SessionDataRow } from 'types/session';

interface PowerTorqueChartProps {
  readonly data: readonly SessionDataRow[];
  /** Cross-chart cursor sync id. Pair sibling Overview charts with the
   *  same value so the hover position stays in lockstep. */
  readonly syncId?: string;
  readonly testId?: string;
}

const HP_SERIES: LineChartSeries = {
  axis:  'left',
  color: 'var(--mantine-color-amber-6)',
  key:   'hp',
  label: 'Horsepower',
  unit:  'hp'
};

const TQ_SERIES: LineChartSeries = {
  axis:  'right',
  color: 'var(--mantine-color-cyan-4)',
  key:   'tq_lbft',
  label: 'Torque',
  unit:  'lb·ft'
};

/**
 * Wheel horsepower + torque chart for the Session Overview tab.
 * Amber HP on the left axis, cyan torque on the right — common pairing
 * since HP and torque crossover happens at the dyno-classic 5,252 rpm
 * point. Both derived from `summarize` upstream when the CSV doesn't
 * include them directly.
 *
 * @returns A card containing the power / torque chart.
 */
function PowerTorqueChart({ data, syncId, testId }: PowerTorqueChartProps) {
  return (
    <Card subtitle="dual-axis · hp & lb·ft" testId={ testId } title="Power & Torque">
      <LineChart
        data={ data }
        height={ 180 }
        series={ [HP_SERIES, TQ_SERIES] }
        syncId={ syncId }
        testId={ testId === undefined ? undefined : `${ testId }-chart` }
      />
    </Card>
  );
}

export default PowerTorqueChart;
