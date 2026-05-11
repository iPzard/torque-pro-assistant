import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import type { SessionDataRow } from 'types/session';

import ThrottleLoadChart from '.';

const makeRows = (count: number): SessionDataRow[] =>
  Array.from({ length: count }, (_, index) => ({
    load:     30 + index * 2,
    t:        index,
    throttle: 20 + index * 3,
    ts:       index * 1000
  }));

function renderChart(data: readonly SessionDataRow[] = makeRows(10)) {
  return render(
    <MantineProvider>
      <ThrottleLoadChart data={ data } testId="throttle-load" />
    </MantineProvider>
  );
}

describe('pages/session-detail/overview/throttle-load-chart', () => {
  it('renders the card wrapper', () => {
    renderChart();
    expect(screen.getByTestId('throttle-load')).toBeInTheDocument();
  });

  it('renders the chart child', () => {
    renderChart();
    expect(screen.getByTestId('throttle-load-chart')).toBeInTheDocument();
  });

  it('renders on empty data via the chart placeholder', () => {
    renderChart([]);
    expect(screen.getByTestId('throttle-load-chart')).toBeInTheDocument();
  });
});
