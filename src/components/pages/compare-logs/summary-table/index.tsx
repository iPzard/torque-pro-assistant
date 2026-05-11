import { Table, Text } from '@mantine/core';

import Card from 'components/primitives/card';
import type { Session, SessionSummary } from 'types/session';
import { formatDuration, summarize } from 'utils';

interface SummaryTableProps {
  readonly sessions: readonly Session[];
  readonly testId?: string;
}

/** Row spec — one stat per row. Each row pulls a value out of a session's
 *  `SessionSummary` (or directly off `meta.duration` for the duration row)
 *  and formats it with the row's unit + precision. */
interface RowSpec {
  /** Display label in the leftmost column. */
  readonly label: string;
  /** Precision passed to `Number.prototype.toFixed`. */
  readonly precision: number;
  /** Unit appended after the value (with a leading space) — empty string
   *  for the duration row, which formats independently. */
  readonly unit: string;
  /** Pluck the value out of a summary. Returns `null` for missing data
   *  (e.g. session never reached 60 mph). */
  readonly value: (summary: SessionSummary) => number | null;
}

const ROWS: readonly RowSpec[] = [
  { label: 'Distance',    precision: 1, unit: 'mi',    value: (summary) => summary.dist },
  { label: 'Duration',    precision: 0, unit: '',      value: (summary) => summary.duration },
  { label: 'Max Speed',   precision: 0, unit: 'mph',   value: (summary) => summary.maxSpeed },
  { label: 'Peak HP',     precision: 0, unit: 'hp',    value: (summary) => summary.peakHp },
  { label: 'Peak Torque', precision: 0, unit: 'lb·ft', value: (summary) => summary.peakTq },
  { label: 'Max Boost',   precision: 1, unit: 'psi',   value: (summary) => summary.maxBoost },
  { label: 'Max Coolant', precision: 0, unit: '°F',    value: (summary) => summary.maxCool },
  { label: 'Avg MPG',     precision: 1, unit: 'mpg',   value: (summary) => summary.avgMpg },
  { label: '0-30',        precision: 1, unit: 's',     value: (summary) => summary.t0to30 },
  { label: '0-60',        precision: 1, unit: 's',     value: (summary) => summary.t0to60 }
];

/** Format one cell from a row spec + raw value. Pulls the duration row
 *  through `formatDuration` so the column reads `M:SS` instead of raw
 *  seconds; everything else gets `toFixed` + the unit. */
const formatCell = (spec: RowSpec, value: number | null): string => {
  if (value === null) return '—';
  if (spec.label === 'Duration') return formatDuration(value);
  return `${ value.toFixed(spec.precision) } ${ spec.unit }`.trim();
};

/** Build a delta string for the Δ column. Same precision + unit as the
 *  row; preserves the sign so a slower session reads as `-3.4 mph`. */
const formatDelta = (spec: RowSpec, deltaValue: number | null): string => {
  if (deltaValue === null) return '—';
  if (spec.label === 'Duration') {
    const sign = deltaValue >= 0 ? '+' : '-';
    return `${ sign }${ formatDuration(Math.abs(deltaValue)) }`;
  }
  const formatted = deltaValue.toFixed(spec.precision);
  const sign = deltaValue >= 0 ? '+' : '';
  return `${ sign }${ formatted } ${ spec.unit }`.trim();
};

/**
 * Side-by-side summary table for the Compare page. Renders one column
 * per session, with the rows pulled from each session's `SessionSummary`.
 * When exactly two sessions are overlaid, a final Δ column shows the
 * difference (second minus first) with a leading sign.
 *
 * Empty session list renders a hint nudging the user toward the
 * selector above the table.
 *
 * @returns A card containing the summary table.
 */
function SummaryTable({ sessions, testId }: SummaryTableProps) {
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
                      { formatCell(spec, value) }
                    </Table.Td>
                  )) }
                  { showDelta && (
                    <Table.Td>{ formatDelta(spec, delta) }</Table.Td>
                  ) }
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
