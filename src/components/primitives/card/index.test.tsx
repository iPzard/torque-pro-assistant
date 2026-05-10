import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import Card from '.';

function renderCard(node: React.ReactElement) {
  return render(<MantineProvider>{ node }</MantineProvider>);
}

describe('components/primitives/card', () => {
  it('renders children inside the body', () => {
    renderCard(
      <Card testId="example-card">
        <span data-testid="example-card-content">hello</span>
      </Card>
    );
    expect(screen.getByTestId('example-card')).toBeInTheDocument();
    expect(screen.getByTestId('example-card-body')).toBeInTheDocument();
    expect(screen.getByTestId('example-card-content')).toBeInTheDocument();
  });

  it('hides the header bar when neither title nor actions are provided', () => {
    renderCard(
      <Card testId="example-card">
        <span data-testid="example-card-content">body only</span>
      </Card>
    );
    expect(screen.queryByTestId('example-card-title')).not.toBeInTheDocument();
    expect(screen.queryByTestId('example-card-actions')).not.toBeInTheDocument();
  });

  it('renders the title when provided', () => {
    renderCard(
      <Card testId="example-card" title={ <span data-testid="custom-title">Speed & RPM</span> }>
        <span>body</span>
      </Card>
    );
    expect(screen.getByTestId('example-card-title')).toBeInTheDocument();
    expect(screen.getByTestId('custom-title')).toBeInTheDocument();
  });

  it('renders the subtitle next to the title when provided', () => {
    renderCard(
      <Card
        subtitle={ <span data-testid="custom-subtitle">primary trace</span> }
        testId="example-card"
        title="Speed & RPM"
      >
        <span>body</span>
      </Card>
    );
    expect(screen.getByTestId('example-card-subtitle')).toBeInTheDocument();
    expect(screen.getByTestId('custom-subtitle')).toBeInTheDocument();
  });

  it('renders actions on the right side of the header', () => {
    renderCard(
      <Card
        actions={ <button data-testid="custom-action" type="button">Reset</button> }
        testId="example-card"
        title="Charts"
      >
        <span>body</span>
      </Card>
    );
    expect(screen.getByTestId('example-card-actions')).toBeInTheDocument();
    expect(screen.getByTestId('custom-action')).toBeInTheDocument();
  });
});
