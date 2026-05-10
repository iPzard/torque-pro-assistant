import { useEffect } from 'react';
import { ActionIcon, AppShell, Group, Text, Title } from '@mantine/core';
import { app as windowControls } from '../utils/services';
import { get } from '../utils/requests';
import styles from './App.module.scss';

// The Electron main process opens a frameless window (frame: false) so the
// chrome can be themed with the rest of the app. The AppShell.Header doubles
// as the OS-level drag handle via -webkit-app-region: drag (set in
// App.module.scss); interactive elements opt out with .noDrag.

function App() {
  useEffect(() => {
    get<string>(
      'ping',
      (response) => console.log('Flask /ping:', response),
      (error) => console.error('Flask /ping failed:', error)
    );
  }, []);

  return (
    <AppShell
      header={ { height: 44 } }
      navbar={ { width: 220, breakpoint: 'sm' } }
      padding="md"
    >
      <AppShell.Header className={ styles.header }>
        <Group h="100%" px="md" justify="space-between" gap="sm" wrap="nowrap">
          <Title order={ 5 } fw={ 600 } className={ styles.appName }>
            Torque<Text span c="orange.5" fw={ 600 } inherit>Pro</Text>
            <Text span c="dimmed" fw={ 500 } inherit> · Assistant</Text>
          </Title>

          <Group gap={ 4 } className={ styles.windowControls }>
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={ windowControls.minimize } aria-label="Minimize">
              <span aria-hidden style={ { width: 10, borderTop: '1px solid currentColor' } } />
            </ActionIcon>
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={ windowControls.maximize } aria-label="Maximize">
              <span aria-hidden style={ { width: 10, height: 10, border: '1px solid currentColor' } } />
            </ActionIcon>
            <ActionIcon variant="subtle" color="red" size="sm" onClick={ windowControls.quit } aria-label="Close">
              <span aria-hidden>✕</span>
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <Text size="xs" c="dimmed" tt="uppercase" fw={ 500 }>Workspace</Text>
        <Text size="sm" c="dimmed" mt="xs">
          Sidebar nav lands in step 6.
        </Text>
      </AppShell.Navbar>

      <AppShell.Main>
        <Title order={ 2 }>Torque Pro Assistant</Title>
        <Text c="dimmed" mt="xs">
          Foundation scaffold — routes and the Import flow land in step 6.
        </Text>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
