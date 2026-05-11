import adapterPairing, {
  peekAdapterPairing,
  subscribeToAdapterPairing
} from '.';

describe('utils/adapter-pairing', () => {
  beforeEach(() => { adapterPairing.close(); });

  it('opens with a default stage of "scan" + a fresh instance id', () => {
    const instance = adapterPairing();
    const state = peekAdapterPairing();
    expect(state?.stage).toBe('scan');
    expect(state?.instance).toBe(instance);
  });

  it('passes a custom stage through to the snapshot', () => {
    adapterPairing('probe');
    expect(peekAdapterPairing()?.stage).toBe('probe');
  });

  it('increments the instance id on every open', () => {
    const first = adapterPairing();
    const second = adapterPairing();
    expect(second).toBeGreaterThan(first);
  });

  it('close() clears the snapshot to null', () => {
    adapterPairing();
    adapterPairing.close();
    expect(peekAdapterPairing()).toBeNull();
  });

  it('subscribers receive the initial snapshot + every mutation', () => {
    const snapshots: ReturnType<typeof peekAdapterPairing>[] = [];
    const unsubscribe = subscribeToAdapterPairing((state) => snapshots.push(state));
    adapterPairing('pair');
    adapterPairing.close();
    unsubscribe();

    /** Snapshots: initial null, after open, after close. */
    expect(snapshots).toHaveLength(3);
    expect(snapshots[0]).toBeNull();
    expect(snapshots[1]?.stage).toBe('pair');
    expect(snapshots[2]).toBeNull();
  });

  it('unsubscribed callbacks stop receiving events', () => {
    const subscriber = jest.fn();
    const unsubscribe = subscribeToAdapterPairing(subscriber);
    subscriber.mockClear();
    unsubscribe();
    adapterPairing();
    expect(subscriber).not.toHaveBeenCalled();
  });
});
