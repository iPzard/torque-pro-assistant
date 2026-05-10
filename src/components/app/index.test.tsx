import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import type { ElectronAPI } from '../../types/electron-api';
import store from '../../state/store';
import App from '.';

// App reads window.electronAPI inside the component body (not at module
// load), so each render can be exercised against a fresh stub bridge with
// no module-graph juggling.
//
// App also fires a GET /ping on mount via utils/requests. The renderer
// helper retries on connection errors up to 6 times with backoff, which
// would slow tests down without a fetch stub. Mock it once per test so
// the /ping resolves immediately and quietly.

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    json: () => Promise.resolve('pong')
  }) as unknown as typeof fetch;
});

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

describe('components/app', () => {
  test('renders the app name in the header', () => {
    renderApp();
    expect(screen.getByText(/torque/i)).toBeInTheDocument();
    expect(screen.getByText(/Pro/)).toBeInTheDocument();
    expect(screen.getByText(/· Assistant/)).toBeInTheDocument();
  });

  test('default route ("/") redirects to Library', () => {
    renderApp(makeApi(), '/');
    expect(
      screen.getByRole('heading', { level: 2, name: /library/i })
    ).toBeInTheDocument();
  });

  test('sidebar shows the workspace + pinned nav items', () => {
    renderApp();
    expect(screen.getByRole('link', { name: /library/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /compare/i })).toBeInTheDocument();
    // The "Import" sidebar link and the page-level "Import CSV" button
    // both exist on the Library page; either match counts here.
    expect(screen.getAllByRole('link').some((l) => /import$/i.test(l.textContent ?? ''))).toBe(true);
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
    const api = makeApi({ platform: 'win32' });
    renderApp(api);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /minimize/i }));
    expect(api.minimize).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /maximize/i }));
    expect(api.maximize).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(api.quit).toHaveBeenCalledTimes(1);
  });

  test('clicking the Compare nav link routes to the Compare page', async () => {
    renderApp();
    const user = userEvent.setup();
    await user.click(screen.getByRole('link', { name: /compare/i }));
    expect(
      screen.getByRole('heading', { level: 2, name: /compare/i })
    ).toBeInTheDocument();
  });
});
