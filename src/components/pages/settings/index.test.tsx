import { MantineProvider } from '@mantine/core';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';

import preferencesReducer, { INITIAL_PREFERENCES, type PreferencesState } from 'state/preferences';

import Settings from '.';

const makeStore = (preferences: PreferencesState = INITIAL_PREFERENCES) => configureStore({
  preloadedState: { preferences },
  reducer:        { preferences: preferencesReducer }
});

function renderSettings(preferences?: PreferencesState) {
  const store = makeStore(preferences);
  return {
    ...render(
      <Provider store={ store }>
        <MantineProvider>
          <Settings />
        </MantineProvider>
      </Provider>
    ),
    store
  };
}

describe('pages/settings', () => {
  it('renders the page wrapper', () => {
    renderSettings();
    expect(screen.getByTestId('settings-page')).toBeInTheDocument();
  });

  it('renders the appearance card', () => {
    renderSettings();
    expect(screen.getByTestId('settings-appearance')).toBeInTheDocument();
  });

  it('renders the units card', () => {
    renderSettings();
    expect(screen.getByTestId('settings-units')).toBeInTheDocument();
  });

  it('renders the vehicle defaults card', () => {
    renderSettings();
    expect(screen.getByTestId('settings-vehicle')).toBeInTheDocument();
  });

  it('renders the theme toggle pre-populated with the active preference', () => {
    renderSettings({ ...INITIAL_PREFERENCES, theme: 'light' });
    expect(screen.getByTestId('settings-theme')).toBeInTheDocument();
  });

  it('renders the units toggle pre-populated with the active preference', () => {
    renderSettings({ ...INITIAL_PREFERENCES, units: 'metric' });
    expect(screen.getByTestId('settings-units-toggle')).toBeInTheDocument();
  });

  it('renders the vehicle defaults inputs pre-filled from state', () => {
    renderSettings({
      ...INITIAL_PREFERENCES,
      vehicleDefaults: { make: 'Ford', model: 'Mustang', year: 2018 }
    });
    expect(screen.getByTestId('settings-vehicle-make')).toHaveValue('Ford');
    expect(screen.getByTestId('settings-vehicle-model')).toHaveValue('Mustang');
  });
});
