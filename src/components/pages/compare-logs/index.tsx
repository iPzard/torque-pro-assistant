import { Group, MultiSelect, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAppSelector } from 'state/hooks';
import { selectUnits } from 'state/preferences';
import { selectAllSessions } from 'state/sessions';
import type { Session } from 'types/session';

import NoSessionsEmpty from './no-sessions-empty';
import OverlayChart from './overlay-chart';
import PickStage from './pick-stage';
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

/** Color palette per selection slot — matches the picker's swatches
 *  + the overlay chart series colors. */
const COMPARE_COLORS: readonly string[] = [
  'var(--accent)',
  'var(--d-speed)',
  'var(--d-load)',
  '#c084fc'
];

/**
 * Renders the Compare page — three states keyed off the session
 * library + URL `?ids=`:
 *
 *   - **No sessions imported** — `<NoSessionsEmpty>` takes over with
 *     a single primary Import action.
 *   - **Fewer than two selected** — `<PickStage>` renders the
 *     searchable picker (max 4) with an explainer sidecar.
 *   - **Two or more selected** — the overlay view (`<OverlayView>`)
 *     renders the stacked overlay charts + summary table.
 *
 * Each state is a separate function component so hook order stays
 * consistent within each branch — the overlay view memoizes the
 * dataset, the picker manages local set state, and the empty state
 * carries no hooks at all.
 *
 * @returns The Compare page React element.
 */
function CompareLogs() {
  const allSessions = useAppSelector((state) => selectAllSessions(state.sessions));
  const units = useAppSelector((state) => selectUnits(state.preferences));
  const [searchParams, setSearchParams] = useSearchParams();

  const idsFromUrl = useMemo(() => {
    const raw = searchParams.get('ids');
    if (raw === null || raw === '') return [] as readonly string[];
    return raw.split(',').filter((id) => id !== '');
  }, [searchParams]);

  const selected: readonly Session[] = idsFromUrl
    .map((id) => allSessions.find((session) => session.meta.id === id))
    .filter((session): session is Session => session !== undefined)
    .slice(0, MAX_COMPARED);

  const writeIds = (ids: readonly string[]): void => {
    const params = new URLSearchParams(searchParams);
    if (ids.length === 0) {
      params.delete('ids');
    } else {
      params.set('ids', ids.join(','));
    }
    setSearchParams(params, { replace: true });
  };

  return (
    <Stack data-testid="compare-logs-page" gap="md">
      <Stack gap={ 4 }>
        <Title data-testid="compare-logs-page-title" order={ 2 }>Compare</Title>
        <Text c="dimmed" data-testid="compare-logs-page-description" size="sm">
          { allSessions.length === 0
            ? 'Overlay 2–4 sessions on a shared timeline once you have some imported.'
            : `Pick up to ${ MAX_COMPARED } sessions to overlay their key channels.` }
        </Text>
      </Stack>

      { allSessions.length === 0 && (
        <NoSessionsEmpty testId="compare-logs-no-sessions" />
      ) }

      { allSessions.length > 0 && selected.length < 2 && (
        <PickStage
          colors={ COMPARE_COLORS }
          max={ MAX_COMPARED }
          onPick={ writeIds }
          seededIds={ selected.map((session) => session.meta.id) }
          sessions={ allSessions }
          testId="compare-logs-picker"
          units={ units }
        />
      ) }

      { selected.length >= 2 && (
        <OverlayView
          onClearSelection={ () => writeIds([]) }
          onIdsChange={ writeIds }
          selected={ selected }
          sessionPool={ allSessions }
        />
      ) }
    </Stack>
  );
}

interface OverlayViewProps {
  readonly onClearSelection: () => void;
  readonly onIdsChange: (ids: readonly string[]) => void;
  readonly selected: readonly Session[];
  readonly sessionPool: readonly Session[];
}

/**
 * Overlay view — rendered when at least two sessions are picked.
 * Lives as a separate component so its `useState` / `useMemo` calls
 * never trip the rules-of-hooks check when the parent shifts between
 * the picker stage and the overlay (each branch owns its own hook
 * order).
 */
function OverlayView({ onClearSelection, onIdsChange, selected, sessionPool }: OverlayViewProps) {
  const [alignment, setAlignment] = useState<Alignment>('trip-start');

  const overlay = useMemo(
    () => buildOverlayDataset(selected, alignment, COMPARE_PIDS),
    [selected, alignment]
  );

  const sessionOptions = sessionPool.map(
    (session) => ({ label: session.meta.name, value: session.meta.id })
  );

  return (
    <>
      <Group align="flex-end" gap="md" wrap="wrap">
        <MultiSelect
          clearable
          data={ sessionOptions }
          data-testid="compare-logs-session-selector"
          label="Sessions"
          maxValues={ MAX_COMPARED }
          onChange={ (next) => {
            if (next.length === 0) onClearSelection();
            else onIdsChange(next);
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
    </>
  );
}

export default CompareLogs;
