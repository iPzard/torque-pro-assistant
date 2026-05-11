import { Button, Group, Stack, Table, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from 'state/hooks';
import { selectAllSessionMeta } from 'state/sessions';
import { formatDuration } from 'utils';

/**
 * Renders the Library page — the design's home view, listing every
 * imported session. Currently a minimum-viable table (Name / Started /
 * Duration / Size) backed by the sessions slice; the full design
 * (sortable columns, "Recently driven" cards, search / filter toolbar)
 * lands in CLAUDE.md TODO §E once the basic ingest path is proven
 * end-to-end with a real CSV.
 *
 * Empty state: a single line of copy nudging the user toward `/import`.
 * The header's "Import CSV" button always routes to the same page, so
 * the user has a clear next action regardless of whether the library
 * has rows.
 *
 * @returns The Library page React element.
 */
function Library() {
  const navigate = useNavigate();
  const sessions = useAppSelector((state) => selectAllSessionMeta(state.sessions));

  const hasSessions = sessions.length > 0;

  return (
    <Stack data-testid="library-page" gap="md">
      <Group align="flex-end" justify="space-between">
        <Stack gap={ 4 }>
          <Title data-testid="library-page-title" order={ 2 }>Library</Title>
          <Text c="dimmed" data-testid="library-page-description" size="sm">
            { hasSessions
              ? `${ sessions.length } imported session${ sessions.length === 1 ? '' : 's' }.`
              : 'Imported sessions will land here. Drop a Torque Pro CSV to get started.' }
          </Text>
        </Stack>
        <Button data-testid="library-import-button" onClick={ () => navigate('/import') }>
          Import CSV
        </Button>
      </Group>

      { hasSessions
        ? (
          <Table data-testid="library-sessions-table" highlightOnHover striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Started</Table.Th>
                <Table.Th>Duration</Table.Th>
                <Table.Th>Size</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              { sessions.map((sessionMeta) => (
                <Table.Tr
                  key={ sessionMeta.id }
                  data-testid={ `library-sessions-row-${ sessionMeta.id }` }
                  onClick={ () => navigate(`/sessions/${ sessionMeta.id }`) }
                  style={ { cursor: 'pointer' } }
                >
                  <Table.Td>{ sessionMeta.name }</Table.Td>
                  <Table.Td>{ new Date(sessionMeta.startedAt).toLocaleString() }</Table.Td>
                  <Table.Td>{ formatDuration(sessionMeta.duration) }</Table.Td>
                  <Table.Td>{ (sessionMeta.fileSize / 1024 / 1024).toFixed(2) } MB</Table.Td>
                </Table.Tr>
              )) }
            </Table.Tbody>
          </Table>
        )
        : (
          <Stack
            align="center"
            data-testid="library-empty-state"
            gap={ 4 }
            py="xl"
          >
            <Text c="dimmed" size="sm">No sessions yet.</Text>
          </Stack>
        ) }
    </Stack>
  );
}

export default Library;
