import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import preferencesReducer, { INITIAL_PREFERENCES, type PreferencesState } from 'state/preferences';

import VehicleSetup from '.';

const makeStore = (preferences: PreferencesState = INITIAL_PREFERENCES) => configureStore({
  preloadedState: { preferences },
  reducer:        { preferences: preferencesReducer }
});

function renderVehicleSetup(preferences?: PreferencesState) {
  const store = makeStore(preferences);
  render(
    <Provider store={ store }>
      <MemoryRouter initialEntries={ ['/vehicle/setup'] }>
        <Routes>
          <Route element={ <VehicleSetup /> } path="/vehicle/setup" />
          <Route element={ <div data-testid="library-route-sentinel" /> } path="/library" />
          <Route element={ <div data-testid="import-route-sentinel" /> } path="/import" />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  return store;
}

describe('pages/vehicle-setup', () => {
  it('renders the page wrapper', () => {
    renderVehicleSetup();
    expect(screen.getByTestId('vehicle-setup-page')).toBeInTheDocument();
  });

  it('renders the title + description', () => {
    renderVehicleSetup();
    expect(screen.getByTestId('vehicle-setup-title')).toHaveTextContent('Tell us about your car');
    expect(screen.getByTestId('vehicle-setup-description')).toBeInTheDocument();
  });

  it('renders Year / Make / Model inputs + VIN input', () => {
    renderVehicleSetup();
    expect(screen.getByTestId('vehicle-setup-year')).toBeInTheDocument();
    expect(screen.getByTestId('vehicle-setup-make')).toBeInTheDocument();
    expect(screen.getByTestId('vehicle-setup-model')).toBeInTheDocument();
    expect(screen.getByTestId('vehicle-setup-vin')).toBeInTheDocument();
  });

  it('disables the model input until a make is picked', () => {
    renderVehicleSetup();
    expect(screen.getByTestId('vehicle-setup-model')).toBeDisabled();
  });

  it('renders the "No saved vehicles yet" dashed empty card', () => {
    renderVehicleSetup();
    expect(screen.getByTestId('vehicle-setup-saved-empty')).toBeInTheDocument();
  });

  it('renders the "No Bluetooth adapter detected" dashed empty card', () => {
    renderVehicleSetup();
    expect(screen.getByTestId('vehicle-setup-bluetooth-empty')).toBeInTheDocument();
  });

  it('keeps the Add vehicle button disabled until Year + Make + Model are set', () => {
    renderVehicleSetup();
    expect(screen.getByTestId('vehicle-setup-submit-button')).toBeDisabled();
  });

  it('submitting dispatches setVehicleDefaults + routes to /import', async () => {
    const store = renderVehicleSetup();
    const user = userEvent.setup();

    await user.selectOptions(screen.getByTestId('vehicle-setup-year'), '2018');
    await user.selectOptions(screen.getByTestId('vehicle-setup-make'), 'Ford');
    await user.type(screen.getByTestId('vehicle-setup-model'), 'Mustang');
    await user.click(screen.getByTestId('vehicle-setup-submit-button'));

    const state = store.getState();
    expect(state.preferences.vehicleDefaults).toEqual({ make: 'Ford', model: 'Mustang', year: 2018 });
    expect(screen.getByTestId('import-route-sentinel')).toBeInTheDocument();
  });

  it('Back button routes to /library', async () => {
    const user = userEvent.setup();
    renderVehicleSetup();
    await user.click(screen.getByTestId('vehicle-setup-back-button'));
    expect(screen.getByTestId('library-route-sentinel')).toBeInTheDocument();
  });
});
