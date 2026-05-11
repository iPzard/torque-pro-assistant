import { ActionIcon } from '@mantine/core';
import { useEffect, useState } from 'react';
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate
} from 'react-router-dom';

import CompareLogs from 'components/pages/compare-logs';
import ImportLogs from 'components/pages/import-logs';
import Library from 'components/pages/library';
import SessionDetail from 'components/pages/session-detail';
import Settings from 'components/pages/settings';
import { useAppSelector } from 'state/hooks';
import { selectUnits } from 'state/preferences';
import { selectAllSessions } from 'state/sessions';
import { windowControls } from 'utils';

import CommandPalette from './command-palette';
import { Icons } from './icons';
import StatusBar from './status-bar';
import { isActive, pingFlask } from './utils';

import styles from './index.module.scss';

/**
 * Top sidebar entries — "Workspace" group. Adding a route is a one-edit
 * change here plus a matching <Route> below.
 */
const TOP_NAV = [
  { icon: Icons.library, kbd: undefined,    label: 'Library', path: '/library', testId: 'app-nav-link-library' },
  { icon: Icons.compare, kbd: undefined,    label: 'Compare', path: '/compare', testId: 'app-nav-link-compare' },
  { icon: Icons.importArrow, kbd: '⌘O', label: 'Import',  path: '/import',  testId: 'app-nav-link-import' }
] as const;

/**
 * Root shell of the renderer. Matches the design handoff's `app-shell`
 * grid (220px sidebar, 44px titlebar, padded main, 24px status bar).
 *
 * Branches the window-chrome on platform — macOS lets the OS draw
 * traffic lights via `titleBarStyle: 'hiddenInset'` (configured in
 * main.ts), Windows / Linux render Mantine `ActionIcon` min/max/close
 * controls on the right.
 *
 * Fires a one-shot `pingFlask` on mount + listens for the global
 * `⌘O` / `⌘K` shortcuts.
 *
 * @returns The full app shell React element.
 */
function App() {
  /**
   * preload freezes process.platform at bridge-creation time, so reading
   * it inside the component is a constant for the lifetime of the window.
   * Inlined here (not at module scope) so tests can swap window.electronAPI
   * between renders without juggling isolateModules.
   */
  const isMac = window.electronAPI.platform === 'darwin';
  const location = useLocation();
  const navigate = useNavigate();
  const units = useAppSelector((state) => selectUnits(state.preferences));
  const sessions = useAppSelector((state) => selectAllSessions(state.sessions));
  const [paletteOpened, setPaletteOpened] = useState(false);

  useEffect(() => {
    pingFlask();
  }, []);

  /**
   * Global keyboard shortcuts (CLAUDE.md TODO §27):
   *   - `⌘O` / `Ctrl+O` → Import page.
   *   - `⌘K` / `Ctrl+K` → command palette modal (placeholder until
   *     the fuzzy-search lands).
   *
   * Both call `preventDefault` so the browser / Electron host don't
   * fall through to the native Open File dialog / search.
   */
  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      const modKey = event.metaKey || event.ctrlKey;
      if (!modKey) return;
      const key = event.key.toLowerCase();
      if (key === 'o') {
        event.preventDefault();
        navigate('/import');
      } else if (key === 'k') {
        event.preventDefault();
        setPaletteOpened(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  const totalRows = sessions.reduce((sum, session) => sum + session.data.length, 0);
  const recentSessions = [...sessions]
    .sort((sessionA, sessionB) => sessionB.meta.startedAt.localeCompare(sessionA.meta.startedAt))
    .slice(0, 4);

  return (
    <div className="app-shell" data-testid="app-shell">
      {/* ── Titlebar ── */}
      <div className="app-titlebar" data-testid="app-header" style={ isMac ? { paddingLeft: 86 } : undefined }>
        <span className="tb-app-name" data-testid="app-name">
          Torque<span className="accent" data-testid="app-name-pro">Pro</span>
          <span className="dim" data-testid="app-name-assistant"> · Assistant</span>
        </span>
        <span className="dim mono" data-testid="app-version" style={ { fontSize: 11, marginLeft: 6 } }>v0.4.2</span>
        <div className="tb-spacer" />
        <span className="pill" data-testid="app-connection-pill">
          <i className="dot ok" />
          Connected
        </span>
        { totalRows > 0 && (
          <span className="pill mono" data-testid="app-rows-indexed">
            { totalRows.toLocaleString() } rows indexed
          </span>
        ) }
        <span className="kbd" data-testid="app-command-hint">{ '⌘K' }</span>

        { !isMac && (
          <span className={ styles.windowControls } data-testid="app-window-controls">
            <ActionIcon
              aria-label="Minimize"
              color="gray"
              data-testid="app-window-control-minimize"
              onClick={ windowControls.minimize }
              size="sm"
              variant="subtle"
            >
              <span aria-hidden style={ { borderTop: '1px solid currentColor', width: 10 } } />
            </ActionIcon>
            <ActionIcon
              aria-label="Maximize"
              color="gray"
              data-testid="app-window-control-maximize"
              onClick={ windowControls.maximize }
              size="sm"
              variant="subtle"
            >
              <span aria-hidden style={ { border: '1px solid currentColor', height: 10, width: 10 } } />
            </ActionIcon>
            <ActionIcon
              aria-label="Close"
              color="red"
              data-testid="app-window-control-close"
              onClick={ windowControls.quit }
              size="sm"
              variant="subtle"
            >
              <span aria-hidden>{ '✕' }</span>
            </ActionIcon>
          </span>
        ) }
      </div>

      {/* ── Sidebar ── */}
      <nav className="app-nav" data-testid="app-navbar">
        <div className="nav-group-label" data-testid="app-nav-workspace-label">Workspace</div>
        { TOP_NAV.map((navItem) => (
          <Link
            key={ navItem.path }
            className={ `nav-item${ isActive(location.pathname, navItem.path) ? ' active' : '' }` }
            data-testid={ navItem.testId }
            to={ navItem.path }
          >
            <span className="ico">{ navItem.icon }</span>
            <span>{ navItem.label }</span>
            { navItem.kbd !== undefined && <span className="kbd">{ navItem.kbd }</span> }
          </Link>
        )) }

        { recentSessions.length > 0 && (
          <>
            <div className="nav-group-label" data-testid="app-nav-recent-label">Recent sessions</div>
            { recentSessions.map((session) => (
              <Link
                key={ session.meta.id }
                className={ `nav-item${ location.pathname === `/sessions/${ session.meta.id }` ? ' active' : '' }` }
                data-testid={ `app-nav-recent-${ session.meta.id }` }
                to={ `/sessions/${ session.meta.id }` }
              >
                <span className="ico dim">{ Icons.session }</span>
                <span style={ { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }>
                  { session.meta.name }
                </span>
                <span className="badge mono">
                  { new Date(session.meta.startedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'numeric' }) }
                </span>
              </Link>
            )) }
          </>
        ) }

        <div style={ { flex: 1 } } />

        <div className="nav-group-label">Vehicle</div>
        <div className="nav-item" data-testid="app-nav-vehicle">
          <span className="ico" style={ { color: 'var(--accent)' } }>{ Icons.vehicle }</span>
          <span style={ { flex: 1, fontSize: 12 } }>2019 Mercedes-Benz AMG GT 53</span>
          { Icons.chevDown }
        </div>

        <Link
          className={ `nav-item${ isActive(location.pathname, '/settings') ? ' active' : '' }` }
          data-testid="app-nav-link-settings"
          to="/settings"
        >
          <span className="ico">{ Icons.settings }</span>
          <span>Settings</span>
          <span className="kbd">{ '⌘,' }</span>
        </Link>
      </nav>

      {/* ── Main + Status bar ── */}
      <div className="app-main" data-testid="app-main">
        <Routes>
          <Route element={ <Navigate replace to="/library" /> } path="/" />
          <Route element={ <Library /> } path="/library" />
          <Route element={ <SessionDetail /> } path="/sessions/:id" />
          <Route element={ <CompareLogs /> } path="/compare" />
          <Route element={ <ImportLogs /> } path="/import" />
          <Route element={ <Settings /> } path="/settings" />
        </Routes>

        <StatusBar testId="app-status-bar" units={ units } />
      </div>

      <CommandPalette
        onClose={ () => setPaletteOpened(false) }
        opened={ paletteOpened }
        testId="app-command-palette"
      />
    </div>
  );
}

export default App;
