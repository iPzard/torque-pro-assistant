import { Button, Group, Stack, Text, Title } from '@mantine/core';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from 'state/hooks';
import { selectUnits, setUnits } from 'state/preferences';
import { selectAllSessionMeta } from 'state/sessions';

import RecentlyDriven from './recently-driven';
import SessionsTable from './sessions-table';
import LibraryToolbar from './toolbar';
import { filterAndSortSessions, type LibrarySort } from './utils';

/**
 * Renders the Library page — the design's home view. Imported
 * sessions show up in a sortable table beneath a "Recently driven"
 * card strip, with a toolbar above the table for search, date-range
 * filtering, and units toggling.
 *
 * State that's local to the Library (search query, date filters,
 * sort column / direction) lives in component state. The units
 * toggle dispatches to the preferences slice so it propagates to
 * the rest of the app immediately.
 *
 * Empty state — no sessions imported at all — replaces the
 * table with a centered placeholder + nudge toward `/import`.
 *
 * @returns The Library page React element.
 */
function Library() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const allMeta = useAppSelector((state) => selectAllSessionMeta(state.sessions));
  const units = useAppSelector((state) => selectUnits(state.preferences));

  const [query, setQuery] = useState('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [sort, setSort] = useState<LibrarySort>({ key: 'startedAt', order: 'desc' });

  const filtered = useMemo(
    () => filterAndSortSessions(allMeta, { fromDate, query, toDate }, sort),
    [allMeta, fromDate, query, toDate, sort]
  );

  const hasSessions = allMeta.length > 0;

  return (
    <Stack data-testid="library-page" gap="md">
      <Group align="flex-end" justify="space-between">
        <Stack gap={ 4 }>
          <Title data-testid="library-page-title" order={ 2 }>Library</Title>
          <Text c="dimmed" data-testid="library-page-description" size="sm">
            { hasSessions
              ? `${ allMeta.length } imported session${ allMeta.length === 1 ? '' : 's' }.`
              : 'Imported sessions will land here. Drop a Torque Pro CSV to get started.' }
          </Text>
        </Stack>
        <Button data-testid="library-import-button" onClick={ () => navigate('/import') }>
          Import CSV
        </Button>
      </Group>

      { hasSessions
        ? (
          <Stack gap="md">
            <LibraryToolbar
              fromDate={ fromDate }
              onFromDateChange={ setFromDate }
              onQueryChange={ setQuery }
              onToDateChange={ setToDate }
              onUnitsChange={ (next) => dispatch(setUnits(next)) }
              query={ query }
              testId="library-toolbar"
              toDate={ toDate }
              units={ units }
            />
            <RecentlyDriven sessions={ allMeta } testId="library-recent" />
            <SessionsTable
              onSortChange={ setSort }
              sessions={ filtered }
              sort={ sort }
              testId="library-sessions-table"
            />
          </Stack>
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
