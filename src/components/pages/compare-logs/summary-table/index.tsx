import { Table, Text } from '@mantine/core';

import Card from 'components/primitives/card';
import { useAppSelector } from 'state/hooks';
import { selectUnits, type UnitsPreference } from 'state/preferences';
import type { Session, SessionSummary } from 'types/session';
import {
  formatBoost,
  formatDistance,
  formatDuration,
  formatSpeed,
  formatTemperature,
  summarize
} from 'utils';

export interface SummaryTableProps {
  readonly sessions: readonly Session[];
  readonly testId?: string;
}

/** Row spec — one stat per row. Each row's `format` returns the
 *  pre-formatted display string for an absolute value; the renderer
 *  builds the Δ string by routing the delta value back through the
 *  same formatter and prepending the sign. */
interface RowSpec {
  readonly format: (value: number, units: UnitsPreference) => string;
  readonly label: string;
  /** Pluck the value out of a summary. Returns `null` for missing
   *  data (e.g. session never reached 60 mph). */
  readonly value: (summary: SessionSummary) => number | null;
}

const ROWS: readonly RowSpec[] = [
  { format: formatDistance,                                   label: 'Distance',    value: (summary) => summary.dist     },
  { format: (value) => formatDuration(value),                 label: 'Duration',    value: (summary) => summary.duration },
  { format: formatSpeed,                                      label: 'Max Speed',   value: (summary) => summary.maxSpeed },
  { format: (value) => `${ value.toFixed(0) } hp`,            label: 'Peak HP',     value: (summary) => summary.peakHp   },
  { format: (value) => `${ value.toFixed(0) } lb·ft`,         label: 'Peak Torque', value: (summary) => summary.peakTq   },
  { format: formatBoost,                                      label: 'Max Boost',   value: (summary) => summary.maxBoost },
  { format: formatTemperature,                                label: 'Max Coolant', value: (summary) => summary.maxCool  },
  { format: (value) => `${ value.toFixed(1) } mpg`,           label: 'Avg MPG',     value: (summary) => summary.avgMpg   },
  { format: (value) => `${ value.toFixed(1) } s`,             label: '0-30',        value: (summary) => summary.t0to30   },
  { format: (value) => `${ value.toFixed(1) } s`,             label: '0-60',        value: (summary) => summary.t0to60   }
];

/** Build the Δ cell text. Routes the absolute-value delta through the
 *  row's formatter and tacks the sign on. Duration deltas show as
 *  `+M:SS` / `-M:SS` for consistency with the rest of the column. */
const formatDelta = (spec: RowSpec, deltaValue: number | null, units: UnitsPreference): string => {
  if (deltaValue === null) return '—';
  const absoluteText = spec.format(Math.abs(deltaValue), units);
  const sign = deltaValue >= 0 ? '+' : '-';
  return `${ sign }${ absoluteText }`;
};

/**
 * Side-by-side summary table for the Compare page. Renders one column
 * per session, with rows pulled from each session's `SessionSummary`.
 * When exactly two sessions are overlaid, a final Δ column shows the
 * difference (second minus first) with a leading sign. Unit-aware
 * rows (Distance, Max Speed, Max Boost, Max Coolant) swap formatters
 * to match the user's `units` preference.
 *
 * Empty session list renders a hint nudging the user toward the
 * selector above the table.
 *
 * @returns A card containing the summary table.
 */
function SummaryTable({ sessions, testId }: SummaryTableProps) {
  const units = useAppSelector((state) => selectUnits(state.preferences));

  if (sessions.length === 0) {
    return (
      <Card subtitle="summary stats per session" testId={ testId } title="Comparison">
        <Text c="dimmed" data-testid={ testId === undefined ? undefined : `${ testId }-empty` } size="sm">
          Pick at least one session to see its summary alongside others.
        </Text>
      </Card>
    );
  }

  const summaries = sessions.map((session) => summarize(session));
  const showDelta = sessions.length === 2;

  return (
    <Card subtitle="summary stats per session" testId={ testId } title="Comparison">
      <Table.ScrollContainer minWidth={ 480 }>
        <Table
          data-testid={ testId === undefined ? undefined : `${ testId }-table` }
          highlightOnHover
          striped
          withColumnBorders
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Stat</Table.Th>
              { sessions.map((session) => (
                <Table.Th
                  key={ session.meta.id }
                  data-testid={ testId === undefined ? undefined : `${ testId }-header-${ session.meta.id }` }
                >
                  { session.meta.name }
                </Table.Th>
              )) }
              { showDelta && <Table.Th>Δ</Table.Th> }
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            { ROWS.map((spec) => {
              const values = summaries.map((summary) => spec.value(summary));
              const delta = showDelta && values[0] !== null && values[1] !== null
                ? values[1] - values[0]
                : null;
              return (
                <Table.Tr
                  key={ spec.label }
                  data-testid={ testId === undefined ? undefined : `${ testId }-row-${ spec.label.toLowerCase().replace(/\s+/g, '-') }` }
                >
                  <Table.Td>{ spec.label }</Table.Td>
                  { values.map((value, columnIndex) => (
                    <Table.Td key={ sessions[columnIndex].meta.id }>
                      { value === null ? '—' : spec.format(value, units) }
                    </Table.Td>
                  )) }
                  { showDelta && <Table.Td>{ formatDelta(spec, delta, units) }</Table.Td> }
                </Table.Tr>
              );
            }) }
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Card>
  );
}

export default SummaryTable;
