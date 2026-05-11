import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

/**
 * Permissive datum shape — accepts any record-like object where each
 * series' `key` resolves to a number or undefined. `SessionDataRow`
 * (with its index signature) satisfies this directly.
 */
export type LineChartDatum = Readonly<Record<string, number | undefined>>;

/**
 * One series declaration. The design's chart can mix line and area
 * series, route some to the right y-axis (e.g. RPM next to Speed),
 * and dash a series (e.g. AFR commanded behind AFR measured).
 */
export interface LineChartSeries {
  /** Which y-axis this series binds to. Defaults to `'left'`. */
  readonly axis?: 'left' | 'right';
  readonly color: string;
  /** Render dashed instead of solid. */
  readonly dashed?: boolean;
  /** `LineChartDatum` field name to plot. */
  readonly key: string;
  /** Display label shown in the tooltip and legend. */
  readonly label: string;
  /** Stroke / fill opacity. Defaults to 1 (line) / 0.18 (area). */
  readonly opacity?: number;
  /** Render as area fill instead of a thin line. */
  readonly type?: 'area' | 'line';
  /** Display unit in the tooltip. */
  readonly unit?: string;
  /** Stroke width in pixels. Defaults to 1.5. */
  readonly width?: number;
}

interface LineChartProps {
  readonly data: readonly LineChartDatum[];
  /** Chart height in pixels. Width fills the parent via `ResponsiveContainer`. */
  readonly height?: number;
  /** Hide axis ticks + labels. Defaults to false. */
  readonly noAxes?: boolean;
  /** Hide the legend strip below the chart. Defaults to false. */
  readonly noLegend?: boolean;
  readonly series: readonly LineChartSeries[];
  /**
   * Cross-chart cursor sync identifier. Multiple charts on the same
   * page sharing this id will move their hover cursor together —
   * matches the design's shared-cursor behavior in the Session detail
   * Overview tab and the Compare overlay.
   */
  readonly syncId?: string;
  readonly testId?: string;
  /** Visible window over `data` as [fromIndex, toIndex] inclusive.
   *  When omitted, the chart shows all data. Used by the Brush
   *  component to drive a zoomed view. */
  readonly xRange?: readonly [number, number];
  /** Fixed y-axis range for the left axis. Defaults to auto-scaled. */
  readonly yLeftRange?: readonly [number, number];
  /** Fixed y-axis range for the right axis. Defaults to auto-scaled. */
  readonly yRightRange?: readonly [number, number];
}

/**
 * Format the x-axis tick — `t` is elapsed seconds, displayed as
 * `MM:SS` for axes longer than a minute, `0:SS.f` for short sessions.
 */
const formatElapsedSeconds = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

/**
 * Multi-series chart used across the Session detail Overview, Charts
 * filmstrip, and Compare overlay screens. Wraps Recharts'
 * `<ComposedChart>` so individual series can be a mix of lines and
 * filled areas, optionally bound to a right-side y-axis.
 *
 * Shared cursor: pass the same `syncId` to multiple charts on the
 * page; Recharts will keep their hover position in lockstep without
 * any extra wiring.
 *
 * Brushing: pass `xRange` as `[from, to]` data-index pair to show a
 * zoomed window. The companion `Brush` component (CLAUDE.md TODO §B.8)
 * owns the selection UI.
 *
 * @returns A responsive multi-series chart filling the parent width
 *   at the requested height.
 */
function LineChart({
  data,
  height = 220,
  noAxes = false,
  noLegend = false,
  series,
  syncId,
  testId,
  xRange,
  yLeftRange,
  yRightRange
}: LineChartProps) {
  if (data.length === 0 || series.length === 0) {
    return (
      <span
        data-testid={ testId }
        style={ { display: 'block', height, width: '100%' } }
      />
    );
  }

  const visibleData = xRange === undefined
    ? data
    : data.slice(Math.max(0, xRange[0]), Math.min(data.length, xRange[1] + 1));
  const hasRightAxis = series.some((entry) => entry.axis === 'right');

  return (
    <span
      data-testid={ testId }
      style={ { display: 'block', height, width: '100%' } }
    >
      <ResponsiveContainer height="100%" width="100%">
        <ComposedChart
          data={ visibleData as LineChartDatum[] }
          margin={ { bottom: 4, left: 4, right: 4, top: 8 } }
          syncId={ syncId }
        >
          { !noAxes && (
            <CartesianGrid stroke="var(--mantine-color-default-border)" strokeDasharray="2 3" />
          ) }
          <XAxis
            dataKey="t"
            domain={ ['dataMin', 'dataMax'] }
            hide={ noAxes }
            stroke="var(--mantine-color-dimmed)"
            tickFormatter={ formatElapsedSeconds }
            tickLine={ false }
            type="number"
          />
          <YAxis
            domain={ yLeftRange ?? ['auto', 'auto'] }
            hide={ noAxes }
            stroke="var(--mantine-color-dimmed)"
            tickLine={ false }
            yAxisId="left"
          />
          { hasRightAxis && (
            <YAxis
              domain={ yRightRange ?? ['auto', 'auto'] }
              hide={ noAxes }
              orientation="right"
              stroke="var(--mantine-color-dimmed)"
              tickLine={ false }
              yAxisId="right"
            />
          ) }
          <Tooltip
            contentStyle={ {
              background: 'var(--mantine-color-default)',
              border: '1px solid var(--mantine-color-default-border)',
              borderRadius: 6,
              fontFamily: 'var(--mantine-font-family-monospace)',
              fontSize: 11
            } }
            cursor={ { stroke: 'var(--mantine-color-dimmed)', strokeDasharray: '3 3' } }
            labelFormatter={ (label) => typeof label === 'number' ? formatElapsedSeconds(label) : String(label) }
          />
          { !noLegend && (
            <Legend
              iconSize={ 8 }
              wrapperStyle={ {
                fontFamily: 'var(--mantine-font-family-monospace)',
                fontSize: 11,
                paddingTop: 6
              } }
            />
          ) }
          { series.map((entry) => {
            const axis = entry.axis ?? 'left';
            const strokeOpacity = entry.opacity ?? 1;
            if (entry.type === 'area') {
              return (
                <Area
                  key={ entry.key }
                  dataKey={ entry.key }
                  dot={ false }
                  fill={ entry.color }
                  fillOpacity={ entry.opacity ?? 0.18 }
                  isAnimationActive={ false }
                  name={ entry.label }
                  stroke={ entry.color }
                  strokeDasharray={ entry.dashed === true ? '4 3' : undefined }
                  strokeOpacity={ strokeOpacity }
                  strokeWidth={ entry.width ?? 1.5 }
                  type="monotone"
                  unit={ entry.unit }
                  yAxisId={ axis }
                />
              );
            }
            return (
              <Line
                key={ entry.key }
                dataKey={ entry.key }
                dot={ false }
                isAnimationActive={ false }
                name={ entry.label }
                stroke={ entry.color }
                strokeDasharray={ entry.dashed === true ? '4 3' : undefined }
                strokeOpacity={ strokeOpacity }
                strokeWidth={ entry.width ?? 1.5 }
                type="monotone"
                unit={ entry.unit }
                yAxisId={ axis }
              />
            );
          }) }
        </ComposedChart>
      </ResponsiveContainer>
    </span>
  );
}

export default LineChart;
