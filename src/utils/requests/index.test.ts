import type { ElectronAPI } from '../../types/electron-api';

type RequestsModule = typeof import('.');

describe('utils/requests', () => {
  let getPort: jest.Mock<number, []>;
  let fetchMock: jest.Mock;
  let get: RequestsModule['get'];
  let post: RequestsModule['post'];

  beforeEach(() => {
    getPort = jest.fn<number, []>(() => 3042);
    const api: ElectronAPI = {
      getPort,
      maximize: jest.fn(),
      minimize: jest.fn(),
      platform: 'win32',
      quit: jest.fn(),
      unmaximize: jest.fn()
    };
    window.electronAPI = api;
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    jest.isolateModules(() => {
      const mod = jest.requireActual<RequestsModule>('.');
      ({ get, post } = mod);
    });
  });

  test('does not read electronAPI.getPort until the first request fires', () => {
    expect(getPort).not.toHaveBeenCalled();
  });

  test('reads electronAPI.getPort once on the first request, then caches', async () => {
    fetchMock.mockResolvedValue({ json: () => Promise.resolve({ ok: true }) });
    get('ping', jest.fn());
    get('ping', jest.fn());
    await new Promise<void>((r) => { setTimeout(r, 0); });
    expect(getPort).toHaveBeenCalledTimes(1);
  });

  test('get hits localhost:<port>/<route> and invokes success callback with parsed JSON', async () => {
    fetchMock.mockResolvedValue({ json: () => Promise.resolve({ ok: true }) });
    const cb = jest.fn();

    get('ping', cb);
    await new Promise<void>((r) => { setTimeout(r, 0); });

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:3042/ping');
    expect(cb).toHaveBeenCalledWith({ ok: true });
  });

  test('get invokes errorCallback on fetch failure', async () => {
    const err = new Error('boom');
    fetchMock.mockRejectedValue(err);
    const cb = jest.fn();
    const errCb = jest.fn();

    get('ping', cb, errCb);
    await new Promise<void>((r) => { setTimeout(r, 0); });

    expect(cb).not.toHaveBeenCalled();
    expect(errCb).toHaveBeenCalledWith(err);
  });

  test('post sends body, JSON content-type, and POST method', async () => {
    fetchMock.mockResolvedValue({ json: () => Promise.resolve('done') });
    const cb = jest.fn();
    const body = JSON.stringify({ a: 1 });

    post(body, 'submit', cb);
    await new Promise<void>((r) => { setTimeout(r, 0); });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:3042/submit',
      {
        body,
        headers: { 'Content-type': 'application/json' },
        method: 'POST'
      }
    );
    expect(cb).toHaveBeenCalledWith('done');
  });
});
