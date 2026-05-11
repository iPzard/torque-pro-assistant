import { MantineProvider } from '@mantine/core';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import preferencesReducer, { INITIAL_PREFERENCES, type PreferencesState } from 'state/preferences';
import sessionsReducer from 'state/sessions';
import type { ElectronAPI } from 'types/electron-api';
import type { Session } from 'types/session';

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
 * pingFlask fires inside `useBackendStatus`, which the App shell mounts
 * to drive the offline-banner. Mock the source-of-truth module so the
 * deepest dependency stays under test control regardless of how the
 * call traverses the barrel.
 */
jest.mock('./utils/ping-flask', () => ({
  pingFlask: jest.fn(() => Promise.resolve(true))
}));

import App from '.';
import { pingFlask } from './utils/ping-flask';

/** Build a session shell — most App tests don't care about contents,
 *  only the count for badge / Compare-enabled gating. */
const makeSession = (id: string): Session => ({
  data: [{ rpm: 1500, speed_mph: 30, t: 0, ts: 1000 }],
  meta: {
    duration:  1,
    fileName:  `${ id }.csv`,
    fileSize:  1024,
    gpsStart:  { lat: 0, lon: 0 },
    id,
    name:      id,
    notes:     '',
    startedAt: '2024-10-28T13:50:51.000Z',
    vehicle:   { make: '', model: '', vin: '', year: 0 }
  }
});

/** Build a fresh store per test so sessions / preferences slices stay
 *  isolated. The real `state/store` carries localStorage hydration
 *  side effects we don't want bleeding across tests. */
const makeTestStore = (
  sessions: readonly Session[] = [],
  preferences: PreferencesState = INITIAL_PREFERENCES
) => configureStore({
  preloadedState: {
    preferences,
    sessions: { selectedId: null, sessions }
  },
  reducer: {
    preferences: preferencesReducer,
    sessions:    sessionsReducer
  }
});

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

function renderApp(
  api: ElectronAPI = makeApi(),
  initialPath = '/',
  sessions: readonly Session[] = [],
  preferences: PreferencesState = INITIAL_PREFERENCES
) {
  window.electronAPI = api;
  return render(
    <MantineProvider>
      <Provider store={ makeTestStore(sessions, preferences) }>
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

  it('shows the "No vehicle selected" pill when preferences carry no vehicle', () => {
    renderApp();
    expect(screen.getByTestId('app-connection-pill')).toHaveTextContent('No vehicle selected');
  });

  it('shows the connected pill with vehicle when preferences are populated', () => {
    renderApp(makeApi(), '/', [], {
      ...INITIAL_PREFERENCES,
      vehicleDefaults: { make: 'Ford', model: 'Mustang', year: 2018 }
    });
    expect(screen.getByTestId('app-connection-pill')).toHaveTextContent('Connected · 2018 Ford Mustang');
  });

  it('shows the dashed "Select vehicle…" sidebar entry when no vehicle is configured', () => {
    renderApp();
    expect(screen.getByTestId('app-nav-vehicle-empty')).toBeInTheDocument();
  });

  it('shows the solid vehicle sidebar entry when a vehicle is configured', () => {
    renderApp(makeApi(), '/', [], {
      ...INITIAL_PREFERENCES,
      vehicleDefaults: { make: 'Ford', model: 'Mustang', year: 2018 }
    });
    expect(screen.getByTestId('app-nav-vehicle')).toBeInTheDocument();
  });

  it('shows the empty Recent sessions message when no sessions exist', () => {
    renderApp();
    expect(screen.getByTestId('app-nav-recent-empty')).toBeInTheDocument();
  });

  it('renders a Recent sessions link per session (up to four)', () => {
    renderApp(makeApi(), '/', [makeSession('s_1'), makeSession('s_2')]);
    expect(screen.getByTestId('app-nav-recent-s_1')).toBeInTheDocument();
    expect(screen.getByTestId('app-nav-recent-s_2')).toBeInTheDocument();
    expect(screen.queryByTestId('app-nav-recent-empty')).not.toBeInTheDocument();
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

  it('clicking the Compare nav link navigates to the Compare Logs route when two+ sessions exist', async () => {
    renderApp(makeApi(), '/', [makeSession('s_1'), makeSession('s_2')]);
    const user = userEvent.setup();
    await user.click(screen.getByTestId('app-nav-link-compare'));
    expect(screen.getByTestId('compare-logs-route-sentinel')).toBeInTheDocument();
  });

  it('Compare nav link stays navigable even with zero sessions (lands on picker / empty state)', async () => {
    renderApp();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('app-nav-link-compare'));
    expect(screen.getByTestId('compare-logs-route-sentinel')).toBeInTheDocument();
  });

  it('fires pingFlask once on mount', () => {
    renderApp();
    expect(pingFlask).toHaveBeenCalledTimes(1);
  });

  it('Ctrl+O navigates to the Import Logs route', () => {
    renderApp(makeApi(), '/library');
    fireEvent.keyDown(window, { ctrlKey: true, key: 'o' });
    expect(screen.getByTestId('import-logs-route-sentinel')).toBeInTheDocument();
  });

  it('Cmd+O navigates to the Import Logs route', () => {
    renderApp(makeApi(), '/library');
    fireEvent.keyDown(window, { key: 'o', metaKey: true });
    expect(screen.getByTestId('import-logs-route-sentinel')).toBeInTheDocument();
  });

  it('Ctrl+K opens the command palette modal', () => {
    renderApp(makeApi(), '/library');
    fireEvent.keyDown(window, { ctrlKey: true, key: 'k' });
    expect(screen.getByTestId('app-command-palette')).toBeInTheDocument();
  });
});
