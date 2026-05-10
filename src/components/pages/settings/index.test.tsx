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
  it('renders the page wrapper', () => {
    renderSettings();
    expect(screen.getByTestId('settings-page')).toBeInTheDocument();
  });

  it('renders the page heading', () => {
    renderSettings();
    expect(screen.getByTestId('settings-page-title')).toBeInTheDocument();
  });

  it('renders the placeholder description', () => {
    renderSettings();
    expect(screen.getByTestId('settings-page-description')).toBeInTheDocument();
  });
});
