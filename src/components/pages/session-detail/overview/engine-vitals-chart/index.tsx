import LineChart, { type LineChartSeries } from 'components/charts/line-chart';
import Card from 'components/primitives/card';
import { useAppSelector } from 'state/hooks';
import { selectUnits } from 'state/preferences';
import type { SessionDataRow } from 'types/session';
import { resolvePidForUnits } from 'utils';

interface EngineVitalsChartProps {
  readonly data: readonly SessionDataRow[];
  /** Cross-chart cursor sync id. Pair sibling Overview charts with the
   *  same value so the hover position stays in lockstep. */
  readonly syncId?: string;
  readonly testId?: string;
}

/**
 * Engine vitals chart — coolant, oil, and intake-air temps on the
 * same axis. Three series resolve their key + unit through the PID
 * catalog so every line swaps to °C when the units preference is
 * metric.
 *
 * Drops any series whose PID wasn't logged via Recharts'
 * undefined-value handling. If none of the three were logged, the
 * chart falls through to its empty placeholder.
 *
 * @returns A card containing the vitals chart.
 */
function EngineVitalsChart({ data, syncId, testId }: EngineVitalsChartProps) {
  const units = useAppSelector((state) => selectUnits(state.preferences));
  const coolant = resolvePidForUnits('coolant_f', units);
  const oil = resolvePidForUnits('oil_f', units);
  const iat = resolvePidForUnits('iat_f', units);
  const series: LineChartSeries[] = [
    { color: 'var(--mantine-color-red-5)',   key: coolant.key, label: 'Coolant',    unit: coolant.unit },
    { color: 'var(--mantine-color-amber-6)', key: oil.key,     label: 'Oil',        unit: oil.unit },
    { color: 'var(--mantine-color-cyan-4)',  key: iat.key,     label: 'Intake Air', unit: iat.unit }
  ];

  return (
    <Card subtitle={ `coolant · oil · IAT (${ coolant.unit })` } testId={ testId } title="Engine Vitals">
      <LineChart
        data={ data }
        height={ 180 }
        series={ series }
        syncId={ syncId }
        testId={ testId === undefined ? undefined : `${ testId }-chart` }
      />
    </Card>
  );
}

export default EngineVitalsChart;
