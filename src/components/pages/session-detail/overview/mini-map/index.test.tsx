import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import type { SessionDataRow } from 'types/session';

import MiniMap from '.';

/** Build a synthetic row with optional GPS. */
const makeRow = (overrides: Partial<SessionDataRow>): SessionDataRow => ({
  t:  0,
  ts: 0,
  ...overrides
});

const makeGpsRows = (count: number): SessionDataRow[] =>
  Array.from({ length: count }, (_, index) =>
    makeRow({
      lat: 45.60 + index * 0.001,
      lon: -122.38 + index * 0.001,
      t:   index,
      ts:  index * 1000
    })
  );

function renderMiniMap(data: readonly SessionDataRow[]) {
  return render(
    <MantineProvider>
      <MiniMap data={ data } testId="mini-map" />
    </MantineProvider>
  );
}

describe('pages/session-detail/overview/mini-map', () => {
  it('renders the card wrapper', () => {
    renderMiniMap(makeGpsRows(10));
    expect(screen.getByTestId('mini-map')).toBeInTheDocument();
  });

  it('renders the route SVG when GPS data is present', () => {
    renderMiniMap(makeGpsRows(10));
    expect(screen.getByTestId('mini-map-svg')).toBeInTheDocument();
    expect(screen.getByTestId('mini-map-route')).toBeInTheDocument();
  });

  it('renders start + end markers when GPS data is present', () => {
    renderMiniMap(makeGpsRows(10));
    expect(screen.getByTestId('mini-map-start')).toBeInTheDocument();
    expect(screen.getByTestId('mini-map-end')).toBeInTheDocument();
  });

  it('renders the empty-state placeholder when no rows carry GPS', () => {
    renderMiniMap([makeRow({ rpm: 800 }), makeRow({ rpm: 900 })]);
    expect(screen.getByTestId('mini-map-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('mini-map-svg')).not.toBeInTheDocument();
  });

  it('renders the empty-state when only one row carries GPS', () => {
    renderMiniMap([makeRow({ lat: 45.60, lon: -122.38 })]);
    expect(screen.getByTestId('mini-map-empty')).toBeInTheDocument();
  });
});
