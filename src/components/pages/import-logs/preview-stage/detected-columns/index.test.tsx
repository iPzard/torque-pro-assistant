import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import type { ColumnDetection } from 'utils';

import DetectedColumns from '.';

function renderColumns(columns: readonly ColumnDetection[]) {
  return render(
    <MantineProvider>
      <DetectedColumns columns={ columns } testId="columns" />
    </MantineProvider>
  );
}

describe('pages/import-logs/preview-stage/detected-columns', () => {
  it('renders the card wrapper', () => {
    renderColumns([{ header: 'Speed (OBD)(mph)', mappedTo: 'speed_mph' }]);
    expect(screen.getByTestId('columns')).toBeInTheDocument();
  });

  it('renders one row per supplied column', () => {
    renderColumns([
      { header: 'Speed (OBD)(mph)',     mappedTo: 'speed_mph' },
      { header: 'Engine RPM(rpm)',      mappedTo: 'rpm' },
      { header: 'Unknown vendor PID',   mappedTo: null }
    ]);
    expect(screen.getByTestId('columns-row-Speed (OBD)(mph)')).toBeInTheDocument();
    expect(screen.getByTestId('columns-row-Engine RPM(rpm)')).toBeInTheDocument();
    expect(screen.getByTestId('columns-row-Unknown vendor PID')).toBeInTheDocument();
  });

  it('renders the empty-state when no columns are supplied', () => {
    renderColumns([]);
    expect(screen.getByTestId('columns-empty')).toBeInTheDocument();
  });

  it('labels unrecognized columns with the placeholder string', () => {
    renderColumns([{ header: 'Mystery PID', mappedTo: null }]);
    const row = screen.getByTestId('columns-row-Mystery PID');
    expect(row).toHaveTextContent('unrecognized');
  });
});
