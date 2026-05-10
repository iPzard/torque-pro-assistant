import { useEffect } from 'react';
import {
  ActionIcon,
  AppShell,
  Button,
  Group,
  NavLink,
  Stack,
  Text,
  Title
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation
} from 'react-router-dom';
import { app as windowControls } from '../utils/services';
import { get } from '../utils/requests';
import ImportDropzone from './ImportDropzone';
import Library from './pages/Library';
import Compare from './pages/Compare';
import Settings from './pages/Settings';
import styles from './App.module.scss';

// Single source of truth for nav entries — labels + paths drive both the
// sidebar links and the route definitions, so adding a page is one edit.
const NAV_ITEMS = [
  { label: 'Library',  path: '/library' },
  { label: 'Compare',  path: '/compare' },
  { label: 'Settings', path: '/settings' }
] as const;

function App() {
  const location = useLocation();
  const [importOpen, { open: openImport, close: closeImport }] = useDisclosure(false);

  useEffect(() => {
    get<string>(
      'ping',
      (response) => console.log('Flask /ping:', response),
      (error) => console.error('Flask /ping failed:', error)
    );
  }, []);

  return (
    <>
      <AppShell
        header={ { height: 44 } }
        navbar={ { breakpoint: 'sm', width: 220 } }
        padding="md"
      >
        <AppShell.Header className={ styles.header }>
          <Group h="100%" px="md" justify="space-between" gap="sm" wrap="nowrap">
            <Title order={ 5 } fw={ 600 } className={ styles.appName }>
              Torque<Text span c="orange.5" fw={ 600 } inherit>Pro</Text>
              <Text span c="dimmed" fw={ 500 } inherit> · Assistant</Text>
            </Title>

            <Group gap="xs" className={ styles.headerActions }>
              <Button size="xs" variant="filled" color="orange" onClick={ openImport }>
                Import CSV
              </Button>

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
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="sm">
          <Stack gap={ 2 }>
            <Text size="xs" c="dimmed" tt="uppercase" fw={ 500 } pl="xs" pb={ 4 }>
              Workspace
            </Text>
            { NAV_ITEMS.map((item) => (
              <NavLink
                key={ item.path }
                component={ Link }
                to={ item.path }
                label={ item.label }
                active={
                  location.pathname === item.path
                  || (item.path === '/library' && location.pathname === '/')
                }
              />
            )) }
          </Stack>
        </AppShell.Navbar>

        <AppShell.Main>
          <Routes>
            <Route path="/" element={ <Navigate to="/library" replace /> } />
            <Route path="/library" element={ <Library /> } />
            <Route path="/compare" element={ <Compare /> } />
            <Route path="/settings" element={ <Settings /> } />
          </Routes>
        </AppShell.Main>
      </AppShell>

      <ImportDropzone opened={ importOpen } onClose={ closeImport } />
    </>
  );
}

export default App;
