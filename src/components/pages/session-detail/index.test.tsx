import { MantineProvider } from '@mantine/core';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import preferencesReducer, { INITIAL_PREFERENCES } from 'state/preferences';
import sessionsReducer from 'state/sessions';
import type { Session, SessionDataRow } from 'types/session';

import SessionDetail from '.';

/** Build a fresh store seeded with the given sessions + default
 *  preferences. SessionDetail reads from both slices. */
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

/**
 * Build a synthetic data row at a given `t` (seconds) with a moving
 * GPS pair. Enough fields are populated for `summarize` to walk the
 * row without short-circuiting; lat/lon are nudged step-by-step so
 * the haversine distance calc emits a non-zero value.
 */
const makeRow = (tSeconds: number): SessionDataRow => ({
  lat:       45.60 + tSeconds * 0.0001,
  lon:       -122.38 + tSeconds * 0.0001,
  rpm:       1500,
  speed_mph: 30,
  t:         tSeconds,
  ts:        Date.parse('2024-10-28T13:50:51Z') + tSeconds * 1000
});

/** Build a minimum-shaped Session for tests. */
const makeSession = (id: string, name: string): Session => ({
  data: [makeRow(0), makeRow(1), makeRow(2)],
  meta: {
    duration: 187,
    fileName: `${ name }.csv`,
    fileSize: 1_572_864,
    gpsStart: { lat: 45.60, lon: -122.38 },
    id,
    name,
    notes: '',
    startedAt: '2024-10-28T13:50:51.000Z',
    vehicle: { make: '', model: '', vin: '', year: 0 }
  }
});

/**
 * Render SessionDetail mounted under `/sessions/:id`. Library + a tiny
 * sentinel sit at sibling routes so back-button navigation can be
 * observed without rendering the real Library tree.
 */
function renderSessionDetail(
  url: string,
  sessions: readonly Session[] = []
) {
  return render(
    <Provider store={ makeTestStore(sessions) }>
      <MantineProvider>
        <MemoryRouter initialEntries={ [url] }>
          <Routes>
            <Route element={ <SessionDetail /> } path="/sessions/:id" />
            <Route element={ <div data-testid="library-route-sentinel" /> } path="/library" />
          </Routes>
        </MemoryRouter>
      </MantineProvider>
    </Provider>
  );
}

describe('pages/session-detail', () => {
  it('renders the page wrapper when the id resolves to a session', () => {
    renderSessionDetail('/sessions/s_1_drive', [makeSession('s_1_drive', 'drive')]);
    expect(screen.getByTestId('session-detail-page')).toBeInTheDocument();
  });

  it('renders the session name as the page title', () => {
    renderSessionDetail('/sessions/s_1_drive', [makeSession('s_1_drive', 'morning-drive')]);
    expect(screen.getByTestId('session-detail-title')).toHaveTextContent('morning-drive');
  });

  it('renders the header KV strip', () => {
    renderSessionDetail('/sessions/s_1_drive', [makeSession('s_1_drive', 'drive')]);
    expect(screen.getByTestId('session-detail-kv')).toBeInTheDocument();
    expect(screen.getByTestId('session-detail-kv-date')).toBeInTheDocument();
    expect(screen.getByTestId('session-detail-kv-vehicle')).toBeInTheDocument();
    expect(screen.getByTestId('session-detail-kv-duration')).toBeInTheDocument();
    expect(screen.getByTestId('session-detail-kv-distance')).toBeInTheDocument();
    expect(screen.getByTestId('session-detail-kv-filename')).toBeInTheDocument();
  });

  it('falls back to an em-dash for vehicle when make + model are empty', () => {
    renderSessionDetail('/sessions/s_1_drive', [makeSession('s_1_drive', 'drive')]);
    expect(screen.getByTestId('session-detail-kv-vehicle')).toHaveTextContent('—');
  });

  it('shows the file name in the header KV strip', () => {
    renderSessionDetail('/sessions/s_1_drive', [makeSession('s_1_drive', 'drive')]);
    expect(screen.getByTestId('session-detail-kv-filename')).toHaveTextContent('drive.csv');
  });

  it('renders all four tab triggers', () => {
    renderSessionDetail('/sessions/s_1_drive', [makeSession('s_1_drive', 'drive')]);
    expect(screen.getByTestId('session-detail-tab-overview')).toBeInTheDocument();
    expect(screen.getByTestId('session-detail-tab-charts')).toBeInTheDocument();
    expect(screen.getByTestId('session-detail-tab-map')).toBeInTheDocument();
    expect(screen.getByTestId('session-detail-tab-raw')).toBeInTheDocument();
  });

  it('defaults to the Overview panel', () => {
    renderSessionDetail('/sessions/s_1_drive', [makeSession('s_1_drive', 'drive')]);
    expect(screen.getByTestId('session-detail-panel-overview')).toBeInTheDocument();
  });

  it('switches to the Charts panel when its tab is clicked', async () => {
    const user = userEvent.setup();
    renderSessionDetail('/sessions/s_1_drive', [makeSession('s_1_drive', 'drive')]);
    await user.click(screen.getByTestId('session-detail-tab-charts'));
    expect(screen.getByTestId('session-detail-panel-charts')).toBeInTheDocument();
  });

  it('renders the not-found state when the id has no matching session', () => {
    renderSessionDetail('/sessions/s_does_not_exist');
    expect(screen.getByTestId('session-detail-not-found')).toBeInTheDocument();
  });

  it('omits the main page wrapper when the session is missing', () => {
    renderSessionDetail('/sessions/s_does_not_exist');
    expect(screen.queryByTestId('session-detail-page')).not.toBeInTheDocument();
  });

  it('back button on the not-found state navigates to /library', async () => {
    const user = userEvent.setup();
    renderSessionDetail('/sessions/s_does_not_exist');
    await user.click(screen.getByTestId('session-detail-not-found-back-button'));
    expect(screen.getByTestId('library-route-sentinel')).toBeInTheDocument();
  });

  it('back button on the loaded state navigates to /library', async () => {
    const user = userEvent.setup();
    renderSessionDetail('/sessions/s_1_drive', [makeSession('s_1_drive', 'drive')]);
    await user.click(screen.getByTestId('session-detail-back-button'));
    expect(screen.getByTestId('library-route-sentinel')).toBeInTheDocument();
  });
});
