import { Table, Text } from '@mantine/core';

import Card from 'components/primitives/card';
import type { SessionDataRow } from 'types/session';
import { formatDuration } from 'utils';

export interface PreviewTableProps {
  readonly rows: readonly SessionDataRow[];
  readonly testId?: string;
}

/** How many rows the preview shows. Enough for the user to eyeball
 *  whether the parse looks reasonable; the full table lives on the
 *  Session Detail Raw Data tab. */
const PREVIEW_ROW_COUNT = 10;

/** Format `value | undefined` as a fixed-decimal string or em-dash. */
const formatCell = (value: number | undefined, decimals: number): string =>
  value === undefined ? '—' : value.toFixed(decimals);

/**
 * Sample table for the Import preview stage — first `PREVIEW_ROW_COUNT`
 * rows from the parsed CSV, narrow column set so the eye can scan it
 * without horizontal scroll on a 720px window. Columns mirror the
 * Session Detail Raw Data tab so the layout reads familiar.
 *
 * @returns A card containing the preview table.
 */
function PreviewTable({ rows, testId }: PreviewTableProps) {
  const preview = rows.slice(0, PREVIEW_ROW_COUNT);

  return (
    <Card subtitle={ `first ${ preview.length } of ${ rows.length } rows` } testId={ testId } title="Preview">
      <Table.ScrollContainer minWidth={ 560 }>
        <Table
          data-testid={ testId === undefined ? undefined : `${ testId }-table` }
          highlightOnHover
          striped
          withColumnBorders
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Time</Table.Th>
              <Table.Th>Speed</Table.Th>
              <Table.Th>RPM</Table.Th>
              <Table.Th>Throttle</Table.Th>
              <Table.Th>Coolant</Table.Th>
              <Table.Th>Lat</Table.Th>
              <Table.Th>Lon</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            { preview.length === 0 && (
              <Table.Tr data-testid={ testId === undefined ? undefined : `${ testId }-empty` }>
                <Table.Td colSpan={ 7 }>
                  <Text c="dimmed" size="sm">No rows to preview.</Text>
                </Table.Td>
              </Table.Tr>
            ) }
            { preview.map((row, index) => (
              <Table.Tr
                key={ index }
                data-testid={ testId === undefined ? undefined : `${ testId }-row-${ index }` }
              >
                <Table.Td>{ formatDuration(row.t) }</Table.Td>
                <Table.Td>{ formatCell(row.speed_mph, 0) }</Table.Td>
                <Table.Td>{ formatCell(row.rpm, 0) }</Table.Td>
                <Table.Td>{ formatCell(row.throttle, 0) }</Table.Td>
                <Table.Td>{ formatCell(row.coolant_f, 0) }</Table.Td>
                <Table.Td>{ formatCell(row.lat, 4) }</Table.Td>
                <Table.Td>{ formatCell(row.lon, 4) }</Table.Td>
              </Table.Tr>
            )) }
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Card>
  );
}

export default PreviewTable;
