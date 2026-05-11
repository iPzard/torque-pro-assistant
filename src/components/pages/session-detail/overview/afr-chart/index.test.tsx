import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import type { SessionDataRow } from 'types/session';

import AfrChart from '.';

const makeRows = (count: number): SessionDataRow[] =>
  Array.from({ length: count }, (_, index) => ({
    afr_cmd:  14.7,
    afr_meas: 14.5 + (index % 3) * 0.1,
    t:        index,
    ts:       index * 1000
  }));

function renderChart(data: readonly SessionDataRow[] = makeRows(10)) {
  return render(
    <MantineProvider>
      <AfrChart data={ data } testId="afr" />
    </MantineProvider>
  );
}

describe('pages/session-detail/overview/afr-chart', () => {
  it('renders the card wrapper', () => {
    renderChart();
    expect(screen.getByTestId('afr')).toBeInTheDocument();
  });

  it('renders the chart child', () => {
    renderChart();
    expect(screen.getByTestId('afr-chart')).toBeInTheDocument();
  });

  it('renders on empty data via the chart placeholder', () => {
    renderChart([]);
    expect(screen.getByTestId('afr-chart')).toBeInTheDocument();
  });
});
