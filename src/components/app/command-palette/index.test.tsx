import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import CommandPalette from '.';

function renderPalette(opened: boolean, onClose: () => void = jest.fn()) {
  return render(
    <MantineProvider>
      <CommandPalette onClose={ onClose } opened={ opened } testId="command-palette" />
    </MantineProvider>
  );
}

describe('components/app/command-palette', () => {
  it('renders the modal when opened', () => {
    renderPalette(true);
    expect(screen.getByTestId('command-palette')).toBeInTheDocument();
  });
});
