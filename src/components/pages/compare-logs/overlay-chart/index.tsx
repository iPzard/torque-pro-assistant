import LineChart, { type LineChartSeries } from 'components/charts/line-chart';
import type { OverlayRow, OverlaySeries } from 'components/pages/compare-logs/utils';
import Card from 'components/primitives/card';
import { PID_BY_KEY } from 'data/pids';

interface OverlayChartProps {
  readonly data: readonly OverlayRow[];
  /** Series filtered to a single PID — one per session contributing. */
  readonly series: readonly OverlaySeries[];
  /** Sync id shared with sibling overlay charts so the hover cursor
   *  moves across the stack. */
  readonly syncId?: string;
  readonly testId?: string;
}

/**
 * One overlay chart for the Compare page — renders every overlaid
 * session's values for a single PID against the merged time axis.
 * Looks up the PID's label / unit from the catalog so the card title
 * and tooltip stay in sync with the rest of the app.
 *
 * Per-series `connectNulls=true` is essential here: each row in the
 * merged dataset carries only one session's value at any given `t`,
 * so without `connectNulls` every series would render as scattered
 * dots instead of a continuous line.
 *
 * @returns A card containing the overlay chart.
 */
function OverlayChart({ data, series, syncId, testId }: OverlayChartProps) {
  const firstSeries = series[0];
  const pid = firstSeries === undefined ? undefined : PID_BY_KEY[firstSeries.pid];
  const title = pid?.label ?? firstSeries?.pid ?? 'Overlay';
  const subtitle = pid?.unit ?? '';

  const chartSeries: LineChartSeries[] = series.map((entry) => ({
    color:        entry.color,
    connectNulls: true,
    key:          entry.key,
    label:        entry.label,
    unit:         pid?.unit
  }));

  return (
    <Card subtitle={ subtitle } testId={ testId } title={ title }>
      <LineChart
        data={ data }
        height={ 180 }
        series={ chartSeries }
        syncId={ syncId }
        testId={ testId === undefined ? undefined : `${ testId }-chart` }
      />
    </Card>
  );
}

export default OverlayChart;
