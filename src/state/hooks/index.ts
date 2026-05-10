// Pre-typed versions of the standard react-redux hooks. Use these throughout
// the app instead of the plain `useDispatch` / `useSelector` so components
// get the full RootState / AppDispatch types without having to repeat the
// cast.
//
// Pattern documented at:
// https://redux.js.org/usage/usage-with-typescript#define-typed-hooks

import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { AppDispatch, RootState } from '../store';

/**
 * Pre-typed `useDispatch` hook bound to the renderer's `AppDispatch`,
 * which includes the thunk middleware extension. Use everywhere instead
 * of importing `useDispatch` from `react-redux` directly.
 */
export const useAppDispatch: () => AppDispatch = useDispatch;

/**
 * Pre-typed `useSelector` hook bound to the renderer's `RootState`. Lets
 * selector callbacks be written as `(state: RootState) => ...` without
 * casting. Use everywhere instead of importing `useSelector` from
 * `react-redux` directly.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
