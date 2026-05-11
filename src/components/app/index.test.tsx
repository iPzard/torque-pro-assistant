import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import store from 'state/store';
import type { ElectronAPI } from 'types/electron-api';

/**
 * Each page is mocked with a sentinel marker so App's routing can be asserted
 * without reaching into the real page implementations. Per the project's
 * architecture rules, a component's test never asserts another component's
 * behavior — composition is verified by mocking the children.
 */
jest.mock('components/pages/library', () => ({
  __esModule: true,
  default: () => <div data-testid="library-route-sentinel" />
}));
jest.mock('components/pages/compare-logs', () => ({
  __esModule: true,
  default: () => <div data-testid="compare-logs-route-sentinel" />
}));
jest.mock('components/pages/import-logs', () => ({
  __esModule: true,
  default: () => <div data-testid="import-logs-route-sentinel" />
}));
jest.mock('components/pages/session-detail', () => ({
  __esModule: true,
  default: () => <div data-testid="session-detail-route-sentinel" />
}));
jest.mock('components/pages/settings', () => ({
  __esModule: true,
  default: () => <div data-testid="settings-route-sentinel" />
}));

/**
 * pingFlask fires inside App's mount effect via utils/requests; mock it out
 * so tests don't trigger fetchWithRetry timers.
 */
jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  pingFlask: jest.fn()
}));

import App from '.';
import { pingFlask } from './utils';

/**
 * Build a stub ElectronAPI bridge. Each test installs one before rendering
 * so window.electronAPI.platform / .minimize / .maximize / .quit are
 * jest.fn instances that can be asserted against.
 */
function makeApi(overrides: Partial<ElectronAPI> = {}): ElectronAPI {
  return {
    getPort: jest.fn(() => 3001),
    maximize: jest.fn(),
    minimize: jest.fn(),
    platform: 'win32',
    quit: jest.fn(),
    unmaximize: jest.fn(),
    ...overrides
  };
}

function renderApp(api: ElectronAPI = makeApi(), initialPath = '/') {
  window.electronAPI = api;
  return render(
    <MantineProvider>
      <Provider store={ store }>
        <MemoryRouter initialEntries={ [initialPath] }>
          <App />
        </MemoryRouter>
      </Provider>
    </MantineProvider>
  );
}

beforeEach(() => {
  (pingFlask as jest.Mock).mockClear();
});

describe('components/app', () => {
  it('renders the app name in the header', () => {
    renderApp();
    expect(screen.getByTestId('app-name')).toBeInTheDocument();
    expect(screen.getByTestId('app-name-pro')).toBeInTheDocument();
    expect(screen.getByTestId('app-name-assistant')).toBeInTheDocument();
  });

  it('default route ("/") renders the Library route', () => {
    renderApp(makeApi(), '/');
    expect(screen.getByTestId('library-route-sentinel')).toBeInTheDocument();
  });

  it('initial path /compare renders the Compare Logs route', () => {
    renderApp(makeApi(), '/compare');
    expect(screen.getByTestId('compare-logs-route-sentinel')).toBeInTheDocument();
  });

  it('initial path /import renders the Import Logs route', () => {
    renderApp(makeApi(), '/import');
    expect(screen.getByTestId('import-logs-route-sentinel')).toBeInTheDocument();
  });

  it('initial path /sessions/:id renders the Session Detail route', () => {
    renderApp(makeApi(), '/sessions/s_1_drive');
    expect(screen.getByTestId('session-detail-route-sentinel')).toBeInTheDocument();
  });

  it('initial path /settings renders the Settings route', () => {
    renderApp(makeApi(), '/settings');
    expect(screen.getByTestId('settings-route-sentinel')).toBeInTheDocument();
  });

  it('sidebar shows the workspace + pinned nav items', () => {
    renderApp();
    expect(screen.getByTestId('app-nav-link-library')).toBeInTheDocument();
    expect(screen.getByTestId('app-nav-link-compare')).toBeInTheDocument();
    expect(screen.getByTestId('app-nav-link-import')).toBeInTheDocument();
    expect(screen.getByTestId('app-nav-link-settings')).toBeInTheDocument();
  });

  it('on Windows the renderer draws min/max/close window controls', () => {
    renderApp(makeApi({ platform: 'win32' }));
    expect(screen.getByTestId('app-window-controls')).toBeInTheDocument();
    expect(screen.getByTestId('app-window-control-minimize')).toBeInTheDocument();
    expect(screen.getByTestId('app-window-control-maximize')).toBeInTheDocument();
    expect(screen.getByTestId('app-window-control-close')).toBeInTheDocument();
  });

  it('on macOS the renderer hides its own window controls (OS draws them)', () => {
    renderApp(makeApi({ platform: 'darwin' }));
    expect(screen.queryByTestId('app-window-controls')).not.toBeInTheDocument();
    expect(screen.queryByTestId('app-window-control-minimize')).not.toBeInTheDocument();
    expect(screen.queryByTestId('app-window-control-maximize')).not.toBeInTheDocument();
    expect(screen.queryByTestId('app-window-control-close')).not.toBeInTheDocument();
  });

  it('window-control buttons fire the matching electronAPI calls', async () => {
    const electronApi = makeApi({ platform: 'win32' });
    renderApp(electronApi);
    const user = userEvent.setup();

    await user.click(screen.getByTestId('app-window-control-minimize'));
    expect(electronApi.minimize).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId('app-window-control-maximize'));
    expect(electronApi.maximize).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId('app-window-control-close'));
    expect(electronApi.quit).toHaveBeenCalledTimes(1);
  });

  it('clicking the Compare nav link navigates to the Compare Logs route', async () => {
    renderApp();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('app-nav-link-compare'));
    expect(screen.getByTestId('compare-logs-route-sentinel')).toBeInTheDocument();
  });

  it('fires pingFlask once on mount', () => {
    renderApp();
    expect(pingFlask).toHaveBeenCalledTimes(1);
  });
});
