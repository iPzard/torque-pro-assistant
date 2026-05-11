/**
 * Mantine CSS bundles must be imported before MantineProvider mounts so the
 * CSS variables (--mantine-*) are in scope when components query them.
 * Order matches the dependency direction: core → dates → notifications → dropzone.
 */
import { createTheme, type MantineColorsTuple, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';

import App from 'components/app';
import store from 'state/store';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dropzone/styles.css';
import './index.scss';

/**
 * HashRouter (not BrowserRouter) because Electron's prod build loads the
 * renderer via file:// — BrowserRouter's deep links would 404 there.
 */

/**
 * Custom palette for the design's instrument-backlight amber accent.
 * Index 6 is the design target (#ffb020); other shades are hand-derived
 * to stay perceptually balanced light-to-dark for hover / press / disabled
 * states. Mantine's color generator can be re-run later if precision matters.
 */
const amber: MantineColorsTuple = [
  '#fff8e1',
  '#ffeebb',
  '#ffe28d',
  '#ffd45b',
  '#ffc83a',
  '#ffbb27',
  '#ffb020',
  '#e89615',
  '#c47a08',
  '#9a5e00'
];

const theme = createTheme({
  colors: { amber },
  defaultRadius: 'md',
  fontFamily: '"Geist", ui-sans-serif, system-ui, -apple-system, sans-serif',
  fontFamilyMonospace: '"Geist Mono", ui-monospace, "JetBrains Mono", Menlo, monospace',
  fontSizes: { md: '13px', sm: '12px', xs: '11px' },
  primaryColor: 'amber',
  /**
   * Mantine 7 defaults to { light: 6, dark: 8 } for primaryShade, which would
   * dim the amber on the dark-default theme. Pin shade 6 across both schemes
   * so the brand color stays the brand color.
   */
  primaryShade: { dark: 6, light: 6 }
});

const container = document.getElementById('root');
if (!container) throw new Error('Root container #root not found');

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="dark" theme={ theme }>
      <Notifications />
      <Provider store={ store }>
        <HashRouter>
          <App />
        </HashRouter>
      </Provider>
    </MantineProvider>
  </React.StrictMode>
);
