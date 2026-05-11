import { MantineProvider } from '@mantine/core';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';

import preferencesReducer, { INITIAL_PREFERENCES } from 'state/preferences';
import type { SessionDataRow } from 'types/session';

import PowerTorqueChart from '.';

const makeRows = (count: number): SessionDataRow[] =>
  Array.from({ length: count }, (_, index) => ({
    hp:      100 + index * 10,
    t:       index,
    tq_lbft: 150 + index * 8,
    ts:      index * 1000
  }));

const makeStore = () => configureStore({
  preloadedState: { preferences: INITIAL_PREFERENCES },
  reducer:        { preferences: preferencesReducer }
});

function renderChart(data: readonly SessionDataRow[] = makeRows(10)) {
  return render(
    <Provider store={ makeStore() }>
      <MantineProvider>
        <PowerTorqueChart data={ data } testId="power-torque" />
      </MantineProvider>
    </Provider>
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
