import { useEffect } from 'react';
import {
  ActionIcon,
  AppShell,
  Group,
  NavLink,
  Stack,
  Text,
  Title
} from '@mantine/core';
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation
} from 'react-router-dom';
import { app as windowControls } from '../../utils';
import Library from '../pages/library';
import Compare from '../pages/compare';
import Import from '../pages/import';
import Settings from '../pages/settings';
import { isActive, pingFlask } from './utils';
import styles from './index.module.scss';

// Single source of truth for sidebar entries. Top group renders inside the
// "Workspace" label; bottom group is pinned to the floor. Adding a route is
// a one-edit change against TOP_NAV / BOTTOM_NAV plus a matching <Route>.
const TOP_NAV = [
  { label: 'Library', path: '/library' },
  { label: 'Compare', path: '/compare' },
  { label: 'Import',  path: '/import' }
] as const;

const BOTTOM_NAV = [
  { label: 'Settings', path: '/settings' }
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
  // preload freezes process.platform at bridge-creation time, so reading it
  // inside the component is a constant for the lifetime of the window.
  // Inlined here (not at module scope) so tests can swap window.electronAPI
  // between renders without juggling isolateModules.
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
      <AppShell.Header className={ styles.header }>
        <Group
          h="100%"
          // Reserve room on the left for native macOS traffic lights
          // (~70px wide, inset by trafficLightPosition in main.ts).
          pl={ isMac ? 86 : 'md' }
          pr="md"
          justify="space-between"
          gap="sm"
          wrap="nowrap"
        >
          <Title order={ 5 } fw={ 600 } className={ styles.appName }>
            Torque<Text span c="amber.6" fw={ 600 } inherit>Pro</Text>
            <Text span c="dimmed" fw={ 500 } inherit> · Assistant</Text>
          </Title>

          { !isMac && (
            <Group gap={ 4 } className={ styles.windowControls }>
              <ActionIcon variant="subtle" color="gray" size="sm" onClick={ windowControls.minimize } aria-label="Minimize">
                <span aria-hidden style={ { borderTop: '1px solid currentColor', width: 10 } } />
              </ActionIcon>
              <ActionIcon variant="subtle" color="gray" size="sm" onClick={ windowControls.maximize } aria-label="Maximize">
                <span aria-hidden style={ { border: '1px solid currentColor', height: 10, width: 10 } } />
              </ActionIcon>
              <ActionIcon variant="subtle" color="red" size="sm" onClick={ windowControls.quit } aria-label="Close">
                <span aria-hidden>✕</span>
              </ActionIcon>
            </Group>
          ) }
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <Stack gap={ 2 } h="100%">
          <Text size="xs" c="dimmed" tt="uppercase" fw={ 500 } pl="xs" pb={ 4 }>
            Workspace
          </Text>
          { TOP_NAV.map((navItem) => (
            <NavLink
              key={ navItem.path }
              component={ Link }
              to={ navItem.path }
              label={ navItem.label }
              active={ isActive(location.pathname, navItem.path) }
            />
          )) }

          <Stack gap={ 2 } mt="auto">
            { BOTTOM_NAV.map((navItem) => (
              <NavLink
                key={ navItem.path }
                component={ Link }
                to={ navItem.path }
                label={ navItem.label }
                active={ isActive(location.pathname, navItem.path) }
              />
            )) }
          </Stack>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={ <Navigate to="/library" replace /> } />
          <Route path="/library" element={ <Library /> } />
          <Route path="/compare" element={ <Compare /> } />
          <Route path="/import" element={ <Import /> } />
          <Route path="/settings" element={ <Settings /> } />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
