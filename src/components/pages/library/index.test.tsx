import { MantineProvider } from '@mantine/core';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import preferencesReducer, { INITIAL_PREFERENCES } from 'state/preferences';
import sessionsReducer from 'state/sessions';
import type { Session } from 'types/session';

import Library from '.';

const makeTestStore = (sessions: readonly Session[] = []) => configureStore({
  preloadedState: {
    preferences: INITIAL_PREFERENCES,
    sessions:    { selectedId: null, sessions }
  },
  reducer: {
    preferences: preferencesReducer,
    sessions:    sessionsReducer
  }
});

const makeSession = (id: string, name: string): Session => ({
  data: [],
  meta: {
    duration:  187,
    fileName:  `${ name }.csv`,
    fileSize:  1_572_864,
    gpsStart:  { lat: 0, lon: 0 },
    id,
    name,
    notes:     '',
    startedAt: '2026-05-10T09:34:12.000Z',
    vehicle:   { make: '', model: '', vin: '', year: 0 }
  }
});

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

  it('renders the toolbar when sessions are present', () => {
    renderLibrary([makeSession('s_1_drive', 'drive')]);
    expect(screen.getByTestId('library-toolbar')).toBeInTheDocument();
  });

  it('renders the recently-driven strip when sessions are present', () => {
    renderLibrary([makeSession('s_1_drive', 'drive')]);
    expect(screen.getByTestId('library-recent')).toBeInTheDocument();
  });

  it('hides the empty-state copy once sessions are present', () => {
    renderLibrary([makeSession('s_1_drive', 'drive')]);
    expect(screen.queryByTestId('library-empty-state')).not.toBeInTheDocument();
  });

  it('clicking a row navigates to that session\'s detail route', async () => {
    const user = userEvent.setup();
    renderLibrary([makeSession('s_1_drive', 'drive')]);
    await user.click(screen.getByTestId('library-sessions-table-row-s_1_drive'));
    expect(screen.getByTestId('session-route-sentinel')).toBeInTheDocument();
  });
});
