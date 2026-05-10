import {
  ActionIcon,
  AppShell,
  Group,
  NavLink,
  Stack,
  Text,
  Title
} from '@mantine/core';
import { useEffect } from 'react';
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation
} from 'react-router-dom';

import CompareLogs from 'components/pages/compare-logs';
import ImportLogs from 'components/pages/import-logs';
import Library from 'components/pages/library';
import Settings from 'components/pages/settings';
import { windowControls } from 'utils';

import { isActive, pingFlask } from './utils';

import styles from './index.module.scss';

/**
 * Single source of truth for sidebar entries. Top group renders inside the
 * "Workspace" label; bottom group is pinned to the floor. Adding a route is
 * a one-edit change against TOP_NAV / BOTTOM_NAV plus a matching <Route>.
 */
const TOP_NAV = [
  { label: 'Library', path: '/library', testId: 'app-nav-link-library' },
  { label: 'Compare', path: '/compare', testId: 'app-nav-link-compare' },
  { label: 'Import',  path: '/import',  testId: 'app-nav-link-import' }
] as const;

const BOTTOM_NAV = [
  { label: 'Settings', path: '/settings', testId: 'app-nav-link-settings' }
] as const;

/**
 * Root shell of the renderer. Owns the Mantine `AppShell` (44px header,
 * 220px navbar, padded main) and the route switch for the placeholder
 * pages. Branches the window-chrome on platform — macOS lets the OS draw
 * traffic lights via `titleBarStyle: 'hiddenInset'` (configured in
 * main.ts), Windows / Linux render Mantine `ActionIcon` min/max/close
 * controls on the right.
 *
 * Fires a one-shot `pingFlask` on mount to confirm the Electron ↔ Flask
 * bridge is alive before any feature work hits the backend.
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

  useEffect(() => {
    pingFlask();
  }, []);

  return (
    <AppShell
      header={ { height: 44 } }
      navbar={ { breakpoint: 'sm', width: 220 } }
      padding="md"
    >
      <AppShell.Header className={ styles.header } data-testid="app-header">
        {/* macOS reserves ~70px on the left for native traffic lights (inset
            by trafficLightPosition in main.ts), so pl jumps to 86 there. */}
        <Group
          gap="sm"
          h="100%"
          justify="space-between"
          pl={ isMac ? 86 : 'md' }
          pr="md"
          wrap="nowrap"
        >
          <Title className={ styles.appName } data-testid="app-name" fw={ 600 } order={ 5 }>
            Torque
            <Text c="amber.6" data-testid="app-name-pro" fw={ 600 } inherit span>Pro</Text>
            <Text c="dimmed" data-testid="app-name-assistant" fw={ 500 } inherit span>
              { ' · Assistant' }
            </Text>
          </Title>

          { !isMac && (
            <Group className={ styles.windowControls } data-testid="app-window-controls" gap={ 4 }>
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
                <span aria-hidden>✕</span>
              </ActionIcon>
            </Group>
          ) }
        </Group>
      </AppShell.Header>

      <AppShell.Navbar data-testid="app-navbar" p="sm">
        <Stack gap={ 2 } h="100%">
          <Text c="dimmed" data-testid="app-nav-workspace-label" fw={ 500 } pb={ 4 } pl="xs" size="xs" tt="uppercase">
            Workspace
          </Text>
          { TOP_NAV.map((navItem) => (
            <NavLink
              key={ navItem.path }
              active={ isActive(location.pathname, navItem.path) }
              component={ Link }
              data-testid={ navItem.testId }
              label={ navItem.label }
              to={ navItem.path }
            />
          )) }

          <Stack gap={ 2 } mt="auto">
            { BOTTOM_NAV.map((navItem) => (
              <NavLink
                key={ navItem.path }
                active={ isActive(location.pathname, navItem.path) }
                component={ Link }
                data-testid={ navItem.testId }
                label={ navItem.label }
                to={ navItem.path }
              />
            )) }
          </Stack>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main data-testid="app-main">
        <Routes>
          <Route element={ <Navigate replace to="/library" /> } path="/" />
          <Route element={ <Library /> } path="/library" />
          <Route element={ <CompareLogs /> } path="/compare" />
          <Route element={ <ImportLogs /> } path="/import" />
          <Route element={ <Settings /> } path="/settings" />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
