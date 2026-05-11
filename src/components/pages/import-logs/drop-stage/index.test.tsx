import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import DropStage from '.';

function renderDropStage(busy = false, onDrop: (file: File) => void = jest.fn()) {
  return render(
    <MantineProvider>
      <DropStage busy={ busy } onDrop={ onDrop } testId="drop-stage" />
    </MantineProvider>
  );
}

describe('pages/import-logs/drop-stage', () => {
  it('renders the dropzone wrapper', () => {
    renderDropStage();
    expect(screen.getByTestId('drop-stage')).toBeInTheDocument();
  });

  it('shows the default headline when idle', () => {
    renderDropStage(false);
    expect(screen.getByTestId('drop-stage-headline')).toHaveTextContent('Drop CSV here');
  });

  it('shows the parsing headline when busy', () => {
    renderDropStage(true);
    expect(screen.getByTestId('drop-stage-headline')).toHaveTextContent('Parsing');
  });

  it('shows the size-limit hint when idle', () => {
    renderDropStage(false);
    expect(screen.getByTestId('drop-stage-hint')).toHaveTextContent('200 MB');
  });
});
