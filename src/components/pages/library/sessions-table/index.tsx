import { Table, Text, UnstyledButton } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

import type {
  LibrarySort,
  LibrarySortKey,
  LibrarySortOrder
} from 'components/pages/library/utils';
import type { SessionMeta } from 'types/session';
import { formatDuration } from 'utils';

interface SessionsTableProps {
  readonly onSortChange: (next: LibrarySort) => void;
  readonly sessions: readonly SessionMeta[];
  readonly sort: LibrarySort;
  readonly testId?: string;
}

/** Column spec — display label + sort key. The header bar maps over
 *  this so adding a sortable column is a one-edit change. */
interface ColumnSpec {
  readonly key: LibrarySortKey;
  readonly label: string;
}

const COLUMNS: readonly ColumnSpec[] = [
  { key: 'name',      label: 'Name' },
  { key: 'startedAt', label: 'Started' },
  { key: 'duration',  label: 'Duration' },
  { key: 'fileSize',  label: 'Size' }
];

/** Direction arrow for the active sort column. Inactive columns
 *  render no arrow so the header strip stays clean. */
const arrowFor = (
  active: boolean,
  order: LibrarySortOrder
): string => {
  if (!active) return '';
  return order === 'asc' ? ' ↑' : ' ↓';
};

/**
 * Sortable sessions table — one row per `SessionMeta`. Column headers
 * are click-to-sort: click an inactive column to make it the sort
 * column (defaults to ascending); click the active column to flip
 * direction. Row click routes to the matching session detail page.
 *
 * Sorted / filtered upstream by the Library composer — this component
 * is presentation only and trusts the input order.
 *
 * @returns A Mantine Table inside a horizontal scroll container.
 */
function SessionsTable({ onSortChange, sessions, sort, testId }: SessionsTableProps) {
  const navigate = useNavigate();

  return (
    <Table.ScrollContainer minWidth={ 640 }>
      <Table data-testid={ testId } highlightOnHover striped>
        <Table.Thead>
          <Table.Tr>
            { COLUMNS.map((column) => {
              const active = sort.key === column.key;
              return (
                <Table.Th key={ column.key }>
                  <UnstyledButton
                    data-testid={ testId === undefined ? undefined : `${ testId }-header-${ column.key }` }
                    onClick={ () => onSortChange({
                      key:   column.key,
                      order: active && sort.order === 'asc' ? 'desc' : 'asc'
                    }) }
                    style={ { fontWeight: 'inherit' } }
                  >
                    { column.label }{ arrowFor(active, sort.order) }
                  </UnstyledButton>
                </Table.Th>
              );
            }) }
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          { sessions.length === 0 && (
            <Table.Tr data-testid={ testId === undefined ? undefined : `${ testId }-no-matches` }>
              <Table.Td colSpan={ COLUMNS.length }>
                <Text c="dimmed" size="sm">No sessions match the current filters.</Text>
              </Table.Td>
            </Table.Tr>
          ) }
          { sessions.map((meta) => (
            <Table.Tr
              key={ meta.id }
              data-testid={ testId === undefined ? undefined : `${ testId }-row-${ meta.id }` }
              onClick={ () => navigate(`/sessions/${ meta.id }`) }
              style={ { cursor: 'pointer' } }
            >
              <Table.Td>{ meta.name }</Table.Td>
              <Table.Td>{ new Date(meta.startedAt).toLocaleString() }</Table.Td>
              <Table.Td>{ formatDuration(meta.duration) }</Table.Td>
              <Table.Td>{ (meta.fileSize / 1024 / 1024).toFixed(2) } MB</Table.Td>
            </Table.Tr>
          )) }
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default SessionsTable;
