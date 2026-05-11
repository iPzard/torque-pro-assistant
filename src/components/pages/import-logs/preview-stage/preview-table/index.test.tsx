import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import type { SessionDataRow } from 'types/session';

import PreviewTable from '.';

const makeRow = (overrides: Partial<SessionDataRow>): SessionDataRow => ({
  t:  0,
  ts: 0,
  ...overrides
});

function renderTable(rows: readonly SessionDataRow[]) {
  return render(
    <MantineProvider>
      <PreviewTable rows={ rows } testId="preview-table" />
    </MantineProvider>
  );
}

describe('pages/import-logs/preview-stage/preview-table', () => {
  it('renders the card wrapper', () => {
    renderTable([makeRow({ rpm: 1500, speed_mph: 30, t: 0, ts: 1000 })]);
    expect(screen.getByTestId('preview-table')).toBeInTheDocument();
  });

  it('renders the table element', () => {
    renderTable([makeRow({ rpm: 1500, speed_mph: 30 })]);
    expect(screen.getByTestId('preview-table-table')).toBeInTheDocument();
  });

  it('caps the preview at the first ten rows', () => {
    const rows = Array.from({ length: 20 }, (_, index) =>
      makeRow({ rpm: 1500 + index, t: index, ts: index * 1000 })
    );
    renderTable(rows);
    expect(screen.getByTestId('preview-table-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('preview-table-row-9')).toBeInTheDocument();
    expect(screen.queryByTestId('preview-table-row-10')).not.toBeInTheDocument();
  });

  it('renders the empty-state row when no rows are present', () => {
    renderTable([]);
    expect(screen.getByTestId('preview-table-empty')).toBeInTheDocument();
  });

  it('renders em-dashes for cells with missing PIDs', () => {
    renderTable([makeRow({})]);
    const row = screen.getByTestId('preview-table-row-0');
    expect(row).toHaveTextContent('—');
  });
});
