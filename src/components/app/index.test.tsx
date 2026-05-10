import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import type { ElectronAPI } from '../../types/electron-api';
import store from '../../state/store';

// Each page is mocked with a sentinel marker so App's routing can be asserted
// without reaching into the real page implementations. Per the project's
// architecture rules, a component's test never asserts another component's
// behaviour — composition is verified by mocking the children.
jest.mock('../pages/library', () => ({
  __esModule: true,
  default: () => <div data-testid="library-route" />
}));
jest.mock('../pages/compare', () => ({
  __esModule: true,
  default: () => <div data-testid="compare-route" />
}));
jest.mock('../pages/import', () => ({
  __esModule: true,
  default: () => <div data-testid="import-route" />
}));
jest.mock('../pages/settings', () => ({
  __esModule: true,
  default: () => <div data-testid="settings-route" />
}));

// pingFlask fires inside App's mount effect via utils/requests; mock it out
// so tests don't trigger fetchWithRetry timers.
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
  test('renders the app name in the header', () => {
    renderApp();
    expect(screen.getByText(/torque/i)).toBeInTheDocument();
    expect(screen.getByText(/Pro/)).toBeInTheDocument();
    expect(screen.getByText(/· Assistant/)).toBeInTheDocument();
  });

  test('default route ("/") renders the Library route', () => {
    renderApp(makeApi(), '/');
    expect(screen.getByTestId('library-route')).toBeInTheDocument();
  });

  test('initial path /compare renders the Compare route', () => {
    renderApp(makeApi(), '/compare');
    expect(screen.getByTestId('compare-route')).toBeInTheDocument();
  });

  test('initial path /import renders the Import route', () => {
    renderApp(makeApi(), '/import');
    expect(screen.getByTestId('import-route')).toBeInTheDocument();
  });

  test('initial path /settings renders the Settings route', () => {
    renderApp(makeApi(), '/settings');
    expect(screen.getByTestId('settings-route')).toBeInTheDocument();
  });

  test('sidebar shows the workspace + pinned nav items', () => {
    renderApp();
    expect(screen.getByRole('link', { name: /library/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /compare/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /import/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
  });

  test('on Windows the renderer draws min/max/close window controls', () => {
    renderApp(makeApi({ platform: 'win32' }));
    expect(screen.getByRole('button', { name: /minimize/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /maximize/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  test('on macOS the renderer hides its own window controls (OS draws them)', () => {
    renderApp(makeApi({ platform: 'darwin' }));
    expect(screen.queryByRole('button', { name: /minimize/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /maximize/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  test('window-control buttons fire the matching electronAPI calls', async () => {
    const electronApi = makeApi({ platform: 'win32' });
    renderApp(electronApi);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /minimize/i }));
    expect(electronApi.minimize).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /maximize/i }));
    expect(electronApi.maximize).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(electronApi.quit).toHaveBeenCalledTimes(1);
  });

  test('clicking the Compare nav link navigates to the Compare route', async () => {
    renderApp();
    const user = userEvent.setup();
    await user.click(screen.getByRole('link', { name: /compare/i }));
    expect(screen.getByTestId('compare-route')).toBeInTheDocument();
  });

  test('fires pingFlask once on mount', () => {
    renderApp();
    expect(pingFlask).toHaveBeenCalledTimes(1);
  });
});
