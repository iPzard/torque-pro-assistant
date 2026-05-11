import { MantineProvider } from '@mantine/core';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import sessionsReducer from 'state/sessions';
import type { Session } from 'types/session';

import Library from '.';

/**
 * Build a fresh Redux store for one test. Skipping the real `state/store`
 * default export avoids carrying its localStorage hydration and persist-
 * on-dispatch side effects into the test process.
 */
const makeTestStore = (sessions: readonly Session[] = []) => configureStore({
  preloadedState: {
    sessions: { selectedId: null, sessions }
  },
  reducer: { sessions: sessionsReducer }
});

/** Build a minimum-shaped Session for tests that only care about meta. */
const makeSession = (id: string, name: string): Session => ({
  data: [],
  meta: {
    duration: 187,
    fileName: `${ name }.csv`,
    fileSize: 1_572_864,
    gpsStart: { lat: 0, lon: 0 },
    id,
    name,
    notes: '',
    startedAt: '2026-05-10T09:34:12.000Z',
    vehicle: { make: '', model: '', vin: '', year: 0 }
  }
});

/**
 * Library reads from Redux + uses `useNavigate`, so the harness wires
 * both. A probe route at `/import` lets us verify the header CTA hops
 * to the Import page without rendering its real (Dropzone-heavy) tree.
 */
function renderLibrary(sessions: readonly Session[] = []) {
  return render(
    <Provider store={ makeTestStore(sessions) }>
      <MantineProvider>
        <MemoryRouter initialEntries={ ['/library'] }>
          <Routes>
            <Route element={ <Library /> } path="/library" />
            <Route element={ <div data-testid="import-route-sentinel" /> } path="/import" />
            <Route
              element={ <div data-testid="session-route-sentinel" /> }
              path="/sessions/:id"
            />
          </Routes>
        </MemoryRouter>
      </MantineProvider>
    </Provider>
  );
}

describe('pages/library', () => {
  it('renders the page heading', () => {
    renderLibrary();
    expect(screen.getByTestId('library-page-title')).toBeInTheDocument();
  });

  it('shows the empty-state copy when no sessions are imported', () => {
    renderLibrary();
    expect(screen.getByTestId('library-empty-state')).toBeInTheDocument();
  });

  it('omits the sessions table when no sessions are imported', () => {
    renderLibrary();
    expect(screen.queryByTestId('library-sessions-table')).not.toBeInTheDocument();
  });

  it('Import CSV button is present', () => {
    renderLibrary();
    expect(screen.getByTestId('library-import-button')).toBeInTheDocument();
  });

  it('clicking Import CSV navigates to /import', async () => {
    const user = userEvent.setup();
    renderLibrary();
    await user.click(screen.getByTestId('library-import-button'));
    expect(screen.getByTestId('import-route-sentinel')).toBeInTheDocument();
  });

  it('renders the sessions table when at least one session exists', () => {
    renderLibrary([makeSession('s_1_drive', 'drive')]);
    expect(screen.getByTestId('library-sessions-table')).toBeInTheDocument();
  });

  it('renders one row per imported session', () => {
    renderLibrary([
      makeSession('s_1_drive', 'drive-one'),
      makeSession('s_2_drive', 'drive-two')
    ]);
    expect(screen.getByTestId('library-sessions-row-s_1_drive')).toBeInTheDocument();
    expect(screen.getByTestId('library-sessions-row-s_2_drive')).toBeInTheDocument();
  });

  it('hides the empty-state copy once sessions are present', () => {
    renderLibrary([makeSession('s_1_drive', 'drive')]);
    expect(screen.queryByTestId('library-empty-state')).not.toBeInTheDocument();
  });

  it('clicking a row navigates to that session\'s detail route', async () => {
    const user = userEvent.setup();
    renderLibrary([makeSession('s_1_drive', 'drive')]);
    await user.click(screen.getByTestId('library-sessions-row-s_1_drive'));
    expect(screen.getByTestId('session-route-sentinel')).toBeInTheDocument();
  });
});
