import type { Action, ThunkAction } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';

/**
 * Root Redux store for the renderer.
 *
 * `configureStore` requires a non-empty reducer object, so this ships with
 * a placeholder `app` slice carrying a single `ready` boolean until real
 * feature slices land (sessions, preferences, etc. — see CLAUDE.md TODO).
 */
const store = configureStore({
  reducer: {
    app: (state: { ready: boolean } = { ready: true }) => state
  }
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
