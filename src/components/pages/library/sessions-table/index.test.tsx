import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import type { LibrarySort } from 'components/pages/library/utils';
import preferencesReducer, { INITIAL_PREFERENCES } from 'state/preferences';
import sessionsReducer from 'state/sessions';
import type { Session, SessionSummary } from 'types/session';
import { peekToasts, toast } from 'utils';

import SessionsTable from '.';

beforeEach(() => {
  toast.clear();
});

const makeStore = (seedSessions: readonly Session[] = []) => configureStore({
  preloadedState: {
    preferences: INITIAL_PREFERENCES,
    sessions:    { selectedId: null, sessions: seedSessions }
  },
  reducer: {
    preferences: preferencesReducer,
    sessions:    sessionsReducer
  }
});

const makeSession = (overrides: Partial<Session['meta']> = {}): Session => ({
  data: [
    { rpm: 1500, speed_mph: 30, t: 0, ts: 1000 },
    { rpm: 4500, speed_mph: 80, t: 5, ts: 6000 }
  ],
  meta: {
    duration:  5,
    fileName:  'drive.csv',
    fileSize:  1_572_864,
    gpsStart:  { lat: 0, lon: 0 },
    id:        's_default',
    name:      'drive',
    notes:     '',
    startedAt: '2024-10-28T13:50:51.000Z',
    vehicle:   { make: '', model: '', vin: '', year: 0 },
    ...overrides
  }
});

const makeSummary = (): SessionSummary => ({
  avgMpg:   21.4,
  dist:     124.6,
  duration: 5,
  maxBoost: 0,
  maxCool:  205,
  maxSpeed: 80,
  peakHp:   200,
  peakTq:   200,
  t0to30:   null,
  t0to60:   7.1
});

const makeRow = (id: string): { session: Session; summary: SessionSummary } => ({
  session: makeSession({ id }),
  summary: makeSummary()
});

function renderTable(
  rows: readonly { session: Session; summary: SessionSummary }[],
  options: {
    onSelectionToggle?: (id: string) => void;
    onSortChange?: (next: LibrarySort) => void;
    selectedIds?: ReadonlySet<string>;
    sort?: LibrarySort;
  } = {}
) {
  const {
    onSelectionToggle = jest.fn(),
    onSortChange = jest.fn(),
    selectedIds = new Set<string>(),
    sort = { key: 'startedAt' as const, order: 'desc' as const }
  } = options;
  const store = makeStore(rows.map((row) => row.session));
  render(
    <Provider store={ store }>
      <MemoryRouter initialEntries={ ['/library'] }>
        <Routes>
          <Route
            element={
              <SessionsTable
                onSelectionToggle={ onSelectionToggle }
                onSortChange={ onSortChange }
                rows={ rows }
                selectedIds={ selectedIds }
                sort={ sort }
                testId="sessions-table"
                units="imperial"
              />
            }
            path="/library"
          />
          <Route element={ <div data-testid="session-route-sentinel" /> } path="/sessions/:id" />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  return store;
}

describe('pages/library/sessions-table', () => {
  it('renders the table', () => {
    renderTable([makeRow('s_1')]);
    expect(screen.getByTestId('sessions-table')).toBeInTheDocument();
  });

  it('renders a row per supplied (session, summary) pair', () => {
    renderTable([makeRow('s_1'), makeRow('s_2')]);
    expect(screen.getByTestId('sessions-table-row-s_1')).toBeInTheDocument();
    expect(screen.getByTestId('sessions-table-row-s_2')).toBeInTheDocument();
  });

  it('renders the no-matches state when rows is empty', () => {
    renderTable([]);
    expect(screen.getByTestId('sessions-table-no-matches')).toBeInTheDocument();
  });

  it('renders the sortable column headers', () => {
    renderTable([makeRow('s_1')]);
    expect(screen.getByTestId('sessions-table-header-name')).toBeInTheDocument();
    expect(screen.getByTestId('sessions-table-header-startedAt')).toBeInTheDocument();
    expect(screen.getByTestId('sessions-table-header-duration')).toBeInTheDocument();
    expect(screen.getByTestId('sessions-table-header-fileSize')).toBeInTheDocument();
  });

  it('renders a sparkline per row', () => {
    renderTable([makeRow('s_1')]);
    expect(screen.getByTestId('sessions-table-sparkline-s_1')).toBeInTheDocument();
  });

  it('renders a checkbox per row', () => {
    renderTable([makeRow('s_1')]);
    expect(screen.getByTestId('sessions-table-checkbox-s_1')).toBeInTheDocument();
  });

  it('clicking the checkbox fires onSelectionToggle with that row id', async () => {
    const onSelectionToggle = jest.fn();
    const user = userEvent.setup();
    renderTable([makeRow('s_1')], { onSelectionToggle });
    await user.click(screen.getByTestId('sessions-table-checkbox-s_1'));
    expect(onSelectionToggle).toHaveBeenCalledWith('s_1');
  });

  it('clicking a sortable column header fires onSortChange', async () => {
    const onSortChange = jest.fn();
    const user = userEvent.setup();
    renderTable(
      [makeRow('s_1')],
      { onSortChange, sort: { key: 'name', order: 'asc' } }
    );
    await user.click(screen.getByTestId('sessions-table-header-duration'));
    expect(onSortChange).toHaveBeenCalledWith({ key: 'duration', order: 'asc' });
  });

  it('clicking the active header flips the direction', async () => {
    const onSortChange = jest.fn();
    const user = userEvent.setup();
    renderTable(
      [makeRow('s_1')],
      { onSortChange, sort: { key: 'name', order: 'asc' } }
    );
    await user.click(screen.getByTestId('sessions-table-header-name'));
    expect(onSortChange).toHaveBeenCalledWith({ key: 'name', order: 'desc' });
  });

  it('clicking the row `…` button opens the action menu', async () => {
    const user = userEvent.setup();
    renderTable([makeRow('s_1')]);
    await user.click(screen.getByTestId('sessions-table-more-s_1'));
    expect(screen.getByTestId('sessions-table-menu')).toBeInTheDocument();
    expect(screen.getByTestId('sessions-table-menu-open')).toBeInTheDocument();
    expect(screen.getByTestId('sessions-table-menu-rename')).toBeInTheDocument();
    expect(screen.getByTestId('sessions-table-menu-duplicate')).toBeInTheDocument();
    expect(screen.getByTestId('sessions-table-menu-export')).toBeInTheDocument();
    expect(screen.getByTestId('sessions-table-menu-show-in-folder')).toBeInTheDocument();
    expect(screen.getByTestId('sessions-table-menu-delete')).toBeInTheDocument();
  });

  it('menu Rename opens the rename dialog', async () => {
    const user = userEvent.setup();
    renderTable([makeRow('s_1')]);
    await user.click(screen.getByTestId('sessions-table-more-s_1'));
    await user.click(screen.getByTestId('sessions-table-menu-rename'));
    expect(screen.getByTestId('sessions-table-rename-dialog')).toBeInTheDocument();
  });

  it('rename dialog Save dispatches renameSession + shows a toast', async () => {
    const user = userEvent.setup();
    const store = renderTable([makeRow('s_1')]);
    await user.click(screen.getByTestId('sessions-table-more-s_1'));
    await user.click(screen.getByTestId('sessions-table-menu-rename'));

    const input = screen.getByTestId('sessions-table-rename-dialog-input');
    await user.clear(input);
    await user.type(input, 'Renamed drive');
    await user.click(screen.getByTestId('sessions-table-rename-dialog-save'));

    expect(store.getState().sessions.sessions[0].meta.name).toBe('Renamed drive');
    expect(peekToasts()[0].title).toContain('Renamed');
  });

  it('menu Duplicate dispatches addSession with a (copy) suffix + shows a toast', async () => {
    const user = userEvent.setup();
    const store = renderTable([makeRow('s_1')]);
    await user.click(screen.getByTestId('sessions-table-more-s_1'));
    await user.click(screen.getByTestId('sessions-table-menu-duplicate'));

    const stored = store.getState().sessions.sessions;
    expect(stored).toHaveLength(2);
    expect(stored[1].meta.name).toContain('(copy)');
    expect(peekToasts()[0].title).toContain('Duplicated');
  });

  it('menu Delete opens the confirmation dialog; confirm removes the session', async () => {
    const user = userEvent.setup();
    const store = renderTable([makeRow('s_1')]);
    await user.click(screen.getByTestId('sessions-table-more-s_1'));
    await user.click(screen.getByTestId('sessions-table-menu-delete'));
    expect(screen.getByTestId('sessions-table-delete-dialog')).toBeInTheDocument();

    await user.click(screen.getByTestId('sessions-table-delete-dialog-confirm'));
    expect(store.getState().sessions.sessions).toHaveLength(0);
    expect(peekToasts()[0].title).toContain('Deleted');
  });

  it('menu Open navigates to the session detail route', async () => {
    const user = userEvent.setup();
    renderTable([makeRow('s_1')]);
    await user.click(screen.getByTestId('sessions-table-more-s_1'));
    await user.click(screen.getByTestId('sessions-table-menu-open'));
    expect(screen.getByTestId('session-route-sentinel')).toBeInTheDocument();
  });
});
