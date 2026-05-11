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

/** Drivetrain layout. Drives wheel-HP → crank-HP conversion + the
 *  weight-shift modelling for 0-60 / quarter-mile estimates. */
export type Drivetrain = 'AWD' | 'FWD' | 'RWD';

/** Transmission code. Maps onto the shift-detection heuristic used
 *  when summarizing an imported session. */
export type Transmission = 'AT8' | 'AT9' | 'CVT' | 'DCT' | 'M6' | 'PDK';

/** Operator used by a calibration override — `actual = sensor (op) amount`. */
export type CalibrationOp = '+' | '-' | '×';

/** One per-PID sensor calibration override. Used by `summarize` to
 *  subtract sensor drift / replacement-part bias from the raw PID
 *  value before deriving session-level metrics. */
export interface VehicleCalibration {
  readonly amount: number;
  readonly label: string;
  readonly note: string;
  readonly op: CalibrationOp;
  readonly pid: string;
  readonly unit: string;
}

/** One saved vehicle profile. List of these powers the Settings
 *  "Vehicles" table + the per-vehicle detail page. `activeVehicleId`
 *  picks which one drives the app's current vehicle context.
 *
 *  Spec fields (curb weight / drivetrain / redline / displacement /
 *  transmission) + the calibration list are optional so existing
 *  persisted state from before handoff-9 hydrates cleanly — the
 *  detail page falls back to sensible placeholders when a field is
 *  absent. */
export interface SavedVehicle {
  /** ISO 8601 added-at timestamp. */
  readonly addedAt: string;
  /** Per-PID calibration overrides applied at session import. */
  readonly calibrations?: readonly VehicleCalibration[];
  /** Curb weight in pounds. Metric display converts on the fly. */
  readonly curbWeightLb?: number;
  /** Engine displacement in liters. */
  readonly displacementL?: number;
  readonly drivetrain?: Drivetrain;
  readonly id: string;
  /** ISO 8601 timestamp of the most recent session imported against
   *  this vehicle. `null` when nothing has been logged yet. */
  readonly lastUsed?: string | null;
  readonly make: string;
  readonly model: string;
  readonly redlineRpm?: number;
  readonly transmission?: Transmission;
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
    },
    /** Replace a vehicle's editable fields (spec + calibrations) in
     *  place. id is taken from the payload; if it doesn't match an
     *  existing entry the action is a no-op. */
    updateSavedVehicle: (state, action: PayloadAction<SavedVehicle>) => {
      const next = action.payload as Draft<SavedVehicle>;
      const existingIndex = state.savedVehicles.findIndex(
        (vehicle) => vehicle.id === next.id
      );
      if (existingIndex !== -1) {
        state.savedVehicles[existingIndex] = next;
      }
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
  setVehicleDefaults,
  updateSavedVehicle
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

/** Returns the saved vehicle matching `id`, or `null` if no match. */
export const selectSavedVehicleById = (
  state: PreferencesState,
  id: string
): SavedVehicle | null => state.savedVehicles.find(
  (vehicle) => vehicle.id === id
) ?? null;

export default preferencesSlice.reducer;
