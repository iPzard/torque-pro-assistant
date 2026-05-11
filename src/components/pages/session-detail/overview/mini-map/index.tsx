import { Center, Text } from '@mantine/core';

import { buildRoutePolyline } from 'components/pages/session-detail/utils';
import Card from 'components/primitives/card';
import type { SessionDataRow } from 'types/session';

export interface MiniMapProps {
  readonly data: readonly SessionDataRow[];
  readonly testId?: string;
}

/** Pixel dimensions of the SVG viewBox. CSS scales the rendered map
 *  to its container; the viewBox numbers only drive the projection
 *  math in `buildRoutePolyline`. */
const VIEW_WIDTH = 320;
const VIEW_HEIGHT = 180;

/**
 * Compact route map for the Session Overview tab. Draws an SVG
 * polyline tracing the trip's GPS path, with start (cyan) and end
 * (amber) markers, inside the standard `Card` shell.
 *
 * Sessions with fewer than two GPS-bearing rows render a centered
 * "No GPS data" placeholder instead — common for OBD-only captures
 * where the phone's GPS was off.
 *
 * The bigger Map tab (CLAUDE.md TODO §21) consumes a separate
 * `BigMap` once the design's hotspots / trip-stats sidecars land;
 * `buildRoutePolyline` is shaped to be promoted out of this sub-
 * component at that point.
 *
 * @returns A card containing the route mini-map.
 */
function MiniMap({ data, testId }: MiniMapProps) {
  const route = buildRoutePolyline(data, VIEW_WIDTH, VIEW_HEIGHT);

  if (route.start === null || route.end === null) {
    return (
      <Card subtitle="GPS route" testId={ testId } title="Route">
        <Center
          data-testid={ testId === undefined ? undefined : `${ testId }-empty` }
          h={ VIEW_HEIGHT }
        >
          <Text c="dimmed" size="sm">No GPS data in this session</Text>
        </Center>
      </Card>
    );
  }

  return (
    <Card subtitle="GPS route" testId={ testId } title="Route">
      <svg
        aria-label="Route mini-map"
        data-testid={ testId === undefined ? undefined : `${ testId }-svg` }
        height={ VIEW_HEIGHT }
        preserveAspectRatio="xMidYMid meet"
        style={ { display: 'block', width: '100%' } }
        viewBox={ `0 0 ${ VIEW_WIDTH } ${ VIEW_HEIGHT }` }
      >
        <path
          d={ route.path }
          data-testid={ testId === undefined ? undefined : `${ testId }-route` }
          fill="none"
          stroke="var(--mantine-color-amber-6)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={ 1.5 }
        />
        <circle
          cx={ route.start.x }
          cy={ route.start.y }
          data-testid={ testId === undefined ? undefined : `${ testId }-start` }
          fill="var(--mantine-color-cyan-4)"
          r={ 3 }
        />
        <circle
          cx={ route.end.x }
          cy={ route.end.y }
          data-testid={ testId === undefined ? undefined : `${ testId }-end` }
          fill="var(--mantine-color-amber-6)"
          r={ 3 }
        />
      </svg>
    </Card>
  );
}

export default MiniMap;
