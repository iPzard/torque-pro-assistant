import { MantineProvider } from '@mantine/core';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import preferencesReducer, { INITIAL_PREFERENCES } from 'state/preferences';
import sessionsReducer from 'state/sessions';
import type { Session, SessionDataRow } from 'types/session';

import CompareLogs from '.';

const makeRow = (overrides: Partial<SessionDataRow>): SessionDataRow => ({
  t:  0,
  ts: 0,
  ...overrides
});

const makeSession = (id: string, name: string): Session => ({
  data: [
    makeRow({ rpm: 1500, speed_mph: 30, t: 0 }),
    makeRow({ rpm: 4500, speed_mph: 80, t: 5 })
  ],
  meta: {
    duration:  5,
    fileName:  `${ name }.csv`,
    fileSize:  1024,
    gpsStart:  { lat: 0, lon: 0 },
    id,
    name,
    notes:     '',
    startedAt: '2024-10-28T13:50:51.000Z',
    vehicle:   { make: '', model: '', vin: '', year: 0 }
  }
});

const makeStore = (sessions: readonly Session[]) => configureStore({
  preloadedState: {
    preferences: INITIAL_PREFERENCES,
    sessions:    { selectedId: null, sessions }
  },
  reducer: {
    preferences: preferencesReducer,
    sessions:    sessionsReducer
  }
});

function renderCompareLogs(
  sessions: readonly Session[] = [],
  initialPath = '/compare'
) {
  return render(
    <Provider store={ makeStore(sessions) }>
      <MantineProvider>
        <MemoryRouter initialEntries={ [initialPath] }>
          <CompareLogs />
        </MemoryRouter>
      </MantineProvider>
    </Provider>
  );
}

describe('pages/compare-logs', () => {
  it('renders the page wrapper', () => {
    renderCompareLogs();
    expect(screen.getByTestId('compare-logs-page')).toBeInTheDocument();
  });

  it('renders the page heading', () => {
    renderCompareLogs();
    expect(screen.getByTestId('compare-logs-page-title')).toBeInTheDocument();
  });

  it('renders the session selector + alignment toggle', () => {
    renderCompareLogs();
    expect(screen.getByTestId('compare-logs-session-selector')).toBeInTheDocument();
    expect(screen.getByTestId('compare-logs-alignment-toggle')).toBeInTheDocument();
  });

  it('renders the empty state when no sessions are selected', () => {
    renderCompareLogs();
    expect(screen.getByTestId('compare-logs-empty')).toBeInTheDocument();
  });

  it('seeds the selection from the `?ids=` URL param', () => {
    renderCompareLogs(
      [makeSession('s_1', 'run-a'), makeSession('s_2', 'run-b')],
      '/compare?ids=s_1,s_2'
    );
    expect(screen.queryByTestId('compare-logs-empty')).not.toBeInTheDocument();
  });

  it('renders the overlay charts when sessions are selected', () => {
    renderCompareLogs(
      [makeSession('s_1', 'run-a'), makeSession('s_2', 'run-b')],
      '/compare?ids=s_1,s_2'
    );
    expect(screen.getByTestId('compare-logs-overlay-speed_mph')).toBeInTheDocument();
    expect(screen.getByTestId('compare-logs-overlay-rpm')).toBeInTheDocument();
    expect(screen.getByTestId('compare-logs-overlay-throttle')).toBeInTheDocument();
    expect(screen.getByTestId('compare-logs-overlay-boost_psi')).toBeInTheDocument();
  });

  it('renders the summary table when sessions are selected', () => {
    renderCompareLogs(
      [makeSession('s_1', 'run-a'), makeSession('s_2', 'run-b')],
      '/compare?ids=s_1,s_2'
    );
    expect(screen.getByTestId('compare-logs-summary')).toBeInTheDocument();
  });

  it('silently drops URL ids that no longer exist in the store', () => {
    renderCompareLogs(
      [makeSession('s_1', 'run-a')],
      '/compare?ids=s_1,s_does_not_exist'
    );
    expect(screen.getByTestId('compare-logs-summary')).toBeInTheDocument();
  });
});
