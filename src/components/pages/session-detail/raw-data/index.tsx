import { Group, Pagination, Stack, Table, Text } from '@mantine/core';
import { useState } from 'react';

import Card from 'components/primitives/card';
import type { SessionDataRow } from 'types/session';
import { formatDuration } from 'utils';

export interface RawDataProps {
  readonly data: readonly SessionDataRow[];
  readonly testId?: string;
}

/** Rows per page. Smaller pages keep scroll containers from blowing
 *  past a single viewport; larger sessions still skim quickly via
 *  the Mantine Pagination. */
const PAGE_SIZE = 50;

/** Format a possibly-undefined number to a fixed-precision string,
 *  falling back to an em-dash. Inline ternaries multiplied per cell
 *  read worse than this; module-scope (not inside the component) so
 *  the no-utils-in-components rule isn't tripped. */
const formatCell = (value: number | undefined, precision: number): string =>
  value === undefined ? '—' : value.toFixed(precision);

/**
 * Renders the Session Detail page's Raw Data tab — a paginated table
 * of every row in the session. Columns cover the most-commonly-logged
 * Torque Pro PIDs (time, speed, RPM, throttle, load, boost, coolant,
 * HP, lat, lon); missing PIDs render as em-dash placeholders.
 *
 * Default page size is `PAGE_SIZE` rows. Pagination control sits below
 * the table and stays out of view when the session fits on one page.
 *
 * Cross-tab cursor sync (TODO §22) is deferred — the Recharts `syncId`
 * inside Overview already handles shared-cursor within a single tab,
 * and hovering rows here has nothing chart-shaped to drive until the
 * Charts tab gets a "show alongside raw data" split-view.
 *
 * @returns A card containing the paginated raw-data table.
 */
function RawData({ data, testId }: RawDataProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const sliceStart = (safePage - 1) * PAGE_SIZE;
  const visibleRows = data.slice(sliceStart, sliceStart + PAGE_SIZE);

  return (
    <Card
      subtitle={ `${ data.length.toLocaleString() } rows · ${ totalPages } page${ totalPages === 1 ? '' : 's' }` }
      testId={ testId }
      title="Raw Data"
    >
      <Stack gap="sm">
        <Table.ScrollContainer minWidth={ 720 }>
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
                <Table.Th>Load</Table.Th>
                <Table.Th>Boost</Table.Th>
                <Table.Th>Coolant</Table.Th>
                <Table.Th>HP</Table.Th>
                <Table.Th>Lat</Table.Th>
                <Table.Th>Lon</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              { visibleRows.length === 0 && (
                <Table.Tr data-testid={ testId === undefined ? undefined : `${ testId }-empty` }>
                  <Table.Td colSpan={ 10 }>
                    <Text c="dimmed" size="sm">No rows in this session.</Text>
                  </Table.Td>
                </Table.Tr>
              ) }
              { visibleRows.map((row, index) => {
                const globalIndex = sliceStart + index;
                return (
                  <Table.Tr
                    key={ globalIndex }
                    data-testid={ testId === undefined ? undefined : `${ testId }-row-${ globalIndex }` }
                  >
                    <Table.Td>{ formatDuration(row.t) }</Table.Td>
                    <Table.Td>{ formatCell(row.speed_mph, 0) }</Table.Td>
                    <Table.Td>{ formatCell(row.rpm, 0) }</Table.Td>
                    <Table.Td>{ formatCell(row.throttle, 0) }</Table.Td>
                    <Table.Td>{ formatCell(row.load, 0) }</Table.Td>
                    <Table.Td>{ formatCell(row.boost_psi, 1) }</Table.Td>
                    <Table.Td>{ formatCell(row.coolant_f, 0) }</Table.Td>
                    <Table.Td>{ formatCell(row.hp, 0) }</Table.Td>
                    <Table.Td>{ formatCell(row.lat, 4) }</Table.Td>
                    <Table.Td>{ formatCell(row.lon, 4) }</Table.Td>
                  </Table.Tr>
                );
              }) }
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        { totalPages > 1 && (
          <Group justify="flex-end">
            <Pagination
              data-testid={ testId === undefined ? undefined : `${ testId }-pagination` }
              onChange={ setPage }
              size="sm"
              total={ totalPages }
              value={ safePage }
            />
          </Group>
        ) }
      </Stack>
    </Card>
  );
}

export default RawData;
