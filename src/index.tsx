// Mantine CSS bundles must be imported before MantineProvider mounts so the
// CSS variables (--mantine-*) are in scope when components query them.
// Order matches the dependency direction: core → dates → notifications → dropzone.
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dropzone/styles.css';
import './index.scss';

import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import store from './state/store';

// HashRouter (not BrowserRouter) because Electron's prod build loads the
// renderer via file:// — BrowserRouter's deep links would 404 there.

const theme = createTheme({
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMonospace: 'ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace',
  // Mantine ships ten-shade scales; "orange" is the closest stock match for
  // the design's amber instrument-backlight accent (#ffb020). The exact
  // shade tuning can move into a custom palette later.
  primaryColor: 'orange'
});

const container = document.getElementById('root');
if (!container) throw new Error('Root container #root not found');

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <MantineProvider theme={ theme } defaultColorScheme="dark">
      <Notifications />
      <Provider store={ store }>
        <HashRouter>
          <App />
        </HashRouter>
      </Provider>
    </MantineProvider>
  </React.StrictMode>
);
