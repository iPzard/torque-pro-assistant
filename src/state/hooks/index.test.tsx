import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';

import type { RootState } from 'state/store';
import store from 'state/store';

import { useAppDispatch, useAppSelector } from '.';

// useAppSelector / useAppDispatch are typed against the production RootState,
// so the test asserts behaviour against the real store rather than building a
// throwaway one (that would fight the typed shape). The hooks themselves are
// thin wrappers — this test guards that the typed signatures actually call
// through to react-redux.

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={ store }>{ children }</Provider>
);

describe('state/hooks', () => {
  test('useAppSelector reads from the production store with the typed RootState', () => {
    const { result } = renderHook(
      () => useAppSelector((state: RootState) => state.app.ready),
      { wrapper }
    );
    expect(result.current).toBe(true);
  });

  test('useAppDispatch returns the store dispatch function', () => {
    const { result } = renderHook(() => useAppDispatch(), { wrapper });
    expect(typeof result.current).toBe('function');

    // Dispatching an unknown action shouldn't throw and should return the action.
    const action = { type: 'noop/never-handled' };
    expect(result.current(action)).toEqual(action);
  });
});
