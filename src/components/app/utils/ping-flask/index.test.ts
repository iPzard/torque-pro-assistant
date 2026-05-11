import type { ElectronAPI } from 'types/electron-api';

/**
 * pingFlask delegates to utils/requests#get, which lazy-reads the Flask port
 * from window.electronAPI on the first request. The test stubs both the
 * bridge and global fetch, then asserts the http call shape.
 */
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
      openExternal: jest.fn(),
      platform: 'win32',
      quit: jest.fn(),
      unmaximize: jest.fn()
    };
    window.electronAPI = electronApi;

    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    /**
     * isolateModules ensures the cached port inside utils/requests is fresh
     * for each test (the cache lives at module scope).
     */
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
    await pingFlask();
    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:3042/ping');
  });

  it('logs the response on success + resolves true', async () => {
    fetchMock.mockResolvedValue({ json: () => Promise.resolve('pong') });
    const result = await pingFlask();
    expect(consoleLogSpy).toHaveBeenCalledWith('Flask /ping:', 'pong');
    expect(result).toBe(true);
  });

  it('logs to console.error + resolves false when fetch rejects', async () => {
    const networkError = new Error('refused');
    fetchMock.mockRejectedValue(networkError);
    const result = await pingFlask();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Flask /ping failed:', networkError);
    expect(result).toBe(false);
  }, 10000);
});
