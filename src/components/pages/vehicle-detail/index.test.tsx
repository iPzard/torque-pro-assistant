import { MantineProvider } from '@mantine/core';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import preferencesReducer, {
  INITIAL_PREFERENCES,
  type PreferencesState,
  type SavedVehicle
} from 'state/preferences';
import sessionsReducer from 'state/sessions';
import type { Session } from 'types/session';
import { peekToasts, toast } from 'utils';

import VehicleDetail from '.';

beforeEach(() => { toast.clear(); });

const makeVehicle = (overrides: Partial<SavedVehicle> = {}): SavedVehicle => ({
  addedAt:       '2024-10-28T13:50:51.000Z',
  calibrations:  [],
  curbWeightLb:  4630,
  displacementL: 3.0,
  drivetrain:    'AWD',
  id:            'v1',
  lastUsed:      '2026-04-14T19:32:00.000Z',
  make:          'Mercedes-Benz',
  model:         'AMG GT 53',
  redlineRpm:    7000,
  transmission:  'AT9',
  vin:           'WDD2J6BB0KA000000',
  year:          2019,
  ...overrides
});

const makeSession = (id: string, vin = 'WDD2J6BB0KA000000'): Session => ({
  data: [{ rpm: 1500, speed_mph: 30, t: 0, ts: 1000 }],
  meta: {
    duration:  1,
    fileName:  `${ id }.csv`,
    fileSize:  1024,
    gpsStart:  { lat: 0, lon: 0 },
    id,
    name:      id,
    notes:     '',
    startedAt: '2024-10-28T13:50:51.000Z',
    vehicle:   { make: 'Mercedes-Benz', model: 'AMG GT 53', vin, year: 2019 }
  }
});

const makeStore = (
  vehicles: readonly SavedVehicle[],
  sessions: readonly Session[] = [],
  preferencesOverrides: Partial<PreferencesState> = {}
) => configureStore({
  preloadedState: {
    preferences: { ...INITIAL_PREFERENCES, savedVehicles: vehicles, ...preferencesOverrides },
    sessions:    { selectedId: null, sessions }
  },
  reducer: {
    preferences: preferencesReducer,
    sessions:    sessionsReducer
  }
});

function renderDetail(
  vehicles: readonly SavedVehicle[],
  initialPath: string,
  sessions: readonly Session[] = [],
  preferencesOverrides: Partial<PreferencesState> = {}
) {
  const store = makeStore(vehicles, sessions, preferencesOverrides);
  render(
    <Provider store={ store }>
      <MantineProvider>
        <MemoryRouter initialEntries={ [initialPath] }>
          <Routes>
            <Route element={ <VehicleDetail /> } path="/vehicles/:id" />
            <Route element={ <div data-testid="settings-sentinel" /> } path="/settings" />
            <Route element={ <div data-testid="session-sentinel" /> } path="/sessions/:id" />
          </Routes>
        </MemoryRouter>
      </MantineProvider>
    </Provider>
  );
  return store;
}

describe('pages/vehicle-detail', () => {
  it('renders the page wrapper for a known vehicle', () => {
    renderDetail([makeVehicle()], '/vehicles/v1');
    expect(screen.getByTestId('vehicle-detail-page')).toBeInTheDocument();
    expect(screen.getByTestId('vehicle-detail-title')).toHaveTextContent('2019 Mercedes-Benz AMG GT 53');
  });

  it('renders the not-found state for an unknown id', () => {
    renderDetail([], '/vehicles/missing');
    expect(screen.getByTestId('vehicle-detail-not-found')).toBeInTheDocument();
  });

  it('shows the active pill when the vehicle is the active one', () => {
    renderDetail([makeVehicle()], '/vehicles/v1', [], { activeVehicleId: 'v1' });
    expect(screen.getByTestId('vehicle-detail-active-pill')).toBeInTheDocument();
  });

  it('omits the active pill when another vehicle is active', () => {
    renderDetail([makeVehicle()], '/vehicles/v1', [], { activeVehicleId: 'v2' });
    expect(screen.queryByTestId('vehicle-detail-active-pill')).not.toBeInTheDocument();
  });

  it('renders the spec displays in read-only mode', () => {
    renderDetail([makeVehicle()], '/vehicles/v1');
    expect(screen.getByTestId('vehicle-detail-curb-display')).toHaveTextContent('4,630 lb');
    expect(screen.getByTestId('vehicle-detail-redline-display')).toHaveTextContent('7,000 rpm');
    expect(screen.getByTestId('vehicle-detail-displacement-display')).toHaveTextContent('3.0 L');
    expect(screen.getByTestId('vehicle-detail-transmission-display')).toHaveTextContent('9-speed');
  });

  it('Edit button reveals the spec inputs', async () => {
    const user = userEvent.setup();
    renderDetail([makeVehicle()], '/vehicles/v1');
    await user.click(screen.getByTestId('vehicle-detail-edit'));
    expect(screen.getByTestId('vehicle-detail-curb')).toBeInTheDocument();
    expect(screen.getByTestId('vehicle-detail-redline')).toBeInTheDocument();
    expect(screen.getByTestId('vehicle-detail-transmission')).toBeInTheDocument();
  });

  it('Cancel restores the original values without dispatching', async () => {
    const user = userEvent.setup();
    const store = renderDetail([makeVehicle()], '/vehicles/v1');
    await user.click(screen.getByTestId('vehicle-detail-edit'));
    const input = screen.getByTestId('vehicle-detail-curb');
    await user.clear(input);
    await user.type(input, '9999');
    await user.click(screen.getByTestId('vehicle-detail-cancel'));
    expect(store.getState().preferences.savedVehicles[0].curbWeightLb).toBe(4630);
  });

  it('Save dispatches updateSavedVehicle + fires a toast', async () => {
    const user = userEvent.setup();
    const store = renderDetail([makeVehicle()], '/vehicles/v1');
    await user.click(screen.getByTestId('vehicle-detail-edit'));
    const input = screen.getByTestId('vehicle-detail-curb');
    await user.clear(input);
    await user.type(input, '4500');
    await user.click(screen.getByTestId('vehicle-detail-save'));
    expect(store.getState().preferences.savedVehicles[0].curbWeightLb).toBe(4500);
    expect(peekToasts()[0].title).toContain('saved');
  });

  it('renders the empty calibrations card when nothing is configured', () => {
    renderDetail([makeVehicle()], '/vehicles/v1');
    expect(screen.getByTestId('vehicle-detail-calibrations-empty')).toBeInTheDocument();
  });

  it('Add first override jumps into edit mode + appends a row', async () => {
    const user = userEvent.setup();
    renderDetail([makeVehicle()], '/vehicles/v1');
    await user.click(screen.getByTestId('vehicle-detail-calibration-first'));
    expect(screen.getByTestId('vehicle-detail-calibration-row-0')).toBeInTheDocument();
  });

  it('Delete vehicle opens the confirm dialog + remove dispatches', async () => {
    const user = userEvent.setup();
    const store = renderDetail([makeVehicle()], '/vehicles/v1');
    await user.click(screen.getByTestId('vehicle-detail-delete'));
    expect(screen.getByTestId('vehicle-detail-delete-dialog')).toBeInTheDocument();
    await user.click(screen.getByTestId('vehicle-detail-delete-dialog-confirm'));
    expect(store.getState().preferences.savedVehicles).toHaveLength(0);
    expect(screen.getByTestId('settings-sentinel')).toBeInTheDocument();
  });

  it('matches a session to this vehicle by VIN', () => {
    renderDetail([makeVehicle()], '/vehicles/v1', [makeSession('s_1')]);
    expect(screen.getByTestId('vehicle-detail-session-row-s_1')).toBeInTheDocument();
  });

  it('clicking a session row navigates to that session', async () => {
    const user = userEvent.setup();
    renderDetail([makeVehicle()], '/vehicles/v1', [makeSession('s_1')]);
    await user.click(screen.getByTestId('vehicle-detail-session-row-s_1'));
    expect(screen.getByTestId('session-sentinel')).toBeInTheDocument();
  });

  it('shows the empty sessions card when no sessions match', () => {
    renderDetail([makeVehicle()], '/vehicles/v1');
    expect(screen.getByTestId('vehicle-detail-sessions-empty')).toBeInTheDocument();
  });

  it('renders the .vprofile filename preview + export button', () => {
    renderDetail([makeVehicle()], '/vehicles/v1');
    expect(screen.getByTestId('vehicle-detail-profile-filename'))
      .toHaveTextContent('2019-mercedes-benz-amg-gt-53.vprofile');
    expect(screen.getByTestId('vehicle-detail-export-button')).toBeInTheDocument();
  });

  it('Back to Settings navigates to the Settings route', async () => {
    const user = userEvent.setup();
    renderDetail([makeVehicle()], '/vehicles/v1');
    await user.click(screen.getByTestId('vehicle-detail-back'));
    expect(screen.getByTestId('settings-sentinel')).toBeInTheDocument();
  });
});
