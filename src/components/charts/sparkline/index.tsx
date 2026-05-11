import { Area, AreaChart, Line, LineChart } from 'recharts';

/**
 * Permissive datum shape — accepts any record-like object where the
 * `dataKey` resolves to a number or undefined. `SessionDataRow` (which
 * carries an index signature) satisfies this, as do ad-hoc objects in
 * tests / storybook.
 */
export type SparklineDatum = Readonly<Record<string, number | undefined>>;

export interface SparklineProps {
  /** Line / fill color. Defaults to the brand amber via CSS variable. */
  readonly color?: string;
  readonly data: readonly SparklineDatum[];
  /** Field name to plot on the y-axis. */
  readonly dataKey: string;
  /** Render as a filled area chart instead of a thin line. */
  readonly filled?: boolean;
  /** Fixed height in pixels. Defaults to the design's 28px row sparkline. */
  readonly height?: number;
  readonly testId?: string;
  /** Fixed width in pixels. Defaults to the design's 110px row sparkline. */
  readonly width?: number;
}

/**
 * Compact single-series chart for embedding in tables, cards, and
 * tooltips. Hides axes, grid, tooltip, and legend — just the line (or
 * a filled area when `filled` is set).
 *
 * Implementation note: uses Recharts at fixed pixel dimensions so the
 * Library table can place one sparkline per row without invoking a
 * `ResponsiveContainer` resize-observer per row. If the Library screen
 * ever sees a perf cliff from rendering 50+ Recharts instances at
 * once, swap the internals here for a hand-drawn `<svg>` path (the
 * design's original approach in `ui.jsx`) — the public props stay
 * the same.
 *
 * @returns A small chart sized to `width` x `height` pixels.
 */
function Sparkline({
  color = 'var(--mantine-color-amber-6)',
  data,
  dataKey,
  filled = false,
  height = 28,
  testId,
  width = 110
}: SparklineProps) {
  if (data.length === 0) {
    return <span data-testid={ testId } style={ { display: 'inline-block', height, width } } />;
  }

  const margin = { bottom: 2, left: 0, right: 0, top: 2 };

  if (filled) {
    return (
      <span data-testid={ testId } style={ { display: 'inline-block', height, width } }>
        <AreaChart data={ data as SparklineDatum[] } height={ height } margin={ margin } width={ width }>
          <Area
            dataKey={ dataKey }
            dot={ false }
            fill={ color }
            fillOpacity={ 0.18 }
            isAnimationActive={ false }
            stroke={ color }
            strokeWidth={ 1.5 }
            type="monotone"
          />
        </AreaChart>
      </span>
    );
  }

  return (
    <span data-testid={ testId } style={ { display: 'inline-block', height, width } }>
      <LineChart data={ data as SparklineDatum[] } height={ height } margin={ margin } width={ width }>
        <Line
          dataKey={ dataKey }
          dot={ false }
          isAnimationActive={ false }
          stroke={ color }
          strokeWidth={ 1.5 }
          type="monotone"
        />
      </LineChart>
    </span>
  );
}

export default Sparkline;
