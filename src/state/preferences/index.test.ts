import preferencesReducer, {
  addSavedVehicle,
  INITIAL_PREFERENCES,
  removeSavedVehicle,
  type SavedVehicle,
  selectActiveVehicle,
  setAccentColor,
  setAccentShade,
  setActiveVehicleId,
  setBindAddress,
  setDensity,
  setTheme,
  setUnits,
  setVehicleDefaults
} from '.';

const makeSavedVehicle = (overrides: Partial<SavedVehicle> = {}): SavedVehicle => ({
  addedAt: '2024-10-28T13:50:51.000Z',
  id:      'v1',
  make:    'Mercedes-Benz',
  model:   'AMG GT 53',
  vin:     'WDD2J6BB0KA000000',
  year:    2019,
  ...overrides
});

describe('state/preferences', () => {
  it('seeds with dark theme + imperial + regular density + empty vehicles', () => {
    const state = preferencesReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(INITIAL_PREFERENCES);
    expect(state.theme).toBe('dark');
    expect(state.units).toBe('imperial');
    expect(state.density).toBe('regular');
    expect(state.savedVehicles).toEqual([]);
    expect(state.activeVehicleId).toBeNull();
    expect(state.accentColor).toBe('#ffb020');
    expect(state.bindAddress).toBe('127.0.0.1');
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

  it('setAccentColor replaces the accent color hex', () => {
    const state = preferencesReducer(INITIAL_PREFERENCES, setAccentColor('#6fd3f7'));
    expect(state.accentColor).toBe('#6fd3f7');
  });

  it('setBindAddress replaces the bind address', () => {
    const state = preferencesReducer(INITIAL_PREFERENCES, setBindAddress('0.0.0.0'));
    expect(state.bindAddress).toBe('0.0.0.0');
  });

  it('setVehicleDefaults replaces the vehicle defaults', () => {
    const state = preferencesReducer(
      INITIAL_PREFERENCES,
      setVehicleDefaults({ make: 'Ford', model: 'Mustang', year: 2018 })
    );
    expect(state.vehicleDefaults).toEqual({ make: 'Ford', model: 'Mustang', year: 2018 });
  });

  it('addSavedVehicle appends to an empty list', () => {
    const state = preferencesReducer(INITIAL_PREFERENCES, addSavedVehicle(makeSavedVehicle()));
    expect(state.savedVehicles).toHaveLength(1);
    expect(state.savedVehicles[0].id).toBe('v1');
  });

  it('addSavedVehicle replaces a vehicle with the same id', () => {
    const initial = preferencesReducer(INITIAL_PREFERENCES, addSavedVehicle(makeSavedVehicle()));
    const updated = preferencesReducer(
      initial,
      addSavedVehicle(makeSavedVehicle({ make: 'BMW', model: 'M3' }))
    );
    expect(updated.savedVehicles).toHaveLength(1);
    expect(updated.savedVehicles[0].make).toBe('BMW');
  });

  it('removeSavedVehicle drops the matching id', () => {
    const initial = preferencesReducer(
      INITIAL_PREFERENCES,
      addSavedVehicle(makeSavedVehicle({ id: 'v1' }))
    );
    const removed = preferencesReducer(initial, removeSavedVehicle('v1'));
    expect(removed.savedVehicles).toHaveLength(0);
  });

  it('removeSavedVehicle clears activeVehicleId when removing the active vehicle', () => {
    let state = preferencesReducer(INITIAL_PREFERENCES, addSavedVehicle(makeSavedVehicle({ id: 'v1' })));
    state = preferencesReducer(state, setActiveVehicleId('v1'));
    state = preferencesReducer(state, removeSavedVehicle('v1'));
    expect(state.activeVehicleId).toBeNull();
  });

  it('setActiveVehicleId replaces the active id', () => {
    const state = preferencesReducer(INITIAL_PREFERENCES, setActiveVehicleId('v2'));
    expect(state.activeVehicleId).toBe('v2');
  });

  it('selectActiveVehicle returns null when no active id is set', () => {
    expect(selectActiveVehicle(INITIAL_PREFERENCES)).toBeNull();
  });

  it('selectActiveVehicle returns the matching saved vehicle when one exists', () => {
    let state = preferencesReducer(INITIAL_PREFERENCES, addSavedVehicle(makeSavedVehicle()));
    state = preferencesReducer(state, setActiveVehicleId('v1'));
    expect(selectActiveVehicle(state)?.make).toBe('Mercedes-Benz');
  });

  it('does not mutate the previous state', () => {
    const previous = { ...INITIAL_PREFERENCES };
    preferencesReducer(previous, setTheme('light'));
    expect(previous.theme).toBe('dark');
  });
});
