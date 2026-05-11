import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import type { Session, SessionDataRow } from 'types/session';

import SummaryTable from '.';

const makeRow = (overrides: Partial<SessionDataRow>): SessionDataRow => ({
  t:  0,
  ts: 0,
  ...overrides
});

const makeSession = (id: string, name: string, maxSpeed: number): Session => ({
  data: [
    makeRow({ rpm: 1500, speed_mph: 0,        t: 0 }),
    makeRow({ rpm: 3500, speed_mph: maxSpeed, t: 5 })
  ],
  meta: {
    duration:  5,
    fileName:  `${ name }.csv`,
    fileSize:  1024,
    gpsStart:  { lat: 0, lon: 0 },
    id,
    name,
    notes:     '',
    startedAt: '2024-10-28T13:50:51.000Z',
    vehicle:   { make: '', model: '', vin: '', year: 0 }
  }
});

function renderTable(sessions: readonly Session[]) {
  return render(
    <MantineProvider>
      <SummaryTable sessions={ sessions } testId="summary" />
    </MantineProvider>
  );
}

describe('pages/compare-logs/summary-table', () => {
  it('renders the empty-state when given no sessions', () => {
    renderTable([]);
    expect(screen.getByTestId('summary-empty')).toBeInTheDocument();
  });

  it('renders a column header per session', () => {
    renderTable([
      makeSession('s_1', 'run-a', 85),
      makeSession('s_2', 'run-b', 90)
    ]);
    expect(screen.getByTestId('summary-header-s_1')).toHaveTextContent('run-a');
    expect(screen.getByTestId('summary-header-s_2')).toHaveTextContent('run-b');
  });

  it('renders a row per summary stat', () => {
    renderTable([makeSession('s_1', 'run-a', 85)]);
    expect(screen.getByTestId('summary-row-max-speed')).toBeInTheDocument();
    expect(screen.getByTestId('summary-row-distance')).toBeInTheDocument();
    expect(screen.getByTestId('summary-row-0-60')).toBeInTheDocument();
  });

  it('renders the Δ column only when exactly two sessions are selected', () => {
    renderTable([makeSession('s_1', 'run-a', 85)]);
    const row = screen.getByTestId('summary-row-max-speed');
    expect(row.children.length).toBe(2);
  });

  it('renders the Δ column with two sessions', () => {
    renderTable([
      makeSession('s_1', 'run-a', 80),
      makeSession('s_2', 'run-b', 100)
    ]);
    const row = screen.getByTestId('summary-row-max-speed');
    /** label + 2 session columns + Δ = 4. */
    expect(row.children.length).toBe(4);
    expect(row).toHaveTextContent('+20');
  });

  it('omits Δ when more than two sessions are selected', () => {
    renderTable([
      makeSession('s_1', 'a', 80),
      makeSession('s_2', 'b', 90),
      makeSession('s_3', 'c', 100)
    ]);
    const row = screen.getByTestId('summary-row-max-speed');
    expect(row.children.length).toBe(4);
  });
});
