import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Session, SessionDataRow } from 'types/session';

import ChartsTab from '.';

const makeRow = (overrides: Partial<SessionDataRow>): SessionDataRow => ({
  t:  0,
  ts: 0,
  ...overrides
});

const makeSession = (): Session => ({
  data: [
    makeRow({ boost_psi: 5, coolant_f: 190, rpm: 1500, speed_mph: 30, t: 0, throttle: 25 }),
    makeRow({ boost_psi: 8, coolant_f: 192, rpm: 4500, speed_mph: 75, t: 5, throttle: 80 })
  ],
  meta: {
    duration:  5,
    fileName:  'drive.csv',
    fileSize:  1024,
    gpsStart:  { lat: 0, lon: 0 },
    id:        's_1_drive',
    name:      'drive',
    notes:     '',
    startedAt: '2024-10-28T13:50:51.000Z',
    vehicle:   { make: '', model: '', vin: '', year: 0 }
  }
});

function renderChartsTab() {
  return render(
    <MantineProvider>
      <ChartsTab session={ makeSession() } testId="charts-tab" />
    </MantineProvider>
  );
}

describe('pages/session-detail/charts-tab', () => {
  it('renders the tab wrapper', () => {
    renderChartsTab();
    expect(screen.getByTestId('charts-tab')).toBeInTheDocument();
  });

  it('renders the filmstrip with the default PID selection', () => {
    renderChartsTab();
    expect(screen.getByTestId('charts-tab-filmstrip')).toBeInTheDocument();
    expect(screen.getByTestId('charts-tab-filmstrip-card-speed_mph')).toBeInTheDocument();
    expect(screen.getByTestId('charts-tab-filmstrip-card-rpm')).toBeInTheDocument();
  });

  it('clicking the picker trigger opens the drawer', async () => {
    const user = userEvent.setup();
    renderChartsTab();
    await user.click(screen.getByTestId('charts-tab-picker-trigger'));
    /**
     * `findByTestId` polls until the assertion passes — Mantine's
     * `Drawer` mounts its body after a CSS animation tick, so a
     * synchronous `getByTestId` races and fails intermittently
     * (consistently on the Ubuntu CI runner, occasionally locally).
     */
    expect(await screen.findByTestId('charts-tab-picker-search')).toBeInTheDocument();
  });
});
