import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import StatusBar from '.';

function renderStatusBar(node: React.ReactElement, initialPath = '/') {
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={ [initialPath] }>{ node }</MemoryRouter>
    </MantineProvider>
  );
}

describe('components/app/status-bar', () => {
  it('renders READY / route / units segments', () => {
    renderStatusBar(<StatusBar testId="status" />);
    expect(screen.getByTestId('status')).toBeInTheDocument();
    expect(screen.getByTestId('status-ready')).toBeInTheDocument();
    expect(screen.getByTestId('status-route')).toBeInTheDocument();
    expect(screen.getByTestId('status-units')).toBeInTheDocument();
  });

  it('defaults the route label to Library on the root path', () => {
    renderStatusBar(<StatusBar testId="status" />, '/');
    expect(screen.getByTestId('status-route')).toHaveTextContent('Library');
  });

  it('shows the Compare label on /compare', () => {
    renderStatusBar(<StatusBar testId="status" />, '/compare');
    expect(screen.getByTestId('status-route')).toHaveTextContent('Compare');
  });

  it('shows the Import label on /import', () => {
    renderStatusBar(<StatusBar testId="status" />, '/import');
    expect(screen.getByTestId('status-route')).toHaveTextContent('Import');
  });

  it('defaults to Imperial units when no units prop is given', () => {
    renderStatusBar(<StatusBar testId="status" />);
    expect(screen.getByTestId('status-units')).toHaveTextContent('Imperial units');
  });

  it('renders Metric units when the units prop is set to metric', () => {
    renderStatusBar(<StatusBar testId="status" units="metric" />);
    expect(screen.getByTestId('status-units')).toHaveTextContent('Metric units');
  });

  it('falls back to Library for an unknown route', () => {
    renderStatusBar(<StatusBar testId="status" />, '/some-unknown-route');
    expect(screen.getByTestId('status-route')).toHaveTextContent('Library');
  });
});
