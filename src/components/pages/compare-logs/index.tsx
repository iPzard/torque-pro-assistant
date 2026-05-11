import { Group, MultiSelect, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAppSelector } from 'state/hooks';
import { selectAllSessions } from 'state/sessions';

import OverlayChart from './overlay-chart';
import SummaryTable from './summary-table';
import { type Alignment, buildOverlayDataset } from './utils';

/** Maximum sessions the overlay charts will render together. Picked to
 *  match the design's call-out — beyond four, lines start to crowd and
 *  the Δ column on the summary table stops being meaningful. */
const MAX_COMPARED = 4;

/** PIDs each overlay chart is built around. Order drives the visual
 *  stack on the Compare page. */
const COMPARE_PIDS: readonly string[] = ['speed_mph', 'rpm', 'throttle', 'boost_psi'];

/** Cross-chart cursor sync id for the Compare overlay stack. Distinct
 *  from the Overview / Charts tab ids so the cursor doesn't drift
 *  across page navigations. */
const COMPARE_SYNC_ID = 'compare-overlay';

/**
 * Renders the Compare page — overlay charts (Speed / RPM / Throttle /
 * Boost) for 2–4 sessions selected from the URL `?ids=` query param
 * or the in-page MultiSelect, plus an alignment toggle (trip start /
 * GPS lock) and a side-by-side summary table with a Δ column.
 *
 * URL state: `?ids=s_1,s_2,s_3` seeds the selection on mount.
 * Toggling the MultiSelect rewrites the URL (replace, not push) so
 * a deep link reflects the active comparison.
 *
 * @returns The Compare page React element.
 */
function CompareLogs() {
  const allSessions = useAppSelector((state) => selectAllSessions(state.sessions));
  const [searchParams, setSearchParams] = useSearchParams();
  const [alignment, setAlignment] = useState<Alignment>('trip-start');

  const idsFromUrl = useMemo(() => {
    const raw = searchParams.get('ids');
    if (raw === null || raw === '') return [] as readonly string[];
    return raw.split(',').filter((id) => id !== '');
  }, [searchParams]);

  const sessionOptions = useMemo(
    () => allSessions.map((session) => ({ label: session.meta.name, value: session.meta.id })),
    [allSessions]
  );

  const selected = idsFromUrl
    .map((id) => allSessions.find((session) => session.meta.id === id))
    .filter((session): session is NonNullable<typeof session> => session !== undefined)
    .slice(0, MAX_COMPARED);

  const overlay = useMemo(
    () => buildOverlayDataset(selected, alignment, COMPARE_PIDS),
    [selected, alignment]
  );

  return (
    <Stack data-testid="compare-logs-page" gap="md">
      <Stack gap={ 4 }>
        <Title data-testid="compare-logs-page-title" order={ 2 }>Compare</Title>
        <Text c="dimmed" data-testid="compare-logs-page-description" size="sm">
          Pick up to { MAX_COMPARED } sessions to overlay their key channels.
        </Text>
      </Stack>

      <Group align="flex-end" gap="md" wrap="wrap">
        <MultiSelect
          clearable
          data={ sessionOptions }
          data-testid="compare-logs-session-selector"
          label="Sessions"
          maxValues={ MAX_COMPARED }
          onChange={ (next) => {
            const params = new URLSearchParams(searchParams);
            if (next.length === 0) {
              params.delete('ids');
            } else {
              params.set('ids', next.join(','));
            }
            setSearchParams(params, { replace: true });
          } }
          placeholder="Pick sessions"
          searchable
          style={ { flex: 1, minWidth: 280 } }
          value={ selected.map((session) => session.meta.id) }
        />
        <SegmentedControl
          data={ [
            { label: 'Trip start', value: 'trip-start' },
            { label: 'GPS lock',   value: 'gps' }
          ] }
          data-testid="compare-logs-alignment-toggle"
          onChange={ (next) => setAlignment(next as Alignment) }
          value={ alignment }
        />
      </Group>

      { selected.length === 0 && (
        <Text
          c="dimmed"
          data-testid="compare-logs-empty"
          size="sm"
        >
          No sessions selected yet — pick at least one above to start comparing.
        </Text>
      ) }

      { selected.length > 0 && (
        <Stack gap="md">
          { COMPARE_PIDS.map((pid) => (
            <OverlayChart
              key={ pid }
              data={ overlay.data }
              series={ overlay.series.filter((entry) => entry.pid === pid) }
              syncId={ COMPARE_SYNC_ID }
              testId={ `compare-logs-overlay-${ pid }` }
            />
          )) }
          <SummaryTable sessions={ selected } testId="compare-logs-summary" />
        </Stack>
      ) }
    </Stack>
  );
}

export default CompareLogs;
