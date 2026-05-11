import { Group, Stack, Text } from '@mantine/core';

import type { Hotspot, HotspotKind } from 'components/pages/session-detail/map/utils';
import Card from 'components/primitives/card';
import { formatDuration } from 'utils';

interface HotspotsProps {
  readonly hotspots: readonly Hotspot[];
  readonly testId?: string;
}

/** Hotspot ring colors keyed off the hotspot kind. Mirrors the
 *  BigMap palette so the side panel reads as paired with the map. */
const HOTSPOT_COLOR: Record<HotspotKind, string> = {
  'max-boost': 'var(--mantine-color-red-5)',
  'max-rpm':   'var(--mantine-color-amber-6)',
  'max-speed': 'var(--mantine-color-cyan-4)'
};

/**
 * Side panel listing every hotspot the Map tab is annotating. Each
 * row shows the hotspot's kind (colored dot), label, peak value (with
 * unit), and the elapsed time at which it occurred — enough context
 * for the user to cross-reference the map markers with the chart
 * cursor on the Overview tab.
 *
 * Empty list renders a dimmed "No hotspots" placeholder so the panel
 * doesn't look broken on OBD-only sessions or sessions without the
 * relevant PIDs.
 *
 * @returns A card listing the hotspots.
 */
function Hotspots({ hotspots, testId }: HotspotsProps) {
  return (
    <Card subtitle="GPS-anchored peaks" testId={ testId } title="Hotspots">
      { hotspots.length === 0 ? (
        <Text c="dimmed" data-testid={ testId === undefined ? undefined : `${ testId }-empty` } size="sm">
          No hotspots detected for this session.
        </Text>
      ) : (
        <Stack gap="sm">
          { hotspots.map((hotspot) => (
            <Group
              key={ hotspot.id }
              align="center"
              data-testid={ testId === undefined ? undefined : `${ testId }-row-${ hotspot.kind }` }
              gap="sm"
              wrap="nowrap"
            >
              <span
                aria-hidden
                style={ {
                  background:   HOTSPOT_COLOR[hotspot.kind],
                  borderRadius: '50%',
                  flex:         'none',
                  height:       10,
                  width:        10
                } }
              />
              <Stack gap={ 2 } style={ { flex: 1 } }>
                <Text fw={ 500 } size="sm">{ hotspot.label }</Text>
                <Text c="dimmed" size="xs">
                  at { formatDuration(hotspot.t) } · { hotspot.lat.toFixed(4) }, { hotspot.lon.toFixed(4) }
                </Text>
              </Stack>
              <Text
                data-testid={ testId === undefined ? undefined : `${ testId }-row-${ hotspot.kind }-value` }
                fw={ 600 }
                size="sm"
              >
                { hotspot.value.toFixed(hotspot.kind === 'max-boost' ? 1 : 0) }
                <Text c="dimmed" inherit span>{ ' ' }{ hotspot.unit }</Text>
              </Text>
            </Group>
          )) }
        </Stack>
      ) }
    </Card>
  );
}

export default Hotspots;
