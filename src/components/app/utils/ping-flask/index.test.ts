import type { ElectronAPI } from 'types/electron-api';

// pingFlask delegates to utils/requests#get, which lazy-reads the Flask port
// from window.electronAPI on the first request. The test stubs both the
// bridge and global fetch, then asserts the http call shape.
type PingModule = typeof import('.');

describe('components/app/utils/ping-flask', () => {
  let fetchMock: jest.Mock;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let pingFlask: PingModule['pingFlask'];

  beforeEach(() => {
    const electronApi: ElectronAPI = {
      getPort: jest.fn(() => 3042),
      maximize: jest.fn(),
      minimize: jest.fn(),
      platform: 'win32',
      quit: jest.fn(),
      unmaximize: jest.fn()
    };
    window.electronAPI = electronApi;

    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // isolateModules ensures the cached port inside utils/requests is fresh
    // for each test (the cache lives at module scope).
    jest.isolateModules(() => {
      const pingModule = jest.requireActual<PingModule>('.');
      ({ pingFlask } = pingModule);
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('issues a GET against /ping at the bridge-supplied port', async () => {
    fetchMock.mockResolvedValue({ json: () => Promise.resolve('pong') });
    pingFlask();
    await new Promise<void>((resolve) => { setTimeout(resolve, 0); });
    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:3042/ping');
  });

  it('logs the response on success', async () => {
    fetchMock.mockResolvedValue({ json: () => Promise.resolve('pong') });
    pingFlask();
    await new Promise<void>((resolve) => { setTimeout(resolve, 0); });
    expect(consoleLogSpy).toHaveBeenCalledWith('Flask /ping:', 'pong');
  });

  it('logs to console.error when fetch rejects', async () => {
    const networkError = new Error('refused');
    fetchMock.mockRejectedValue(networkError);
    pingFlask();
    // Wait long enough for fetchWithRetry to give up (6 attempts w/ backoff).
    await new Promise<void>((resolve) => { setTimeout(resolve, 4000); });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Flask /ping failed:', networkError);
  }, 10000);
});
