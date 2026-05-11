import { SimpleGrid } from '@mantine/core';

import Metric from 'components/primitives/metric';
import type { SessionSummary } from 'types/session';

interface MetricGridProps {
  readonly summary: SessionSummary;
  readonly testId?: string;
}

/**
 * Renders the design's eight-cell "summary grid" at the top of the
 * Session Overview tab — Max Speed, Peak HP, Peak Torque, Max Boost
 * (those four highlighted as "peak" tiles in amber), Max Coolant,
 * Avg MPG, Distance, and 0-60 time.
 *
 * Values come pre-aggregated from `summarize(session)`; this component
 * is presentation-only. Missing 0-60 (driver never reached 60 mph in
 * the session) falls back to an em-dash placeholder.
 *
 * Layout is responsive — four cells per row on wide screens, two on
 * mid widths, single column under the breakpoint. Driven by Mantine's
 * `SimpleGrid` rather than CSS modules so the breakpoints stay aligned
 * with the surrounding Mantine theme.
 *
 * @returns The eight-cell metric grid React element.
 */
function MetricGrid({ summary, testId }: MetricGridProps) {
  const zeroToSixty = summary.t0to60 === null ? '—' : summary.t0to60.toFixed(1);
  return (
    <SimpleGrid
      cols={ { base: 1, md: 4, sm: 2 } }
      data-testid={ testId }
      spacing="md"
    >
      <Metric
        label="Max Speed"
        peak
        testId={ testId === undefined ? undefined : `${ testId }-max-speed` }
        unit="mph"
        value={ summary.maxSpeed.toFixed(0) }
      />
      <Metric
        label="Peak HP"
        peak
        testId={ testId === undefined ? undefined : `${ testId }-peak-hp` }
        unit="hp"
        value={ summary.peakHp.toFixed(0) }
      />
      <Metric
        label="Peak Torque"
        peak
        testId={ testId === undefined ? undefined : `${ testId }-peak-tq` }
        unit="lb·ft"
        value={ summary.peakTq.toFixed(0) }
      />
      <Metric
        label="Max Boost"
        peak
        testId={ testId === undefined ? undefined : `${ testId }-max-boost` }
        unit="psi"
        value={ summary.maxBoost.toFixed(1) }
      />
      <Metric
        label="Max Coolant"
        testId={ testId === undefined ? undefined : `${ testId }-max-cool` }
        unit="°F"
        value={ summary.maxCool.toFixed(0) }
      />
      <Metric
        label="Avg MPG"
        testId={ testId === undefined ? undefined : `${ testId }-avg-mpg` }
        unit="mpg"
        value={ summary.avgMpg.toFixed(1) }
      />
      <Metric
        label="Distance"
        testId={ testId === undefined ? undefined : `${ testId }-dist` }
        unit="mi"
        value={ summary.dist.toFixed(1) }
      />
      <Metric
        label="0-60"
        testId={ testId === undefined ? undefined : `${ testId }-zero-to-sixty` }
        unit="s"
        value={ zeroToSixty }
      />
    </SimpleGrid>
  );
}

export default MetricGrid;
