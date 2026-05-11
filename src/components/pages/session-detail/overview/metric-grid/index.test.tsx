import { MantineProvider } from '@mantine/core';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';

import preferencesReducer, { INITIAL_PREFERENCES, type PreferencesState } from 'state/preferences';
import type { SessionSummary } from 'types/session';

import MetricGrid from '.';

const makeSummary = (overrides: Partial<SessionSummary> = {}): SessionSummary => ({
  avgMpg:   21.4,
  dist:     124.6,
  duration: 1820,
  maxBoost: 21.4,
  maxCool:  205,
  maxSpeed: 97.2,
  peakHp:   385.4,
  peakTq:   442.1,
  t0to30:   3.2,
  t0to60:   7.1,
  ...overrides
});

const makeStore = (preferences: PreferencesState = INITIAL_PREFERENCES) => configureStore({
  preloadedState: { preferences },
  reducer:        { preferences: preferencesReducer }
});

function renderMetricGrid(
  summary: SessionSummary = makeSummary(),
  preferences?: PreferencesState
) {
  return render(
    <Provider store={ makeStore(preferences) }>
      <MantineProvider>
        <MetricGrid summary={ summary } testId="metric-grid" />
      </MantineProvider>
    </Provider>
  );
}

describe('pages/session-detail/overview/metric-grid', () => {
  it('renders the grid wrapper', () => {
    renderMetricGrid();
    expect(screen.getByTestId('metric-grid')).toBeInTheDocument();
  });

  it('renders the Max Speed tile rounded to whole mph under imperial', () => {
    renderMetricGrid();
    expect(screen.getByTestId('metric-grid-max-speed-value')).toHaveTextContent('97');
    expect(screen.getByTestId('metric-grid-max-speed-unit')).toHaveTextContent('mph');
  });

  it('switches the Max Speed tile to km/h under metric', () => {
    renderMetricGrid(makeSummary(), { ...INITIAL_PREFERENCES, units: 'metric' });
    expect(screen.getByTestId('metric-grid-max-speed-unit')).toHaveTextContent('km/h');
  });

  it('renders the Peak HP tile rounded to whole hp', () => {
    renderMetricGrid();
    expect(screen.getByTestId('metric-grid-peak-hp-value')).toHaveTextContent('385');
    expect(screen.getByTestId('metric-grid-peak-hp-unit')).toHaveTextContent('hp');
  });

  it('renders the Peak Torque tile rounded to whole lb-ft', () => {
    renderMetricGrid();
    expect(screen.getByTestId('metric-grid-peak-tq-value')).toHaveTextContent('442');
    expect(screen.getByTestId('metric-grid-peak-tq-unit')).toHaveTextContent('lb·ft');
  });

  it('renders the Max Boost tile with one decimal of psi under imperial', () => {
    renderMetricGrid();
    expect(screen.getByTestId('metric-grid-max-boost-value')).toHaveTextContent('21.4');
    expect(screen.getByTestId('metric-grid-max-boost-unit')).toHaveTextContent('psi');
  });

  it('switches the Max Boost tile to kPa under metric', () => {
    renderMetricGrid(makeSummary(), { ...INITIAL_PREFERENCES, units: 'metric' });
    expect(screen.getByTestId('metric-grid-max-boost-unit')).toHaveTextContent('kPa');
  });

  it('renders the Max Coolant tile in °F under imperial', () => {
    renderMetricGrid();
    expect(screen.getByTestId('metric-grid-max-cool-unit')).toHaveTextContent('°F');
  });

  it('switches the Max Coolant tile to °C under metric', () => {
    renderMetricGrid(makeSummary(), { ...INITIAL_PREFERENCES, units: 'metric' });
    expect(screen.getByTestId('metric-grid-max-cool-unit')).toHaveTextContent('°C');
  });

  it('renders the Avg MPG tile with one decimal', () => {
    renderMetricGrid();
    expect(screen.getByTestId('metric-grid-avg-mpg-value')).toHaveTextContent('21.4');
  });

  it('renders the Distance tile in miles under imperial', () => {
    renderMetricGrid();
    expect(screen.getByTestId('metric-grid-dist-unit')).toHaveTextContent('mi');
  });

  it('switches the Distance tile to km under metric', () => {
    renderMetricGrid(makeSummary(), { ...INITIAL_PREFERENCES, units: 'metric' });
    expect(screen.getByTestId('metric-grid-dist-unit')).toHaveTextContent('km');
  });

  it('renders the 0-60 tile with one decimal of seconds', () => {
    renderMetricGrid();
    expect(screen.getByTestId('metric-grid-zero-to-sixty-value')).toHaveTextContent('7.1');
  });

  it('falls back to an em-dash for 0-60 when the session never reached 60 mph', () => {
    renderMetricGrid(makeSummary({ t0to60: null }));
    expect(screen.getByTestId('metric-grid-zero-to-sixty-value')).toHaveTextContent('—');
  });
});
