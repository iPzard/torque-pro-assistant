import { configureStore } from '@reduxjs/toolkit';
import type { Action, ThunkAction } from '@reduxjs/toolkit';

// Empty reducer map for now — slices will be added as features land.
// configureStore requires a non-empty reducer object, so a placeholder
// `app` slice with a single boolean is the smallest legal shape.
const store = configureStore({
  reducer: {
    app: (state: { ready: boolean } = { ready: true }) => state
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action
>;

export default store;
