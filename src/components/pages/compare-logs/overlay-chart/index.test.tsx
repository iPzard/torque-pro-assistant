import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import type { OverlayRow, OverlaySeries } from 'components/pages/compare-logs/utils';

import OverlayChart from '.';

function renderChart(
  data: readonly OverlayRow[],
  series: readonly OverlaySeries[]
) {
  return render(
    <MantineProvider>
      <OverlayChart data={ data } series={ series } testId="overlay" />
    </MantineProvider>
  );
}

describe('pages/compare-logs/overlay-chart', () => {
  it('renders the card wrapper', () => {
    renderChart(
      [{ 's_1::speed_mph': 30, t: 0 }],
      [
        {
          color:     'red',
          key:       's_1::speed_mph',
          label:     'run-a · speed_mph',
          pid:       'speed_mph',
          sessionId: 's_1'
        }
      ]
    );
    expect(screen.getByTestId('overlay')).toBeInTheDocument();
  });

  it('renders the underlying chart', () => {
    renderChart(
      [{ 's_1::rpm': 1500, t: 0 }],
      [
        {
          color:     'red',
          key:       's_1::rpm',
          label:     'run-a · rpm',
          pid:       'rpm',
          sessionId: 's_1'
        }
      ]
    );
    expect(screen.getByTestId('overlay-chart')).toBeInTheDocument();
  });

  it('falls through to the chart placeholder when given empty data', () => {
    renderChart([], []);
    expect(screen.getByTestId('overlay-chart')).toBeInTheDocument();
  });
});
