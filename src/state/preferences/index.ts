import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * Preferences slice — user-tweakable settings persisted across app
 * launches. Stays separate from the sessions slice so wiping session
 * data via "clear library" doesn't reset the user's color scheme,
 * units mode, etc.
 *
 * Persistence is wired in `state/store/` via `loadPersistedPreferences`
 * and `persistPreferences` — the slice itself stays pure.
 */

/** Mantine color-scheme value. Tracks the visual theme. */
export type ThemePreference = 'dark' | 'light';

/** Density mode — knob for the design's "compact / regular / comfy"
 *  presets that tweak table padding + line-height. Currently only
 *  reads back the value; consumers will adopt it as the screens
 *  pick it up. */
export type DensityPreference = 'comfy' | 'compact' | 'regular';

/** Units mode — drives mph vs kph, °F vs °C, psi vs kPa across the
 *  app. PIDs without a metric companion (`PidEntry.altUnit`) ignore
 *  it. */
export type UnitsPreference = 'imperial' | 'metric';

/** Vehicle defaults — pre-fill the Import flow's details form. */
export interface VehicleDefaults {
  readonly make: string;
  readonly model: string;
  readonly year: number;
}

export interface PreferencesState {
  /** Mantine amber shade index, 1–9. The default `6` matches the
   *  design's brand accent. Lower shades pull the accent lighter. */
  readonly accentShade: number;
  readonly density: DensityPreference;
  readonly theme: ThemePreference;
  readonly units: UnitsPreference;
  readonly vehicleDefaults: VehicleDefaults;
}

export const INITIAL_PREFERENCES: PreferencesState = {
  accentShade:     6,
  density:         'regular',
  theme:           'dark',
  units:           'imperial',
  vehicleDefaults: { make: '', model: '', year: 0 }
};

const preferencesSlice = createSlice({
  initialState: INITIAL_PREFERENCES,
  name:         'preferences',
  reducers:     {
    /** Sets the Mantine amber shade index (1–9). Caller is expected
     *  to clamp; the reducer trusts the input. */
    setAccentShade: (state, action: PayloadAction<number>) => {
      state.accentShade = action.payload;
    },
    setDensity: (state, action: PayloadAction<DensityPreference>) => {
      state.density = action.payload;
    },
    setTheme: (state, action: PayloadAction<ThemePreference>) => {
      state.theme = action.payload;
    },
    setUnits: (state, action: PayloadAction<UnitsPreference>) => {
      state.units = action.payload;
    },
    setVehicleDefaults: (state, action: PayloadAction<VehicleDefaults>) => {
      state.vehicleDefaults = action.payload;
    }
  }
});

export const {
  setAccentShade,
  setDensity,
  setTheme,
  setUnits,
  setVehicleDefaults
} = preferencesSlice.actions;

/** Returns the active preferences. The whole slice is small and
 *  read together by most consumers, so a top-level selector is
 *  fine. */
export const selectPreferences = (state: PreferencesState): PreferencesState => state;

/** Convenience selector for the units mode, the most-used field. */
export const selectUnits = (state: PreferencesState): UnitsPreference => state.units;

export default preferencesSlice.reducer;
