import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import type { SessionDataRow } from 'types/session';

import PowerTorqueChart from '.';

const makeRows = (count: number): SessionDataRow[] =>
  Array.from({ length: count }, (_, index) => ({
    hp:      100 + index * 10,
    t:       index,
    tq_lbft: 150 + index * 8,
    ts:      index * 1000
  }));

function renderChart(data: readonly SessionDataRow[] = makeRows(10)) {
  return render(
    <MantineProvider>
      <PowerTorqueChart data={ data } testId="power-torque" />
    </MantineProvider>
  );
}

describe('pages/session-detail/overview/power-torque-chart', () => {
  it('renders the card wrapper', () => {
    renderChart();
    expect(screen.getByTestId('power-torque')).toBeInTheDocument();
  });

  it('renders the chart child', () => {
    renderChart();
    expect(screen.getByTestId('power-torque-chart')).toBeInTheDocument();
  });

  it('renders on empty data via the chart placeholder', () => {
    renderChart([]);
    expect(screen.getByTestId('power-torque-chart')).toBeInTheDocument();
  });
});
