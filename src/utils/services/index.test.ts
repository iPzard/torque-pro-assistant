import type { ElectronAPI } from 'types/electron-api';

type ServicesModule = typeof import('.');

describe('utils/services', () => {
  let electronApi: ElectronAPI;
  let windowControls: ServicesModule['windowControls'];

  beforeEach(() => {
    electronApi = {
      getPort: jest.fn(() => 3001),
      maximize: jest.fn(),
      minimize: jest.fn(),
      platform: 'win32',
      quit: jest.fn(),
      unmaximize: jest.fn()
    };
    window.electronAPI = electronApi;

    jest.isolateModules(() => {
      const servicesModule = jest.requireActual<ServicesModule>('.');
      ({ windowControls } = servicesModule);
    });
  });

  it('maximize calls electronAPI.maximize', () => {
    windowControls.maximize();
    expect(electronApi.maximize).toHaveBeenCalledTimes(1);
  });

  it('minimize calls electronAPI.minimize', () => {
    windowControls.minimize();
    expect(electronApi.minimize).toHaveBeenCalledTimes(1);
  });

  it('quit calls electronAPI.quit', () => {
    windowControls.quit();
    expect(electronApi.quit).toHaveBeenCalledTimes(1);
  });

  it('unmaximize calls electronAPI.unmaximize', () => {
    windowControls.unmaximize();
    expect(electronApi.unmaximize).toHaveBeenCalledTimes(1);
  });
});
