import LineChart, { type LineChartSeries } from 'components/charts/line-chart';
import Card from 'components/primitives/card';
import type { SessionDataRow } from 'types/session';

interface BoostChartProps {
  readonly data: readonly SessionDataRow[];
  /** Cross-chart cursor sync id. Pair sibling Overview charts with the
   *  same value so the hover position stays in lockstep. */
  readonly syncId?: string;
  readonly testId?: string;
}

const BOOST_SERIES: LineChartSeries = {
  color: 'var(--mantine-color-amber-6)',
  key:   'boost_psi',
  label: 'Boost',
  type:  'area',
  unit:  'psi'
};

/**
 * Boost pressure chart for the Session Overview tab. Renders a single
 * amber area on the left axis (psi). Negative values (vacuum) and
 * positive values (boost) both fit naturally since the chart's y-axis
 * is auto-scaled.
 *
 * @returns A card containing the boost chart.
 */
function BoostChart({ data, syncId, testId }: BoostChartProps) {
  return (
    <Card subtitle="psi" testId={ testId } title="Boost">
      <LineChart
        data={ data }
        height={ 180 }
        series={ [BOOST_SERIES] }
        syncId={ syncId }
        testId={ testId === undefined ? undefined : `${ testId }-chart` }
      />
    </Card>
  );
}

export default BoostChart;
