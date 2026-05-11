import { render, screen } from '@testing-library/react';

import LineChart, { type LineChartDatum, type LineChartSeries } from '.';

const sampleData: LineChartDatum[] = Array.from({ length: 20 }, (_, index) => ({
  rpm:        800 + index * 200,
  speed_mph:  index * 5,
  t:          index,
  ts:         index * 1000
}));

const speedSeries: LineChartSeries = {
  color: '#6fd3f7',
  key:   'speed_mph',
  label: 'Speed',
  unit:  'mph'
};

const rpmSeriesRight: LineChartSeries = {
  axis:  'right',
  color: '#ffb020',
  key:   'rpm',
  label: 'Engine RPM',
  unit:  'rpm'
};

describe('components/charts/line-chart', () => {
  it('renders the chart container at the requested height', () => {
    render(
      <LineChart
        data={ sampleData }
        height={ 240 }
        series={ [speedSeries] }
        testId="speed-chart"
      />
    );
    const wrapper = screen.getByTestId('speed-chart');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveStyle({ height: '240px' });
  });

  it('falls back to the empty-state placeholder when data is empty', () => {
    render(<LineChart data={ [] } series={ [speedSeries] } testId="empty-chart" />);
    expect(screen.getByTestId('empty-chart')).toBeInTheDocument();
  });

  it('falls back to the empty-state placeholder when series is empty', () => {
    render(<LineChart data={ sampleData } series={ [] } testId="seriesless-chart" />);
    expect(screen.getByTestId('seriesless-chart')).toBeInTheDocument();
  });

  it('renders without crashing when given multiple series + a right-axis series', () => {
    render(
      <LineChart
        data={ sampleData }
        series={ [speedSeries, rpmSeriesRight] }
        testId="dual-axis-chart"
      />
    );
    expect(screen.getByTestId('dual-axis-chart')).toBeInTheDocument();
  });

  it('renders without crashing when given an area-type series', () => {
    render(
      <LineChart
        data={ sampleData }
        series={ [{ ...speedSeries, type: 'area' }] }
        testId="area-chart"
      />
    );
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('renders without crashing when xRange is provided', () => {
    render(
      <LineChart
        data={ sampleData }
        series={ [speedSeries] }
        testId="zoomed-chart"
        xRange={ [5, 15] }
      />
    );
    expect(screen.getByTestId('zoomed-chart')).toBeInTheDocument();
  });

  it('renders without crashing when noAxes + noLegend are set', () => {
    render(
      <LineChart
        data={ sampleData }
        noAxes
        noLegend
        series={ [speedSeries] }
        testId="chromeless-chart"
      />
    );
    expect(screen.getByTestId('chromeless-chart')).toBeInTheDocument();
  });

  it('accepts a syncId for cross-chart cursor sync', () => {
    render(
      <>
        <LineChart
          data={ sampleData }
          series={ [speedSeries] }
          syncId="session-overview"
          testId="chart-a"
        />
        <LineChart
          data={ sampleData }
          series={ [rpmSeriesRight] }
          syncId="session-overview"
          testId="chart-b"
        />
      </>
    );
    expect(screen.getByTestId('chart-a')).toBeInTheDocument();
    expect(screen.getByTestId('chart-b')).toBeInTheDocument();
  });
});
