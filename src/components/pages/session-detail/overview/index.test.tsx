import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import type { Session, SessionDataRow, SessionSummary } from 'types/session';

import Overview from '.';

const makeRow = (tSeconds: number): SessionDataRow => ({
  rpm:       1500,
  speed_mph: 30,
  t:         tSeconds,
  ts:        tSeconds * 1000
});

const makeSession = (): Session => ({
  data: [makeRow(0), makeRow(1), makeRow(2), makeRow(3)],
  meta: {
    duration: 3,
    fileName: 'drive.csv',
    fileSize: 1024,
    gpsStart: { lat: 0, lon: 0 },
    id:       's_1_drive',
    name:     'drive',
    notes:    '',
    startedAt: '2024-10-28T13:50:51.000Z',
    vehicle:   { make: '', model: '', vin: '', year: 0 }
  }
});

const makeSummary = (): SessionSummary => ({
  avgMpg:   21.4,
  dist:     124.6,
  duration: 1820,
  maxBoost: 21.4,
  maxCool:  205,
  maxSpeed: 97.2,
  peakHp:   385.4,
  peakTq:   442.1,
  t0to30:   3.2,
  t0to60:   7.1
});

function renderOverview() {
  return render(
    <MantineProvider>
      <Overview
        session={ makeSession() }
        summary={ makeSummary() }
        testId="overview"
      />
    </MantineProvider>
  );
}

describe('pages/session-detail/overview', () => {
  it('renders the wrapper', () => {
    renderOverview();
    expect(screen.getByTestId('overview')).toBeInTheDocument();
  });

  it('renders the metric grid', () => {
    renderOverview();
    expect(screen.getByTestId('overview-metric-grid')).toBeInTheDocument();
  });

  it('renders the speed + rpm chart', () => {
    renderOverview();
    expect(screen.getByTestId('overview-speed-rpm')).toBeInTheDocument();
  });

  it('renders the throttle / load chart', () => {
    renderOverview();
    expect(screen.getByTestId('overview-throttle-load')).toBeInTheDocument();
  });

  it('renders the AFR chart', () => {
    renderOverview();
    expect(screen.getByTestId('overview-afr')).toBeInTheDocument();
  });

  it('renders the boost chart', () => {
    renderOverview();
    expect(screen.getByTestId('overview-boost')).toBeInTheDocument();
  });

  it('renders the engine vitals chart', () => {
    renderOverview();
    expect(screen.getByTestId('overview-engine-vitals')).toBeInTheDocument();
  });

  it('renders the power & torque chart', () => {
    renderOverview();
    expect(screen.getByTestId('overview-power-torque')).toBeInTheDocument();
  });
});
