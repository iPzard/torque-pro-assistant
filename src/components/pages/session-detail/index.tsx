import { Button, Group, Stack, Tabs, Text, Title } from '@mantine/core';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAppSelector } from 'state/hooks';
import { selectUnits } from 'state/preferences';
import { selectSessionById } from 'state/sessions';
import { formatDistance, formatDuration, summarize } from 'utils';

import ChartsTab from './charts-tab';
import MapTab from './map';
import NotFound from './not-found';
import Overview from './overview';
import RawData from './raw-data';

/**
 * Renders the Session Detail screen — `/sessions/:id`. Resolves the URL
 * id against the sessions slice, computes the session's summary, and
 * lays out the design's two-row header (title + horizontal KV strip)
 * over the four-tab shell (Overview / Charts / Map / Raw Data).
 *
 * Tab panels are placeholders for now; real content lands as CLAUDE.md
 * TODO §19–§22:
 *   - Overview — Metric grid + Speed/RPM dual-axis chart + the rest.
 *   - Charts   — Filmstrip stack with PID picker drawer.
 *   - Map      — BigMap polyline from GPS + hotspots + trip stats.
 *   - Raw Data — Paginated row table with shared-cursor hover.
 *
 * Unknown ids land on a "Session not found" state with a back-to-Library
 * button. The same back button anchors the right side of the header for
 * known sessions — predictable target across both states.
 *
 * @returns The Session Detail page React element.
 */
function SessionDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const session = useAppSelector((state) =>
    id !== undefined ? selectSessionById(state.sessions, id) : undefined
  );
  const units = useAppSelector((state) => selectUnits(state.preferences));
  /**
   * `summarize` walks every row, so memoize across re-renders. The slice
   * is immutable after import — once a Session reference lands in the
   * store it never changes, so identity is a sound cache key.
   */
  const summary = useMemo(
    () => (session === undefined ? null : summarize(session)),
    [session]
  );

  if (session === undefined || summary === null) {
    return (
      <NotFound
        routeId={ id ?? '—' }
        testId="session-detail-not-found"
      />
    );
  }

  const vehicleParts = [session.meta.vehicle.make, session.meta.vehicle.model]
    .filter((part) => part !== '');
  const vehicleLabel = vehicleParts.length === 0 ? '—' : vehicleParts.join(' ');

  return (
    <Stack data-testid="session-detail-page" gap="md">
      <Group align="flex-start" justify="space-between" wrap="nowrap">
        <Stack gap={ 4 }>
          <Title data-testid="session-detail-title" order={ 2 }>
            { session.meta.name }
          </Title>
          <Group data-testid="session-detail-kv" gap="xs" wrap="wrap">
            <Text c="dimmed" data-testid="session-detail-kv-date" size="sm">
              { new Date(session.meta.startedAt).toLocaleString() }
            </Text>
            <Text c="dimmed" size="sm">·</Text>
            <Text c="dimmed" data-testid="session-detail-kv-vehicle" size="sm">
              { vehicleLabel }
            </Text>
            <Text c="dimmed" size="sm">·</Text>
            <Text c="dimmed" data-testid="session-detail-kv-duration" size="sm">
              { formatDuration(session.meta.duration) }
            </Text>
            <Text c="dimmed" size="sm">·</Text>
            <Text c="dimmed" data-testid="session-detail-kv-distance" size="sm">
              { formatDistance(summary.dist, units) }
            </Text>
            <Text c="dimmed" size="sm">·</Text>
            <Text c="dimmed" data-testid="session-detail-kv-filename" size="sm">
              { session.meta.fileName }
            </Text>
          </Group>
        </Stack>
        <Button
          data-testid="session-detail-back-button"
          onClick={ () => navigate('/library') }
          variant="subtle"
        >
          Back
        </Button>
      </Group>

      <Tabs data-testid="session-detail-tabs" defaultValue="overview">
        <Tabs.List>
          <Tabs.Tab data-testid="session-detail-tab-overview" value="overview">
            Overview
          </Tabs.Tab>
          <Tabs.Tab data-testid="session-detail-tab-charts" value="charts">
            Charts
          </Tabs.Tab>
          <Tabs.Tab data-testid="session-detail-tab-map" value="map">
            Map
          </Tabs.Tab>
          <Tabs.Tab data-testid="session-detail-tab-raw" value="raw">
            Raw Data
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel data-testid="session-detail-panel-overview" pt="md" value="overview">
          <Overview session={ session } summary={ summary } testId="session-detail-overview" />
        </Tabs.Panel>
        <Tabs.Panel data-testid="session-detail-panel-charts" pt="md" value="charts">
          <ChartsTab session={ session } testId="session-detail-charts" />
        </Tabs.Panel>
        <Tabs.Panel data-testid="session-detail-panel-map" pt="md" value="map">
          <MapTab session={ session } summary={ summary } testId="session-detail-map" />
        </Tabs.Panel>
        <Tabs.Panel data-testid="session-detail-panel-raw" pt="md" value="raw">
          <RawData data={ session.data } testId="session-detail-raw-data" />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

export default SessionDetail;
