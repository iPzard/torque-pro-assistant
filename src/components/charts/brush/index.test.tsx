import { render, screen } from '@testing-library/react';

import Brush, { type BrushDatum } from '.';

const sampleData: BrushDatum[] = Array.from({ length: 50 }, (_, index) => ({
  speed_mph: 30 + Math.sin(index * 0.3) * 25,
  t:         index,
  ts:        index * 1000
}));

describe('components/charts/brush', () => {
  it('renders the brush strip with window + handles', () => {
    render(
      <Brush
        data={ sampleData }
        dataKey="speed_mph"
        onChange={ () => undefined }
        range={ [10, 40] }
        testId="trip-brush"
      />
    );
    expect(screen.getByTestId('trip-brush')).toBeInTheDocument();
    expect(screen.getByTestId('trip-brush-window')).toBeInTheDocument();
    expect(screen.getByTestId('trip-brush-handle-left')).toBeInTheDocument();
    expect(screen.getByTestId('trip-brush-handle-right')).toBeInTheDocument();
  });

  it('honors a custom height prop', () => {
    render(
      <Brush
        data={ sampleData }
        dataKey="speed_mph"
        height={ 72 }
        onChange={ () => undefined }
        range={ [0, 49] }
        testId="tall-brush"
      />
    );
    expect(screen.getByTestId('tall-brush')).toHaveStyle({ height: '72px' });
  });

  it('positions the window per the controlled range', () => {
    render(
      <Brush
        data={ sampleData }
        dataKey="speed_mph"
        onChange={ () => undefined }
        // 0 → 49 sample indices; pick the second quarter (~25 % to 50 %).
        range={ [12, 24] }
        testId="positioned-brush"
      />
    );
    const window = screen.getByTestId('positioned-brush-window');
    // 12 / 49 ≈ 24.49 %; 24 / 49 ≈ 48.98 %. Inline styles round to a few decimals
    // (jsdom preserves the exact string we passed).
    expect(window).toHaveStyle({ left: `${(12 / 49) * 100}%` });
  });

  it('renders the silhouette even when many rows lack the dataKey', () => {
    const sparseData: BrushDatum[] = sampleData.map((row, index) => (
      index % 3 === 0 ? row : { t: row.t, ts: row.ts }
    ));
    render(
      <Brush
        data={ sparseData }
        dataKey="speed_mph"
        onChange={ () => undefined }
        range={ [0, sparseData.length - 1] }
        testId="sparse-brush"
      />
    );
    expect(screen.getByTestId('sparse-brush')).toBeInTheDocument();
  });

  it('handles a one-sample dataset without throwing', () => {
    render(
      <Brush
        data={ [{ speed_mph: 0, t: 0, ts: 0 }] }
        dataKey="speed_mph"
        onChange={ () => undefined }
        range={ [0, 0] }
        testId="degenerate-brush"
      />
    );
    expect(screen.getByTestId('degenerate-brush')).toBeInTheDocument();
  });
});
