import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import type { SessionDataRow } from 'types/session';

import RawData from '.';

const makeRows = (count: number): SessionDataRow[] =>
  Array.from({ length: count }, (_, index) => ({
    coolant_f: 190,
    hp:        100 + index,
    lat:       45.60 + index * 0.0001,
    load:      40,
    lon:       -122.38 + index * 0.0001,
    rpm:       1500,
    speed_mph: 30,
    t:         index,
    throttle:  25,
    ts:        index * 1000
  }));

function renderRawData(data: readonly SessionDataRow[]) {
  return render(
    <MantineProvider>
      <RawData data={ data } testId="raw-data" />
    </MantineProvider>
  );
}

describe('pages/session-detail/raw-data', () => {
  it('renders the card wrapper', () => {
    renderRawData(makeRows(10));
    expect(screen.getByTestId('raw-data')).toBeInTheDocument();
  });

  it('renders the table', () => {
    renderRawData(makeRows(10));
    expect(screen.getByTestId('raw-data-table')).toBeInTheDocument();
  });

  it('renders an empty-state row when the session has no data', () => {
    renderRawData([]);
    expect(screen.getByTestId('raw-data-empty')).toBeInTheDocument();
  });

  it('renders one row per data point when the session fits on one page', () => {
    renderRawData(makeRows(5));
    expect(screen.getByTestId('raw-data-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('raw-data-row-4')).toBeInTheDocument();
  });

  it('omits the pagination control when the session fits on one page', () => {
    renderRawData(makeRows(20));
    expect(screen.queryByTestId('raw-data-pagination')).not.toBeInTheDocument();
  });

  it('renders the pagination control when the session spans multiple pages', () => {
    renderRawData(makeRows(120));
    expect(screen.getByTestId('raw-data-pagination')).toBeInTheDocument();
  });

  it('shows only the first page initially', () => {
    renderRawData(makeRows(120));
    expect(screen.getByTestId('raw-data-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('raw-data-row-49')).toBeInTheDocument();
    expect(screen.queryByTestId('raw-data-row-50')).not.toBeInTheDocument();
  });

  it('renders em-dashes for cells with missing PIDs', () => {
    renderRawData([{ t: 0, ts: 0 }]);
    const row = screen.getByTestId('raw-data-row-0');
    expect(row).toHaveTextContent('—');
  });
});
