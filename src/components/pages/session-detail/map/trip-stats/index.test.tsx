import { MantineProvider } from '@mantine/core';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';

import preferencesReducer, { INITIAL_PREFERENCES, type PreferencesState } from 'state/preferences';
import type { Session, SessionSummary } from 'types/session';

import TripStats from '.';

const makeSession = (overrides: Partial<Session['meta']> = {}): Session => ({
  data: [],
  meta: {
    duration:  1820,
    fileName:  'drive.csv',
    fileSize:  1024,
    gpsStart:  { lat: 45.60, lon: -122.38 },
    id:        's_1_drive',
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
  duration: 1820,
  maxBoost: 21.4,
  maxCool:  205,
  maxSpeed: 97.2,
  peakHp:   385.4,
  peakTq:   442.1,
  t0to30:   3.2,
  t0to60:   7.1
});

const makeStore = (preferences: PreferencesState = INITIAL_PREFERENCES) => configureStore({
  preloadedState: { preferences },
  reducer:        { preferences: preferencesReducer }
});

function renderTripStats(
  session: Session = makeSession(),
  preferences?: PreferencesState
) {
  return render(
    <Provider store={ makeStore(preferences) }>
      <MantineProvider>
        <TripStats session={ session } summary={ makeSummary() } testId="trip-stats" />
      </MantineProvider>
    </Provider>
  );
}

describe('pages/session-detail/map/trip-stats', () => {
  it('renders the card wrapper', () => {
    renderTripStats();
    expect(screen.getByTestId('trip-stats')).toBeInTheDocument();
  });

  it('renders the distance row in miles under imperial', () => {
    renderTripStats();
    expect(screen.getByTestId('trip-stats-distance-value')).toHaveTextContent('124.6 mi');
  });

  it('renders the distance row in km under metric', () => {
    renderTripStats(makeSession(), { ...INITIAL_PREFERENCES, units: 'metric' });
    expect(screen.getByTestId('trip-stats-distance-value')).toHaveTextContent('km');
  });

  it('renders the duration row formatted as H:MM:SS for hour+ sessions', () => {
    renderTripStats();
    expect(screen.getByTestId('trip-stats-duration-value')).toHaveTextContent('30:20');
  });

  it('renders the max-speed row in mph rounded to whole under imperial', () => {
    renderTripStats();
    expect(screen.getByTestId('trip-stats-max-speed-value')).toHaveTextContent('97 mph');
  });

  it('renders the max-speed row in km/h under metric', () => {
    renderTripStats(makeSession(), { ...INITIAL_PREFERENCES, units: 'metric' });
    expect(screen.getByTestId('trip-stats-max-speed-value')).toHaveTextContent('km/h');
  });

  it('renders the file row with the source CSV name', () => {
    renderTripStats();
    expect(screen.getByTestId('trip-stats-file-value')).toHaveTextContent('drive.csv');
  });

  it('falls back to an em-dash for vehicle when make + model are empty', () => {
    renderTripStats();
    expect(screen.getByTestId('trip-stats-vehicle-value')).toHaveTextContent('—');
  });

  it('joins vehicle make + model when both are present', () => {
    renderTripStats(
      makeSession({ vehicle: { make: 'Ford', model: 'Mustang', vin: '', year: 0 } })
    );
    expect(screen.getByTestId('trip-stats-vehicle-value')).toHaveTextContent('Ford Mustang');
  });
});
