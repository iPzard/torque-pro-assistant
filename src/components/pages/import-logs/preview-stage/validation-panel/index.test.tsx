import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import type { ValidationFlag } from 'components/pages/import-logs/utils';

import ValidationPanel from '.';

function renderPanel(flags: readonly ValidationFlag[]) {
  return render(
    <MantineProvider>
      <ValidationPanel flags={ flags } testId="validation" />
    </MantineProvider>
  );
}

describe('pages/import-logs/preview-stage/validation-panel', () => {
  it('renders the card wrapper', () => {
    renderPanel([{ id: 'row-count', level: 'info', message: '20 rows.' }]);
    expect(screen.getByTestId('validation')).toBeInTheDocument();
  });

  it('renders one row per flag', () => {
    renderPanel([
      { id: 'row-count', level: 'info', message: '20 rows.' },
      { id: 'gps',       level: 'warn', message: 'No GPS samples.' }
    ]);
    expect(screen.getByTestId('validation-row-row-count')).toBeInTheDocument();
    expect(screen.getByTestId('validation-row-gps')).toBeInTheDocument();
  });

  it('renders a colored dot per flag', () => {
    renderPanel([
      { id: 'row-count', level: 'info',  message: '20 rows.' },
      { id: 'monotonic', level: 'warn',  message: 'Backward jump.' },
      { id: 'rows',      level: 'error', message: 'No rows.' }
    ]);
    expect(screen.getByTestId('validation-dot-row-count')).toBeInTheDocument();
    expect(screen.getByTestId('validation-dot-monotonic')).toBeInTheDocument();
    expect(screen.getByTestId('validation-dot-rows')).toBeInTheDocument();
  });
});
