import LineChart, { type LineChartSeries } from 'components/charts/line-chart';
import Card from 'components/primitives/card';
import { useAppSelector } from 'state/hooks';
import { selectUnits } from 'state/preferences';
import type { SessionDataRow } from 'types/session';
import { resolvePidForUnits } from 'utils';

interface BoostChartProps {
  readonly data: readonly SessionDataRow[];
  /** Cross-chart cursor sync id. Pair sibling Overview charts with the
   *  same value so the hover position stays in lockstep. */
  readonly syncId?: string;
  readonly testId?: string;
}

/**
 * Boost pressure chart for the Session Overview tab. Renders a single
 * amber area on the left axis. Series key + unit resolve through the
 * PID catalog so the chart swaps to `boost_kpa` (kPa) when units mode
 * is metric. Negative values (vacuum) and positive values (boost)
 * both fit naturally since the chart's y-axis is auto-scaled.
 *
 * @returns A card containing the boost chart.
 */
function BoostChart({ data, syncId, testId }: BoostChartProps) {
  const units = useAppSelector((state) => selectUnits(state.preferences));
  const boost = resolvePidForUnits('boost_psi', units);
  const series: LineChartSeries = {
    color: 'var(--mantine-color-amber-6)',
    key:   boost.key,
    label: 'Boost',
    type:  'area',
    unit:  boost.unit
  };

  return (
    <Card subtitle={ boost.unit } testId={ testId } title="Boost">
      <LineChart
        data={ data }
        height={ 180 }
        series={ [series] }
        syncId={ syncId }
        testId={ testId === undefined ? undefined : `${ testId }-chart` }
      />
    </Card>
  );
}

export default BoostChart;
