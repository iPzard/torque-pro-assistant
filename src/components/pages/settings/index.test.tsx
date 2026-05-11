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
import type { ElectronAPI } from 'types/electron-api';

import Settings from '.';

const makeSavedVehicle = (overrides: Partial<SavedVehicle> = {}): SavedVehicle => ({
  addedAt: '2024-10-28T13:50:51.000Z',
  id:      'v1',
  make:    'Mercedes-Benz',
  model:   'AMG GT 53',
  vin:     'WDD2J6BB0KA000000',
  year:    2019,
  ...overrides
});

const makeStore = (preferences: PreferencesState = INITIAL_PREFERENCES) => configureStore({
  preloadedState: {
    preferences,
    sessions: { selectedId: null, sessions: [] }
  },
  reducer: {
    preferences: preferencesReducer,
    sessions:    sessionsReducer
  }
});

const openExternalMock = jest.fn();

const ELECTRON_API: ElectronAPI = {
  getPort:      () => 7842,
  maximize:     () => undefined,
  minimize:     () => undefined,
  openExternal: openExternalMock,
  platform:     'darwin',
  quit:         () => undefined,
  unmaximize:   () => undefined
};

function renderSettings(preferences?: PreferencesState) {
  window.electronAPI = ELECTRON_API;
  const store = makeStore(preferences);
  render(
    <Provider store={ store }>
      <MemoryRouter initialEntries={ ['/settings'] }>
        <Routes>
          <Route element={ <Settings /> } path="/settings" />
          <Route element={ <div data-testid="vehicle-setup-route-sentinel" /> } path="/vehicle/setup" />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  return store;
}

describe('pages/settings', () => {
  beforeEach(() => { openExternalMock.mockReset(); });

  it('renders the page wrapper', () => {
    renderSettings();
    expect(screen.getByTestId('settings-page')).toBeInTheDocument();
  });

  it('renders all six sections', () => {
    renderSettings();
    expect(screen.getByTestId('settings-appearance')).toBeInTheDocument();
    expect(screen.getByTestId('settings-units')).toBeInTheDocument();
    expect(screen.getByTestId('settings-vehicles')).toBeInTheDocument();
    expect(screen.getByTestId('settings-data')).toBeInTheDocument();
    expect(screen.getByTestId('settings-network')).toBeInTheDocument();
    expect(screen.getByTestId('settings-about')).toBeInTheDocument();
  });

  it('renders the theme + density + units segmented controls', () => {
    renderSettings();
    expect(screen.getByTestId('settings-theme')).toBeInTheDocument();
    expect(screen.getByTestId('settings-density')).toBeInTheDocument();
    expect(screen.getByTestId('settings-units-toggle')).toBeInTheDocument();
  });

  it('renders five accent swatches', () => {
    renderSettings();
    expect(screen.getByTestId('settings-accent-amber')).toBeInTheDocument();
    expect(screen.getByTestId('settings-accent-orange')).toBeInTheDocument();
    expect(screen.getByTestId('settings-accent-cyan')).toBeInTheDocument();
    expect(screen.getByTestId('settings-accent-green')).toBeInTheDocument();
    expect(screen.getByTestId('settings-accent-violet')).toBeInTheDocument();
  });

  it('clicking an accent swatch dispatches setAccentColor', async () => {
    const user = userEvent.setup();
    const store = renderSettings();
    await user.click(screen.getByTestId('settings-accent-cyan'));
    expect(store.getState().preferences.accentColor).toBe('#6fd3f7');
  });

  it('clicking a theme option dispatches setTheme', async () => {
    const user = userEvent.setup();
    const store = renderSettings();
    await user.click(screen.getByTestId('settings-theme-light'));
    expect(store.getState().preferences.theme).toBe('light');
  });

  it('renders the empty-state when no vehicles are saved', () => {
    renderSettings();
    expect(screen.getByTestId('settings-vehicles-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('settings-vehicles-table')).not.toBeInTheDocument();
  });

  it('renders the vehicles table when at least one is saved', () => {
    renderSettings({
      ...INITIAL_PREFERENCES,
      activeVehicleId: 'v1',
      savedVehicles:   [makeSavedVehicle()]
    });
    expect(screen.getByTestId('settings-vehicles-table')).toBeInTheDocument();
    expect(screen.getByTestId('settings-vehicles-row-v1')).toBeInTheDocument();
  });

  it('renders the active dot + ACTIVE PROFILE label on the active vehicle row', () => {
    renderSettings({
      ...INITIAL_PREFERENCES,
      activeVehicleId: 'v1',
      savedVehicles:   [makeSavedVehicle()]
    });
    expect(screen.getByTestId('settings-vehicles-row-v1-active-dot')).toBeInTheDocument();
  });

  it('clicking Set active on a non-active vehicle dispatches setActiveVehicleId', async () => {
    const user = userEvent.setup();
    const store = renderSettings({
      ...INITIAL_PREFERENCES,
      activeVehicleId: 'v1',
      savedVehicles:   [makeSavedVehicle(), makeSavedVehicle({ id: 'v2', make: 'BMW' })]
    });
    await user.click(screen.getByTestId('settings-vehicles-row-v2-set-active'));
    expect(store.getState().preferences.activeVehicleId).toBe('v2');
  });

  it('clicking delete on a vehicle dispatches removeSavedVehicle', async () => {
    const user = userEvent.setup();
    const store = renderSettings({
      ...INITIAL_PREFERENCES,
      activeVehicleId: 'v1',
      savedVehicles:   [makeSavedVehicle()]
    });
    await user.click(screen.getByTestId('settings-vehicles-row-v1-delete'));
    expect(store.getState().preferences.savedVehicles).toHaveLength(0);
  });

  it('Add vehicle button routes to /vehicle/setup', async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByTestId('settings-vehicles-empty-add-button'));
    expect(screen.getByTestId('vehicle-setup-route-sentinel')).toBeInTheDocument();
  });

  it('renders the network port + upload URL controls', () => {
    renderSettings();
    expect(screen.getByTestId('settings-network-port')).toHaveTextContent(':7842');
    expect(screen.getByTestId('settings-network-upload-url')).toBeInTheDocument();
    expect(screen.getByTestId('settings-network-copy-button')).toBeInTheDocument();
  });

  it('changing the bind address dispatches setBindAddress', async () => {
    const user = userEvent.setup();
    const store = renderSettings();
    await user.selectOptions(screen.getByTestId('settings-network-bind'), '0.0.0.0');
    expect(store.getState().preferences.bindAddress).toBe('0.0.0.0');
  });

  it('clicking Copy flips the button label to Copied briefly', async () => {
    const user = userEvent.setup();
    renderSettings();
    const button = screen.getByTestId('settings-network-copy-button');
    expect(button).toHaveTextContent('Copy');
    await user.click(button);
    expect(button).toHaveTextContent('Copied');
  });

  it('About → Check for updates opens the releases page', async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByTestId('settings-about-check-updates'));
    expect(openExternalMock).toHaveBeenCalledWith('https://github.com/iPzard/torque-pro-assistant/releases');
  });

  it('About → Documentation opens the GitHub Pages docs', async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByTestId('settings-about-docs'));
    expect(openExternalMock).toHaveBeenCalledWith('https://ipzard.github.io/torque-pro-assistant/');
  });

  it('About → Release notes opens the latest-release page', async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByTestId('settings-about-release-notes'));
    expect(openExternalMock).toHaveBeenCalledWith('https://github.com/iPzard/torque-pro-assistant/releases/latest');
  });

  it('About → Source · GitHub opens the repo root', async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByTestId('settings-about-source'));
    expect(openExternalMock).toHaveBeenCalledWith('https://github.com/iPzard/torque-pro-assistant');
  });

  it('About → Report a bug opens the issues page', async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByTestId('settings-about-issues'));
    expect(openExternalMock).toHaveBeenCalledWith('https://github.com/iPzard/torque-pro-assistant/issues');
  });
});
