import { SimpleGrid, Stack } from '@mantine/core';
import { useMemo } from 'react';

import type { Session, SessionSummary } from 'types/session';

import BigMap from './big-map';
import Hotspots from './hotspots';
import TripStats from './trip-stats';
import { detectHotspots } from './utils';

interface MapTabProps {
  readonly session: Session;
  readonly summary: SessionSummary;
  readonly testId?: string;
}

/**
 * Renders the Session Detail page's Map tab — the design's full-tab
 * route view. Composition:
 *   1. `BigMap` — large SVG route with start / end / hotspot markers.
 *   2. 2-column grid: `Hotspots` (left) + `TripStats` (right).
 *
 * Hotspot detection runs once per session via `useMemo` since the
 * walk is O(n) over the row data — cheap for typical drives but
 * worth caching across tab switches.
 *
 * @returns The Map tab body React element.
 */
function MapTab({ session, summary, testId }: MapTabProps) {
  const hotspots = useMemo(() => detectHotspots(session.data), [session.data]);

  return (
    <Stack data-testid={ testId } gap="md">
      <BigMap
        data={ session.data }
        hotspots={ hotspots }
        testId={ testId === undefined ? undefined : `${ testId }-big-map` }
      />
      <SimpleGrid cols={ { base: 1, md: 2 } } spacing="md">
        <Hotspots
          hotspots={ hotspots }
          testId={ testId === undefined ? undefined : `${ testId }-hotspots` }
        />
        <TripStats
          session={ session }
          summary={ summary }
          testId={ testId === undefined ? undefined : `${ testId }-trip-stats` }
        />
      </SimpleGrid>
    </Stack>
  );
}

export default MapTab;
