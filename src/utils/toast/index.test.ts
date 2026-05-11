import toast, { peekToasts, subscribeToToasts, type ToastEntry } from '.';

describe('utils/toast', () => {
  beforeEach(() => {
    toast.clear();
  });

  it('queues a base toast with kind / title / default duration', () => {
    const id = toast({ title: 'Hello' });
    const snapshot = peekToasts();
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0].id).toBe(id);
    expect(snapshot[0].kind).toBe('info');
    expect(snapshot[0].duration).toBe(4000);
    expect(snapshot[0].title).toBe('Hello');
  });

  it('success / info / warning / error shortcuts set kind', () => {
    toast.success('A');
    toast.info('B');
    toast.warning('C');
    toast.error('D');
    const snapshot = peekToasts();
    expect(snapshot.map((entry) => entry.kind)).toEqual(['success', 'info', 'warning', 'error']);
  });

  it('passes subtitle + action + duration through to the entry', () => {
    const onClick = jest.fn();
    toast.success('Saved', {
      action:   { label: 'Undo', onClick },
      duration: 8000,
      subtitle: '2,418 rows'
    });
    const [entry] = peekToasts();
    expect(entry.subtitle).toBe('2,418 rows');
    expect(entry.duration).toBe(8000);
    expect(entry.action?.label).toBe('Undo');
    entry.action?.onClick();
    expect(onClick).toHaveBeenCalled();
  });

  it('dismiss removes the entry by id; unknown ids are no-ops', () => {
    const id = toast.info('first');
    toast.dismiss(id);
    expect(peekToasts()).toHaveLength(0);
    toast.dismiss(9_999_999);
    expect(peekToasts()).toHaveLength(0);
  });

  it('clear drops every queued toast', () => {
    toast.info('a');
    toast.info('b');
    toast.info('c');
    toast.clear();
    expect(peekToasts()).toHaveLength(0);
  });

  it('subscribers receive an initial snapshot + every queue mutation', () => {
    const snapshots: (readonly ToastEntry[])[] = [];
    const unsubscribe = subscribeToToasts((queue) => snapshots.push(queue));
    toast.info('a');
    toast.info('b');
    toast.clear();
    unsubscribe();

    /** Snapshots: initial empty, after a, after b, after clear. */
    expect(snapshots).toHaveLength(4);
    expect(snapshots[0]).toHaveLength(0);
    expect(snapshots[1]).toHaveLength(1);
    expect(snapshots[2]).toHaveLength(2);
    expect(snapshots[3]).toHaveLength(0);
  });

  it('unsubscribed callbacks stop receiving snapshots', () => {
    const subscriber = jest.fn();
    const unsubscribe = subscribeToToasts(subscriber);
    subscriber.mockClear();
    unsubscribe();
    toast.info('after unsubscribe');
    expect(subscriber).not.toHaveBeenCalled();
  });
});
