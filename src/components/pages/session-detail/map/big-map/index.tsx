import { Center, Text } from '@mantine/core';

import type { Hotspot, HotspotKind } from 'components/pages/session-detail/map/utils';
import { buildRoutePolyline } from 'components/pages/session-detail/utils';
import Card from 'components/primitives/card';
import type { SessionDataRow } from 'types/session';

interface BigMapProps {
  readonly data: readonly SessionDataRow[];
  readonly hotspots: readonly Hotspot[];
  readonly testId?: string;
}

/** Pixel dimensions of the SVG viewBox. The container scales this to
 *  its width; the numbers drive the projection math only. */
const VIEW_WIDTH = 720;
const VIEW_HEIGHT = 420;

/** Hotspot ring colors keyed off the hotspot kind. Cyan / amber / red
 *  matches the rest of the app's chart palette. */
const HOTSPOT_COLOR: Record<HotspotKind, string> = {
  'max-boost': 'var(--mantine-color-red-5)',
  'max-rpm':   'var(--mantine-color-amber-6)',
  'max-speed': 'var(--mantine-color-cyan-4)'
};

/**
 * Large SVG route map for the Session Detail page's Map tab. Reuses
 * the same `buildRoutePolyline` projection as the Overview MiniMap,
 * just at a bigger viewBox, and overlays projected hotspot markers
 * on top of the polyline.
 *
 * Hotspots render as a hollow ring in the kind's color plus a solid
 * dot in the center — readable against both the dark surface and the
 * amber route line.
 *
 * Falls back to a centered "No GPS data" placeholder when the session
 * has fewer than two GPS-bearing samples.
 *
 * @returns A card containing the large route map.
 */
function BigMap({ data, hotspots, testId }: BigMapProps) {
  const route = buildRoutePolyline(
    data,
    VIEW_WIDTH,
    VIEW_HEIGHT,
    hotspots.map((spot) => ({ id: spot.id, lat: spot.lat, lon: spot.lon }))
  );

  if (route.start === null || route.end === null) {
    return (
      <Card subtitle="GPS route + hotspots" testId={ testId } title="Route">
        <Center
          data-testid={ testId === undefined ? undefined : `${ testId }-empty` }
          h={ VIEW_HEIGHT }
        >
          <Text c="dimmed" size="sm">No GPS data in this session</Text>
        </Center>
      </Card>
    );
  }

  /**
   * Re-derive the original `Hotspot` from its projected sibling so the
   * SVG can color each marker by `kind`. The projection step only
   * carries `{ id, x, y, lat, lon }`, but `id` matches `Hotspot.id` by
   * construction in `detectHotspots`.
   */
  const hotspotByMarkerId = new Map(hotspots.map((spot) => [spot.id, spot]));

  return (
    <Card subtitle="GPS route + hotspots" testId={ testId } title="Route">
      <svg
        aria-label="Route map"
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
          r={ 5 }
        />
        <circle
          cx={ route.end.x }
          cy={ route.end.y }
          data-testid={ testId === undefined ? undefined : `${ testId }-end` }
          fill="var(--mantine-color-amber-6)"
          r={ 5 }
        />
        { route.markers.map((marker) => {
          const hotspot = hotspotByMarkerId.get(marker.id);
          if (hotspot === undefined) return null;
          const color = HOTSPOT_COLOR[hotspot.kind];
          return (
            <g
              key={ marker.id }
              data-testid={ testId === undefined ? undefined : `${ testId }-hotspot-${ hotspot.kind }` }
            >
              <circle
                cx={ marker.x }
                cy={ marker.y }
                fill="none"
                r={ 10 }
                stroke={ color }
                strokeWidth={ 2 }
              />
              <circle cx={ marker.x } cy={ marker.y } fill={ color } r={ 3 } />
            </g>
          );
        }) }
      </svg>
    </Card>
  );
}

export default BigMap;
