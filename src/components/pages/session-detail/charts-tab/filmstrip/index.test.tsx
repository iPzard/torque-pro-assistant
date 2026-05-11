import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import type { SessionDataRow } from 'types/session';

import Filmstrip from '.';

const makeRows = (count: number): SessionDataRow[] =>
  Array.from({ length: count }, (_, index) => ({
    boost_psi: 5 + index * 0.1,
    rpm:       1500 + index * 50,
    speed_mph: 30 + index,
    t:         index,
    ts:        index * 1000
  }));

function renderFilmstrip(selectedPids: readonly string[]) {
  return render(
    <MantineProvider>
      <Filmstrip
        data={ makeRows(10) }
        selectedPids={ selectedPids }
        testId="filmstrip"
      />
    </MantineProvider>
  );
}

describe('pages/session-detail/charts-tab/filmstrip', () => {
  it('renders the empty-state when no PIDs are selected', () => {
    renderFilmstrip([]);
    expect(screen.getByTestId('filmstrip-empty')).toBeInTheDocument();
  });

  it('renders one card per selected PID', () => {
    renderFilmstrip(['speed_mph', 'rpm']);
    expect(screen.getByTestId('filmstrip-card-speed_mph')).toBeInTheDocument();
    expect(screen.getByTestId('filmstrip-card-rpm')).toBeInTheDocument();
  });

  it('renders the chart inside each card', () => {
    renderFilmstrip(['speed_mph']);
    expect(screen.getByTestId('filmstrip-chart-speed_mph')).toBeInTheDocument();
  });

  it('silently skips unknown PID keys (renames / stale persisted state)', () => {
    renderFilmstrip(['speed_mph', 'no_such_pid']);
    expect(screen.getByTestId('filmstrip-card-speed_mph')).toBeInTheDocument();
    expect(screen.queryByTestId('filmstrip-card-no_such_pid')).not.toBeInTheDocument();
  });
});
