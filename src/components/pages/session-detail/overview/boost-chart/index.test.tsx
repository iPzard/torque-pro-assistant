import { MantineProvider } from '@mantine/core';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';

import preferencesReducer, { INITIAL_PREFERENCES } from 'state/preferences';
import type { SessionDataRow } from 'types/session';

import BoostChart from '.';

const makeRows = (count: number): SessionDataRow[] =>
  Array.from({ length: count }, (_, index) => ({
    boost_psi: -2 + index * 0.5,
    t:         index,
    ts:        index * 1000
  }));

const makeStore = () => configureStore({
  preloadedState: { preferences: INITIAL_PREFERENCES },
  reducer:        { preferences: preferencesReducer }
});

function renderChart(data: readonly SessionDataRow[] = makeRows(10)) {
  return render(
    <Provider store={ makeStore() }>
      <MantineProvider>
        <BoostChart data={ data } testId="boost" />
      </MantineProvider>
    </Provider>
  );
}

describe('pages/session-detail/overview/boost-chart', () => {
  it('renders the card wrapper', () => {
    renderChart();
    expect(screen.getByTestId('boost')).toBeInTheDocument();
  });

  it('renders the chart child', () => {
    renderChart();
    expect(screen.getByTestId('boost-chart')).toBeInTheDocument();
  });

  it('renders on empty data via the chart placeholder', () => {
    renderChart([]);
    expect(screen.getByTestId('boost-chart')).toBeInTheDocument();
  });
});
