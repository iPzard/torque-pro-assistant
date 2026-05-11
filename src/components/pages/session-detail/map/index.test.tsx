import { MantineProvider } from '@mantine/core';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';

import preferencesReducer, { INITIAL_PREFERENCES } from 'state/preferences';
import type { Session, SessionDataRow, SessionSummary } from 'types/session';

import MapTab from '.';

const makeStore = () => configureStore({
  preloadedState: { preferences: INITIAL_PREFERENCES },
  reducer:        { preferences: preferencesReducer }
});

const makeRow = (overrides: Partial<SessionDataRow>): SessionDataRow => ({
  t:  0,
  ts: 0,
  ...overrides
});

const makeSession = (): Session => ({
  data: [
    makeRow({ lat: 45.60, lon: -122.40, rpm: 1500, speed_mph: 30, t: 0 }),
    makeRow({ lat: 45.62, lon: -122.38, rpm: 6500, speed_mph: 85, t: 10 }),
    makeRow({ lat: 45.64, lon: -122.36, rpm: 4000, speed_mph: 60, t: 20 })
  ],
  meta: {
    duration:  20,
    fileName:  'drive.csv',
    fileSize:  1024,
    gpsStart:  { lat: 45.60, lon: -122.40 },
    id:        's_1_drive',
    name:      'drive',
    notes:     '',
    startedAt: '2024-10-28T13:50:51.000Z',
    vehicle:   { make: '', model: '', vin: '', year: 0 }
  }
});

const makeSummary = (): SessionSummary => ({
  avgMpg:   21.4,
  dist:     12.6,
  duration: 20,
  maxBoost: 0,
  maxCool:  205,
  maxSpeed: 85,
  peakHp:   180,
  peakTq:   200,
  t0to30:   null,
  t0to60:   null
});

function renderMapTab() {
  return render(
    <Provider store={ makeStore() }>
      <MantineProvider>
        <MapTab session={ makeSession() } summary={ makeSummary() } testId="map-tab" />
      </MantineProvider>
    </Provider>
  );
}

describe('pages/session-detail/map', () => {
  it('renders the tab wrapper', () => {
    renderMapTab();
    expect(screen.getByTestId('map-tab')).toBeInTheDocument();
  });

  it('renders the big map', () => {
    renderMapTab();
    expect(screen.getByTestId('map-tab-big-map')).toBeInTheDocument();
  });

  it('renders the hotspots panel', () => {
    renderMapTab();
    expect(screen.getByTestId('map-tab-hotspots')).toBeInTheDocument();
  });

  it('renders the trip stats panel', () => {
    renderMapTab();
    expect(screen.getByTestId('map-tab-trip-stats')).toBeInTheDocument();
  });

  it('detects max-speed and max-rpm hotspots from session data', () => {
    renderMapTab();
    expect(screen.getByTestId('map-tab-hotspots-row-max-speed')).toBeInTheDocument();
    expect(screen.getByTestId('map-tab-hotspots-row-max-rpm')).toBeInTheDocument();
  });
});
