import { SimpleGrid } from '@mantine/core';

import Metric from 'components/primitives/metric';
import { useAppSelector } from 'state/hooks';
import { selectUnits } from 'state/preferences';
import type { SessionSummary } from 'types/session';
import { convertBoost, convertDistance, convertSpeed, convertTemperature } from 'utils';

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
 * the session) falls back to an em-dash placeholder. Speed / boost /
 * coolant / distance swap to metric units when the preferences slice
 * is set to `metric`.
 *
 * Layout is responsive — four cells per row on wide screens, two on
 * mid widths, single column under the breakpoint. Driven by Mantine's
 * `SimpleGrid` rather than CSS modules so the breakpoints stay aligned
 * with the surrounding Mantine theme.
 *
 * @returns The eight-cell metric grid React element.
 */
function MetricGrid({ summary, testId }: MetricGridProps) {
  const units = useAppSelector((state) => selectUnits(state.preferences));
  const speed = convertSpeed(summary.maxSpeed, units);
  const boost = convertBoost(summary.maxBoost, units);
  const coolant = convertTemperature(summary.maxCool, units);
  const distance = convertDistance(summary.dist, units);
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
        unit={ speed.unit }
        value={ speed.value.toFixed(0) }
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
        unit={ boost.unit }
        value={ boost.value.toFixed(1) }
      />
      <Metric
        label="Max Coolant"
        testId={ testId === undefined ? undefined : `${ testId }-max-cool` }
        unit={ coolant.unit }
        value={ coolant.value.toFixed(0) }
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
        unit={ distance.unit }
        value={ distance.value.toFixed(1) }
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
