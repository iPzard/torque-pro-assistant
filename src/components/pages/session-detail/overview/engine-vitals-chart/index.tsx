import LineChart, { type LineChartSeries } from 'components/charts/line-chart';
import Card from 'components/primitives/card';
import type { SessionDataRow } from 'types/session';

interface EngineVitalsChartProps {
  readonly data: readonly SessionDataRow[];
  /** Cross-chart cursor sync id. Pair sibling Overview charts with the
   *  same value so the hover position stays in lockstep. */
  readonly syncId?: string;
  readonly testId?: string;
}

const COOLANT_SERIES: LineChartSeries = {
  color: 'var(--mantine-color-red-5)',
  key:   'coolant_f',
  label: 'Coolant',
  unit:  '°F'
};

const OIL_SERIES: LineChartSeries = {
  color: 'var(--mantine-color-amber-6)',
  key:   'oil_f',
  label: 'Oil',
  unit:  '°F'
};

const IAT_SERIES: LineChartSeries = {
  color: 'var(--mantine-color-cyan-4)',
  key:   'iat_f',
  label: 'Intake Air',
  unit:  '°F'
};

/**
 * Engine vitals chart — coolant, oil, and intake-air temps on the
 * same axis (°F). Hot-day analysis at a glance: coolant climbing
 * vs. oil holding steady, IAT-soak after spirited driving, etc.
 *
 * Drops any series whose PID wasn't logged via Recharts'
 * undefined-value handling. If none of the three were logged, the
 * chart falls through to its empty placeholder.
 *
 * @returns A card containing the vitals chart.
 */
function EngineVitalsChart({ data, syncId, testId }: EngineVitalsChartProps) {
  return (
    <Card subtitle="coolant · oil · IAT" testId={ testId } title="Engine Vitals">
      <LineChart
        data={ data }
        height={ 180 }
        series={ [COOLANT_SERIES, OIL_SERIES, IAT_SERIES] }
        syncId={ syncId }
        testId={ testId === undefined ? undefined : `${ testId }-chart` }
      />
    </Card>
  );
}

export default EngineVitalsChart;
