import LineChart, { type LineChartSeries } from 'components/charts/line-chart';
import Card from 'components/primitives/card';
import { useAppSelector } from 'state/hooks';
import { selectUnits } from 'state/preferences';
import type { SessionDataRow } from 'types/session';
import { resolvePidForUnits } from 'utils';

interface PowerTorqueChartProps {
  readonly data: readonly SessionDataRow[];
  /** Cross-chart cursor sync id. Pair sibling Overview charts with the
   *  same value so the hover position stays in lockstep. */
  readonly syncId?: string;
  readonly testId?: string;
}

/**
 * Wheel horsepower + torque chart for the Session Overview tab.
 * Amber HP on the left axis, cyan torque on the right — common pairing
 * since HP and torque crossover happens at the dyno-classic 5,252 rpm
 * point. Torque resolves through the PID catalog so it switches to
 * Nm under metric. HP stays in hp (no kW companion mapped in the
 * adapter for now).
 *
 * @returns A card containing the power / torque chart.
 */
function PowerTorqueChart({ data, syncId, testId }: PowerTorqueChartProps) {
  const units = useAppSelector((state) => selectUnits(state.preferences));
  const torque = resolvePidForUnits('tq_lbft', units);
  const hpSeries: LineChartSeries = {
    axis:  'left',
    color: 'var(--mantine-color-amber-6)',
    key:   'hp',
    label: 'Horsepower',
    unit:  'hp'
  };
  const torqueSeries: LineChartSeries = {
    axis:  'right',
    color: 'var(--mantine-color-cyan-4)',
    key:   torque.key,
    label: 'Torque',
    unit:  torque.unit
  };

  return (
    <Card
      subtitle={ `dual-axis · hp & ${ torque.unit }` }
      testId={ testId }
      title="Power & Torque"
    >
      <LineChart
        data={ data }
        height={ 180 }
        series={ [hpSeries, torqueSeries] }
        syncId={ syncId }
        testId={ testId === undefined ? undefined : `${ testId }-chart` }
      />
    </Card>
  );
}

export default PowerTorqueChart;
