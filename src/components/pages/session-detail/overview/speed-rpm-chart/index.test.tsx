import { MantineProvider } from '@mantine/core';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';

import preferencesReducer, { INITIAL_PREFERENCES } from 'state/preferences';
import type { SessionDataRow } from 'types/session';

import SpeedRpmChart from '.';

/** Build a small synthetic session row series for tests. */
const makeRows = (count: number): SessionDataRow[] =>
  Array.from({ length: count }, (_, index) => ({
    rpm:       1000 + index * 100,
    speed_mph: 10 + index * 2,
    t:         index,
    ts:        index * 1000
  }));

const makeStore = () => configureStore({
  preloadedState: { preferences: INITIAL_PREFERENCES },
  reducer:        { preferences: preferencesReducer }
});

function renderSpeedRpmChart(data: readonly SessionDataRow[]) {
  return render(
    <Provider store={ makeStore() }>
      <MantineProvider>
        <SpeedRpmChart data={ data } testId="speed-rpm" />
      </MantineProvider>
    </Provider>
  );
}

describe('pages/session-detail/overview/speed-rpm-chart', () => {
  it('renders the card wrapper', () => {
    renderSpeedRpmChart(makeRows(20));
    expect(screen.getByTestId('speed-rpm')).toBeInTheDocument();
  });

  it('renders the chart child', () => {
    renderSpeedRpmChart(makeRows(20));
    expect(screen.getByTestId('speed-rpm-chart')).toBeInTheDocument();
  });

  it('renders the brush strip when there are at least two rows', () => {
    renderSpeedRpmChart(makeRows(20));
    expect(screen.getByTestId('speed-rpm-brush')).toBeInTheDocument();
  });

  it('omits the brush strip when there are too few rows to brush', () => {
    renderSpeedRpmChart(makeRows(1));
    expect(screen.queryByTestId('speed-rpm-brush')).not.toBeInTheDocument();
  });

  it('still renders the chart on empty data via the placeholder path', () => {
    renderSpeedRpmChart([]);
    expect(screen.getByTestId('speed-rpm-chart')).toBeInTheDocument();
  });
});
