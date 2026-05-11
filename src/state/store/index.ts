import type { Action, ThunkAction } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';

import preferencesReducer, { INITIAL_PREFERENCES, type PreferencesState } from 'state/preferences';
import sessionsReducer, { type SessionsState } from 'state/sessions';

/** Initial sessions slice state. Mirrors what the slice itself uses
 *  internally; duplicated here so the store can hand a fully-formed
 *  preloadedState to `configureStore` even when nothing's persisted. */
const INITIAL_SESSIONS: SessionsState = { selectedId: null, sessions: [] };

/**
 * Root Redux store for the renderer.
 *
 * Feature slices:
 *   - `sessions`    — imported sessions + the currently-selected id.
 *   - `preferences` — user-tweakable settings (theme, density, units,
 *     accent shade, vehicle defaults).
 *
 * Both slices persist to `localStorage` — hydrated as `preloadedState`
 * on construction, written via a `subscribe` listener after every
 * dispatch.
 *
 * `try` / `catch` wrap both ends of the persistence path so private-
 * mode windows, quota-exceeded errors, or corrupted entries fail
 * silently instead of crashing the app on boot.
 */

/** localStorage key for the persisted sessions slice. Versioned so future
 *  shape migrations can drop incompatible old entries cleanly. */
const SESSIONS_PERSIST_KEY = 'torque-pro-assistant.sessions.v1';

/** localStorage key for the persisted preferences slice. */
const PREFERENCES_PERSIST_KEY = 'torque-pro-assistant.preferences.v1';

/**
 * Reads the sessions slice from localStorage. Returns `undefined` when
 * nothing's stored, the entry can't be parsed, or the structural shape
 * doesn't match. The caller hands the result to `configureStore` as
 * `preloadedState.sessions`.
 */
const loadPersistedSessions = (): SessionsState | undefined => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return undefined;
  }
  try {
    const raw = window.localStorage.getItem(SESSIONS_PERSIST_KEY);
    if (raw === null) return undefined;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed !== null
      && typeof parsed === 'object'
      && 'sessions' in parsed
      && Array.isArray((parsed as SessionsState).sessions)
    ) {
      return parsed as SessionsState;
    }
    return undefined;
  } catch {
    return undefined;
  }
};

/** Writes the sessions slice to localStorage. Silent on failure. */
const persistSessions = (state: SessionsState): void => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(SESSIONS_PERSIST_KEY, JSON.stringify(state));
  } catch {
    // disk full / private window / quota exceeded — silent
  }
};

/**
 * Reads the preferences slice from localStorage. Falls back to the
 * baked-in defaults on missing / malformed entries — preferences are
 * additive over time, so a corrupted entry shouldn't wipe out the
 * user's other settings either.
 */
const loadPersistedPreferences = (): PreferencesState | undefined => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return undefined;
  }
  try {
    const raw = window.localStorage.getItem(PREFERENCES_PERSIST_KEY);
    if (raw === null) return undefined;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed !== null && typeof parsed === 'object') {
      return { ...INITIAL_PREFERENCES, ...(parsed as Partial<PreferencesState>) };
    }
    return undefined;
  } catch {
    return undefined;
  }
};

/** Writes the preferences slice to localStorage. Silent on failure. */
const persistPreferences = (state: PreferencesState): void => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(PREFERENCES_PERSIST_KEY, JSON.stringify(state));
  } catch {
    // disk full / private window / quota exceeded — silent
  }
};

const store = configureStore({
  preloadedState: {
    preferences: loadPersistedPreferences() ?? INITIAL_PREFERENCES,
    sessions:    loadPersistedSessions() ?? INITIAL_SESSIONS
  },
  reducer: {
    preferences: preferencesReducer,
    sessions:    sessionsReducer
  }
});

/**
 * Persist on every state change. Cheap for the volume of dispatches this
 * app produces (one per import / delete / select / preference tweak);
 * no debounce needed.
 */
store.subscribe(() => {
  const state = store.getState();
  persistSessions(state.sessions);
  persistPreferences(state.preferences);
});

/**
 * Inferred shape of the entire Redux state tree. Use as the `state` type
 * in selectors instead of writing the shape by hand so adding a slice
 * doesn't fan out to every selector.
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * Inferred type of the store's `dispatch` function, including the thunk
 * extension wired by Redux Toolkit by default.
 */
export type AppDispatch = typeof store.dispatch;

/**
 * Convenience alias for thunk action creators. Use as
 * `(): AppThunk => (dispatch, getState) => { ... }`.
 *
 * @typeParam ReturnedValue - Value resolved by the thunk's async work.
 */
export type AppThunk<ReturnedValue = void> = ThunkAction<
  ReturnedValue,
  RootState,
  unknown,
  Action
>;

export default store;
