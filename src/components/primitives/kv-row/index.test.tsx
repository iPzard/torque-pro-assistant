import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import KvRow from '.';

function renderRow(node: React.ReactElement) {
  return render(<MantineProvider>{ node }</MantineProvider>);
}

describe('components/primitives/kv-row', () => {
  it('renders the label and value', () => {
    renderRow(<KvRow label="Driving time" testId="trip-driving" value="20m 14s" />);
    expect(screen.getByTestId('trip-driving')).toBeInTheDocument();
    expect(screen.getByTestId('trip-driving-label')).toBeInTheDocument();
    expect(screen.getByTestId('trip-driving-value')).toBeInTheDocument();
  });

  it('accepts ReactNode label and value', () => {
    renderRow(
      <KvRow
        label={ <span data-testid="custom-label-node">Idle time</span> }
        testId="trip-idle"
        value={ <span data-testid="custom-value-node">3m 28s</span> }
      />
    );
    expect(screen.getByTestId('custom-label-node')).toBeInTheDocument();
    expect(screen.getByTestId('custom-value-node')).toBeInTheDocument();
  });
});
