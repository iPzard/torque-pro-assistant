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
import VehicleDetail from 'components/pages/vehicle-detail';
import VehicleSetup from 'components/pages/vehicle-setup';
import { useAppSelector } from 'state/hooks';
import { selectPreferences, selectUnits } from 'state/preferences';
import { selectAllSessions } from 'state/sessions';
import { adapterPairing, windowControls } from 'utils';

import AdapterPairing from './adapter-pairing';
import CommandPalette from './command-palette';
import { Icons } from './icons';
import OfflineBanner from './offline-banner';
import StatusBar from './status-bar';
import ToastHost from './toast-host';
import { isActive, useApplyPreferences, useBackendStatus } from './utils';

import styles from './index.module.scss';

interface NavItem {
  readonly icon: React.ReactNode;
  readonly kbd?: string;
  readonly label: string;
  readonly path: string;
  readonly testId: string;
}

/**
 * Top sidebar entries — "Workspace" group. Adding a route is a one-edit
 * change here plus a matching <Route> below.
 */
const TOP_NAV: readonly NavItem[] = [
  { icon: Icons.library,     label: 'Library', path: '/library', testId: 'app-nav-link-library' },
  { icon: Icons.compare,     label: 'Compare', path: '/compare', testId: 'app-nav-link-compare' },
  { icon: Icons.importArrow, kbd: '⌘O',        label: 'Import',  path: '/import',  testId: 'app-nav-link-import' }
];

/**
 * Root shell of the renderer. Matches the design handoff's `app-shell`
 * grid (220px sidebar, 44px titlebar, padded main, 24px status bar).
 *
 * Adapts to first-run state — when sessions / vehicle aren't yet set,
 * the sidebar nav items show badges / disabled states / dashed
 * "Select vehicle…" affordance per the design's brand-new layout.
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
  const preferences = useAppSelector((state) => selectPreferences(state.preferences));
  const sessions = useAppSelector((state) => selectAllSessions(state.sessions));
  const [paletteOpened, setPaletteOpened] = useState(false);
  const backendStatus = useBackendStatus();
  useApplyPreferences();
  const bannerVisible = backendStatus.offline && !backendStatus.dismissed;

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

  const vehicleConfigured = preferences.vehicleDefaults.make !== ''
    || preferences.vehicleDefaults.model !== '';
  const vehicleLabel = vehicleConfigured
    ? [
      preferences.vehicleDefaults.year === 0 ? '' : String(preferences.vehicleDefaults.year),
      preferences.vehicleDefaults.make,
      preferences.vehicleDefaults.model
    ].filter((part) => part !== '').join(' ')
    : '';

  /**
   * Compare nav is always navigable — when fewer than two sessions
   * exist, the page renders the picker or the zero-imported empty
   * state instead. Badge shows the count once at least two sessions
   * are imported; an em-dash before then.
   */
  const compareReady = sessions.length >= 2;

  const navBadge = (item: NavItem): React.ReactNode => {
    if (item.path === '/library') {
      return <span className={ styles['nav-badge'] }>{ sessions.length }</span>;
    }
    if (item.path === '/compare') {
      return <span className={ styles['nav-badge'] }>{ compareReady ? sessions.length : '—' }</span>;
    }
    return null;
  };

  const navItemClass = (active: boolean): string =>
    active ? styles['nav-item-active'] : styles['nav-item'];

  return (
    <div
      className={ bannerVisible ? styles['app-shell-with-banner'] : styles['app-shell'] }
      data-testid="app-shell"
    >
      {/* ── Backend offline banner (28px row above the titlebar) ── */}
      { bannerVisible && (
        <OfflineBanner
          attempts={ backendStatus.attempts }
          onDismiss={ backendStatus.dismiss }
          onRetry={ backendStatus.retry }
          testId="app-offline-banner"
        />
      ) }

      {/* ── Titlebar ── */}
      <div
        className={ styles['app-titlebar'] }
        data-testid="app-header"
        style={ isMac ? { paddingLeft: 86 } : undefined }
      >
        <span className={ styles['tb-app-name'] } data-testid="app-name">
          Torque
          <span className={ styles['tb-app-name-accent'] } data-testid="app-name-pro">Pro</span>
          <span className="dim" data-testid="app-name-assistant"> · Assistant</span>
        </span>
        <span className="dim mono" data-testid="app-version" style={ { fontSize: 11, marginLeft: 6 } }>v0.4.2</span>
        <div className={ styles['tb-spacer'] } />
        { vehicleConfigured
          ? (
            <span className="pill" data-testid="app-connection-pill">
              <i className="dot ok" />
              Connected · { vehicleLabel }
            </span>
          )
          : (
            <button
              className="pill warn"
              data-testid="app-connection-pill"
              onClick={ () => adapterPairing() }
              style={ { cursor: 'pointer', font: 'inherit' } }
              type="button"
            >
              <i className="dot" />
              No vehicle selected · Connect adapter
            </button>
          ) }
        <span className="pill mono" data-testid="app-rows-indexed">
          { totalRows.toLocaleString() } rows{ totalRows === 0 ? '' : ' indexed' }
        </span>
        <span className="kbd" data-testid="app-command-hint">{ '⌘K' }</span>

        { !isMac && (
          <span className={ styles['window-controls'] } data-testid="app-window-controls">
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
      <nav className={ styles['app-nav'] } data-testid="app-navbar">
        <div
          className={ styles['nav-group-label'] }
          data-testid="app-nav-workspace-label"
        >
          Workspace
        </div>
        { TOP_NAV.map((navItem) => {
          const className = navItemClass(isActive(location.pathname, navItem.path));
          return (
            <Link
              key={ navItem.path }
              className={ className }
              data-testid={ navItem.testId }
              to={ navItem.path }
            >
              <span className={ styles['nav-ico'] }>{ navItem.icon }</span>
              <span>{ navItem.label }</span>
              { navBadge(navItem) }
              { navItem.kbd !== undefined && <span className="kbd">{ navItem.kbd }</span> }
            </Link>
          );
        }) }

        <div
          className={ styles['nav-group-label'] }
          data-testid="app-nav-recent-label"
        >
          Recent sessions
        </div>
        { recentSessions.length === 0
          ? (
            <div
              className="dim"
              data-testid="app-nav-recent-empty"
              style={ {
                fontSize:   11,
                fontStyle:  'italic',
                lineHeight: 1.5,
                padding:    '6px 12px 4px'
              } }
            >
              No sessions yet.{ ' ' }
              <Link data-testid="app-nav-recent-empty-import" style={ { color: 'var(--text-1)' } } to="/import">
                Import one
              </Link>
              { ' ' }to get started.
            </div>
          )
          : recentSessions.map((session) => (
            <Link
              key={ session.meta.id }
              className={ navItemClass(location.pathname === `/sessions/${ session.meta.id }`) }
              data-testid={ `app-nav-recent-${ session.meta.id }` }
              to={ `/sessions/${ session.meta.id }` }
            >
              <span className={ `${ styles['nav-ico'] } dim` }>{ Icons.session }</span>
              <span style={ { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }>
                { session.meta.name }
              </span>
              <span className={ `${ styles['nav-badge'] } mono` }>
                { new Date(session.meta.startedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'numeric' }) }
              </span>
            </Link>
          )) }

        <div style={ { flex: 1 } } />

        <div className={ styles['nav-group-label'] }>Vehicle</div>
        { vehicleConfigured
          ? (
            <Link
              className={ styles['nav-item'] }
              data-testid="app-nav-vehicle"
              to={ preferences.activeVehicleId === null ? '/vehicle/setup' : `/vehicles/${ preferences.activeVehicleId }` }
            >
              <span className={ styles['nav-ico'] } style={ { color: 'var(--accent)' } }>
                { Icons.vehicle }
              </span>
              <span
                style={ {
                  flex:         1,
                  fontSize:     12,
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace:   'nowrap'
                } }
                title={ vehicleLabel }
              >
                { vehicleLabel }
              </span>
              { Icons.chevDown }
            </Link>
          )
          : (
            <Link
              className={ styles['nav-item'] }
              data-testid="app-nav-vehicle-empty"
              to="/vehicle/setup"
            >
              <span
                className={ styles['nav-ico'] }
                style={ {
                  alignItems:     'center',
                  border:         '1px dashed var(--border-strong)',
                  borderRadius:   50,
                  color:          'var(--text-3)',
                  display:        'inline-flex',
                  height:         18,
                  justifyContent: 'center',
                  width:          18
                } }
              >
                { Icons.plus }
              </span>
              <span style={ { color: 'var(--text-2)', flex: 1, fontSize: 12, fontStyle: 'italic' } }>
                Select vehicle…
              </span>
            </Link>
          ) }

        <Link
          className={ navItemClass(isActive(location.pathname, '/settings')) }
          data-testid="app-nav-link-settings"
          to="/settings"
        >
          <span className={ styles['nav-ico'] }>{ Icons.settings }</span>
          <span>Settings</span>
          <span className="kbd">{ '⌘,' }</span>
        </Link>
      </nav>

      {/* ── Main + Status bar ── */}
      <div className={ styles['app-main'] } data-testid="app-main">
        <div className={ styles['app-main-scroll'] } data-testid="app-main-scroll">
          <Routes>
            <Route element={ <Navigate replace to="/library" /> } path="/" />
            <Route element={ <Library /> } path="/library" />
            <Route element={ <SessionDetail /> } path="/sessions/:id" />
            <Route element={ <CompareLogs /> } path="/compare" />
            <Route element={ <ImportLogs /> } path="/import" />
            <Route element={ <Settings /> } path="/settings" />
            <Route element={ <VehicleSetup /> } path="/vehicle/setup" />
            <Route element={ <VehicleDetail /> } path="/vehicles/:id" />
          </Routes>
        </div>

        <StatusBar testId="app-status-bar" units={ units } />

        <ToastHost testId="app-toast-host" />
      </div>

      <CommandPalette
        onClose={ () => setPaletteOpened(false) }
        opened={ paletteOpened }
        testId="app-command-palette"
      />

      <AdapterPairing testId="app-adapter-pairing" />
    </div>
  );
}

export default App;
