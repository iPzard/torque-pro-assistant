import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import CompareLogs from '.';

function renderCompareLogs() {
  return render(
    <MantineProvider>
      <CompareLogs />
    </MantineProvider>
  );
}

describe('pages/compare-logs', () => {
  it('renders the page wrapper', () => {
    renderCompareLogs();
    expect(screen.getByTestId('compare-logs-page')).toBeInTheDocument();
  });

  it('renders the page heading', () => {
    renderCompareLogs();
    expect(screen.getByTestId('compare-logs-page-title')).toBeInTheDocument();
  });

  it('renders the placeholder description', () => {
    renderCompareLogs();
    expect(screen.getByTestId('compare-logs-page-description')).toBeInTheDocument();
  });
});
