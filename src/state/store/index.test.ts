import store from '.';

describe('state/store', () => {
  test('configureStore initialises with the placeholder app slice', () => {
    expect(store.getState()).toEqual({ app: { ready: true } });
  });

  test('dispatch is callable and unknown actions leave state untouched', () => {
    const before = store.getState();
    store.dispatch({ type: 'noop/never-handled' });
    expect(store.getState()).toEqual(before);
  });

  test('subscribe + unsubscribe return a teardown function', () => {
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
