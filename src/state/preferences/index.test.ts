import preferencesReducer, {
  INITIAL_PREFERENCES,
  setAccentShade,
  setDensity,
  setTheme,
  setUnits,
  setVehicleDefaults
} from '.';

describe('state/preferences', () => {
  it('seeds with dark theme + imperial + regular density', () => {
    const state = preferencesReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(INITIAL_PREFERENCES);
    expect(state.theme).toBe('dark');
    expect(state.units).toBe('imperial');
    expect(state.density).toBe('regular');
  });

  it('setTheme replaces the theme value', () => {
    const state = preferencesReducer(INITIAL_PREFERENCES, setTheme('light'));
    expect(state.theme).toBe('light');
  });

  it('setDensity replaces the density value', () => {
    const state = preferencesReducer(INITIAL_PREFERENCES, setDensity('compact'));
    expect(state.density).toBe('compact');
  });

  it('setUnits replaces the units value', () => {
    const state = preferencesReducer(INITIAL_PREFERENCES, setUnits('metric'));
    expect(state.units).toBe('metric');
  });

  it('setAccentShade replaces the accent shade', () => {
    const state = preferencesReducer(INITIAL_PREFERENCES, setAccentShade(8));
    expect(state.accentShade).toBe(8);
  });

  it('setVehicleDefaults replaces the vehicle defaults', () => {
    const state = preferencesReducer(
      INITIAL_PREFERENCES,
      setVehicleDefaults({ make: 'Ford', model: 'Mustang', year: 2018 })
    );
    expect(state.vehicleDefaults).toEqual({ make: 'Ford', model: 'Mustang', year: 2018 });
  });

  it('does not mutate the previous state', () => {
    const previous = { ...INITIAL_PREFERENCES };
    preferencesReducer(previous, setTheme('light'));
    expect(previous.theme).toBe('dark');
  });
});
