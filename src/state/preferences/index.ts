import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from 'immer';

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

/** Bind address for the Flask backend that receives Torque Pro's
 *  live web-upload stream (Phase J). Localhost keeps the surface
 *  USB-tether-only; `0.0.0.0` opens the LAN. */
export type BindAddressPreference = '0.0.0.0' | '127.0.0.1';

/** Vehicle defaults — pre-fill the Import flow's details form. Sticks
 *  around as the "active vehicle pointer" until the multi-vehicle
 *  picker on the Settings page becomes the source of truth. */
export interface VehicleDefaults {
  readonly make: string;
  readonly model: string;
  readonly year: number;
}

/** One saved vehicle profile. List of these powers the Settings
 *  "Vehicles" table. `activeVehicleId` picks which one drives the
 *  app's current vehicle context. */
export interface SavedVehicle {
  /** ISO 8601 added-at timestamp. */
  readonly addedAt: string;
  readonly id: string;
  readonly make: string;
  readonly model: string;
  readonly vin: string;
  readonly year: number;
}

export interface PreferencesState {
  /** Hex accent color — overrides Mantine's primary shade for the
   *  design's amber default + the 5-swatch picker on the Settings
   *  page. */
  readonly accentColor: string;
  /** Mantine amber shade index, 1–9. Retained for backward compat;
   *  the Settings page picks color via `accentColor` directly. */
  readonly accentShade: number;
  readonly activeVehicleId: string | null;
  readonly bindAddress: BindAddressPreference;
  readonly density: DensityPreference;
  readonly savedVehicles: readonly SavedVehicle[];
  readonly theme: ThemePreference;
  readonly units: UnitsPreference;
  readonly vehicleDefaults: VehicleDefaults;
}

export const INITIAL_PREFERENCES: PreferencesState = {
  accentColor:     '#ffb020',
  accentShade:     6,
  activeVehicleId: null,
  bindAddress:     '127.0.0.1',
  density:         'regular',
  savedVehicles:   [],
  theme:           'dark',
  units:           'imperial',
  vehicleDefaults: { make: '', model: '', year: 0 }
};

const preferencesSlice = createSlice({
  initialState: INITIAL_PREFERENCES,
  name:         'preferences',
  reducers:     {
    /** Add a vehicle to the saved list. Replaces an entry with the
     *  same id (so the form can be both an add + an edit path). */
    addSavedVehicle: (state, action: PayloadAction<SavedVehicle>) => {
      const next = action.payload as Draft<SavedVehicle>;
      const existingIndex = state.savedVehicles.findIndex(
        (vehicle) => vehicle.id === next.id
      );
      if (existingIndex === -1) {
        state.savedVehicles.push(next);
      } else {
        state.savedVehicles[existingIndex] = next;
      }
    },
    removeSavedVehicle: (state, action: PayloadAction<string>) => {
      const targetId = action.payload;
      state.savedVehicles = state.savedVehicles.filter(
        (vehicle) => vehicle.id !== targetId
      );
      if (state.activeVehicleId === targetId) {
        state.activeVehicleId = null;
      }
    },
    setAccentColor: (state, action: PayloadAction<string>) => {
      state.accentColor = action.payload;
    },
    /** Sets the Mantine amber shade index (1–9). Caller is expected
     *  to clamp; the reducer trusts the input. */
    setAccentShade: (state, action: PayloadAction<number>) => {
      state.accentShade = action.payload;
    },
    setActiveVehicleId: (state, action: PayloadAction<string | null>) => {
      state.activeVehicleId = action.payload;
    },
    setBindAddress: (state, action: PayloadAction<BindAddressPreference>) => {
      state.bindAddress = action.payload;
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
  addSavedVehicle,
  removeSavedVehicle,
  setAccentColor,
  setAccentShade,
  setActiveVehicleId,
  setBindAddress,
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

/** Returns the currently-active SavedVehicle, or `null` when none
 *  is picked. */
export const selectActiveVehicle = (state: PreferencesState): SavedVehicle | null => {
  if (state.activeVehicleId === null) return null;
  return state.savedVehicles.find(
    (vehicle) => vehicle.id === state.activeVehicleId
  ) ?? null;
};

export default preferencesSlice.reducer;
