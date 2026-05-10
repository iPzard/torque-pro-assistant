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
import { app as windowControls } from '../utils/services';
import { get } from '../utils/requests';
import Library from './pages/Library';
import Compare from './pages/Compare';
import Import from './pages/Import';
import Settings from './pages/Settings';
import styles from './App.module.scss';

// Sidebar layout matches the handoff design:
//   Workspace group  — Library / Compare / Import
//   pinned at bottom — Settings
// Adding a workspace page is a one-edit change against TOP_NAV.
const TOP_NAV = [
  { label: 'Library', path: '/library' },
  { label: 'Compare', path: '/compare' },
  { label: 'Import',  path: '/import' }
] as const;

const BOTTOM_NAV = [
  { label: 'Settings', path: '/settings' }
] as const;

// Captured at module load so the platform branch is decided once. preload
// freezes process.platform at bridge-creation time, so this won't drift
// across renders. macOS gets the OS-rendered traffic lights via main.ts's
// `titleBarStyle: 'hiddenInset'`; Windows / Linux get our own min/max/close.
const isMac = window.electronAPI.platform === 'darwin';

function App() {
  const location = useLocation();

  useEffect(() => {
    get<string>(
      'ping',
      (response) => console.log('Flask /ping:', response),
      (error) => console.error('Flask /ping failed:', error)
    );
  }, []);

  const isActive = (path: string): boolean => (
    location.pathname === path
    || (path === '/library' && location.pathname === '/')
  );

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
          { TOP_NAV.map((item) => (
            <NavLink
              key={ item.path }
              component={ Link }
              to={ item.path }
              label={ item.label }
              active={ isActive(item.path) }
            />
          )) }

          <Stack gap={ 2 } mt="auto">
            { BOTTOM_NAV.map((item) => (
              <NavLink
                key={ item.path }
                component={ Link }
                to={ item.path }
                label={ item.label }
                active={ isActive(item.path) }
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
