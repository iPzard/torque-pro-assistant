import { SimpleGrid, Stack, Text, UnstyledButton } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

import Card from 'components/primitives/card';
import type { SessionMeta } from 'types/session';
import { formatDuration } from 'utils';

interface RecentlyDrivenProps {
  /** Sessions to choose recents from. Caller passes the full meta
   *  array; this sub-component picks the top N by date. */
  readonly sessions: readonly SessionMeta[];
  readonly testId?: string;
}

/** Number of recent cards shown — matches the design's grid count. */
const RECENT_COUNT = 4;

/**
 * "Recently driven" card strip beneath the Library header. Picks the
 * `RECENT_COUNT` most recent sessions (by `startedAt` descending)
 * and renders a clickable card per session showing name + start date
 * + duration + distance.
 *
 * Hidden entirely when the library is empty — the empty-state below
 * the table takes over.
 *
 * @returns A card grid React element, or `null` when there's nothing
 *   to show.
 */
function RecentlyDriven({ sessions, testId }: RecentlyDrivenProps) {
  const navigate = useNavigate();

  if (sessions.length === 0) return null;

  const recents = [...sessions]
    .sort((sessionA, sessionB) => sessionB.startedAt.localeCompare(sessionA.startedAt))
    .slice(0, RECENT_COUNT);

  return (
    <Stack data-testid={ testId } gap="xs">
      <Text c="dimmed" fw={ 500 } size="xs" tt="uppercase">Recently driven</Text>
      <SimpleGrid cols={ { base: 1, lg: 4, md: 3, sm: 2 } } spacing="md">
        { recents.map((session) => (
          <UnstyledButton
            key={ session.id }
            data-testid={ testId === undefined ? undefined : `${ testId }-card-${ session.id }` }
            onClick={ () => navigate(`/sessions/${ session.id }`) }
            style={ { display: 'block', textAlign: 'left' } }
          >
            <Card subtitle={ new Date(session.startedAt).toLocaleDateString() } title={ session.name }>
              <Stack gap={ 4 }>
                <Text c="dimmed" size="xs">Duration</Text>
                <Text fw={ 500 } size="sm">{ formatDuration(session.duration) }</Text>
                <Text c="dimmed" mt={ 4 } size="xs">File</Text>
                <Text size="xs" style={ { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }>
                  { session.fileName }
                </Text>
                <Text c="dimmed" mt={ 4 } size="xs">Size</Text>
                <Text size="xs">
                  { (session.fileSize / 1024 / 1024).toFixed(2) } MB
                </Text>
              </Stack>
            </Card>
          </UnstyledButton>
        )) }
      </SimpleGrid>
    </Stack>
  );
}

export default RecentlyDriven;
