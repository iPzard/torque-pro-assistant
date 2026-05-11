import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import type { SessionDataRow } from 'types/session';

import EngineVitalsChart from '.';

const makeRows = (count: number): SessionDataRow[] =>
  Array.from({ length: count }, (_, index) => ({
    coolant_f: 190 + (index % 5),
    iat_f:     85 + index,
    oil_f:     200 + index * 0.5,
    t:         index,
    ts:        index * 1000
  }));

function renderChart(data: readonly SessionDataRow[] = makeRows(10)) {
  return render(
    <MantineProvider>
      <EngineVitalsChart data={ data } testId="engine-vitals" />
    </MantineProvider>
  );
}

describe('pages/session-detail/overview/engine-vitals-chart', () => {
  it('renders the card wrapper', () => {
    renderChart();
    expect(screen.getByTestId('engine-vitals')).toBeInTheDocument();
  });

  it('renders the chart child', () => {
    renderChart();
    expect(screen.getByTestId('engine-vitals-chart')).toBeInTheDocument();
  });

  it('renders on empty data via the chart placeholder', () => {
    renderChart([]);
    expect(screen.getByTestId('engine-vitals-chart')).toBeInTheDocument();
  });
});
