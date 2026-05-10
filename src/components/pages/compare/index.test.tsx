import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import Compare from '.';

function renderCompare() {
  return render(
    <MantineProvider>
      <Compare />
    </MantineProvider>
  );
}

describe('pages/compare', () => {
  test('renders the page heading', () => {
    renderCompare();
    expect(
      screen.getByRole('heading', { level: 2, name: /compare/i })
    ).toBeInTheDocument();
  });

  test('shows the placeholder copy', () => {
    renderCompare();
    expect(screen.getByText(/side-by-side session comparison/i)).toBeInTheDocument();
  });
});
