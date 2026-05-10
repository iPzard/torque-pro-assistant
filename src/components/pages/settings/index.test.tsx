import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import Settings from '.';

function renderSettings() {
  return render(
    <MantineProvider>
      <Settings />
    </MantineProvider>
  );
}

describe('pages/settings', () => {
  test('renders the page heading', () => {
    renderSettings();
    expect(
      screen.getByRole('heading', { level: 2, name: /settings/i })
    ).toBeInTheDocument();
  });

  test('shows the placeholder copy', () => {
    renderSettings();
    expect(screen.getByText(/theme, units, and vehicle defaults/i)).toBeInTheDocument();
  });
});
