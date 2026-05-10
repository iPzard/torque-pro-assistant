import { Button, Group, Stack, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

/**
 * Renders the Library page — the design's home view, listing every
 * imported session with a sortable table, a "Recently driven" card grid,
 * and a search/filter toolbar. Currently a placeholder; real content
 * lands in CLAUDE.md TODO §C once the sessions slice exists.
 *
 * The "Import CSV" button in the page header navigates to `/import`,
 * matching the design's primary entry point for ingesting new sessions.
 *
 * @returns The Library page React element.
 */
function Library() {
  const navigate = useNavigate();

  return (
    <Stack data-testid="library-page" gap="md">
      <Group align="flex-end" justify="space-between">
        <Stack gap={ 4 }>
          <Title data-testid="library-page-title" order={ 2 }>Library</Title>
          <Text c="dimmed" data-testid="library-page-description" size="sm">
            Imported sessions will land here. Currently a placeholder.
          </Text>
        </Stack>
        <Button data-testid="library-import-button" onClick={ () => navigate('/import') }>
          Import CSV
        </Button>
      </Group>
    </Stack>
  );
}

export default Library;
