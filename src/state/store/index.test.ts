import { INITIAL_PREFERENCES } from 'state/preferences';

import store from '.';

describe('state/store', () => {
  it('configureStore initialises with the sessions slice empty + default preferences', () => {
    expect(store.getState()).toEqual({
      preferences: INITIAL_PREFERENCES,
      sessions:    { selectedId: null, sessions: [] }
    });
  });

  it('dispatch is callable and unknown actions leave state untouched', () => {
    const before = store.getState();
    store.dispatch({ type: 'noop/never-handled' });
    expect(store.getState()).toEqual(before);
  });

  it('subscribe + unsubscribe return a teardown function', () => {
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);
    store.dispatch({ type: 'tick' });
    expect(listener).toHaveBeenCalled();

    unsubscribe();
    listener.mockClear();
    store.dispatch({ type: 'tick' });
    expect(listener).not.toHaveBeenCalled();
  });
});
