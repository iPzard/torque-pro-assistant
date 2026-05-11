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
    renderStatusBar(<StatusBar testId="status" units="imperial" />);
    expect(screen.getByTestId('status')).toBeInTheDocument();
    expect(screen.getByTestId('status-ready')).toBeInTheDocument();
    expect(screen.getByTestId('status-route')).toBeInTheDocument();
    expect(screen.getByTestId('status-units')).toBeInTheDocument();
  });

  it('defaults the route label to Library on the root path', () => {
    renderStatusBar(<StatusBar testId="status" units="imperial" />, '/');
    expect(screen.getByTestId('status-route')).toHaveTextContent('Library');
  });

  it('shows the Compare label on /compare', () => {
    renderStatusBar(<StatusBar testId="status" units="imperial" />, '/compare');
    expect(screen.getByTestId('status-route')).toHaveTextContent('Compare');
  });

  it('shows the Import label on /import', () => {
    renderStatusBar(<StatusBar testId="status" units="imperial" />, '/import');
    expect(screen.getByTestId('status-route')).toHaveTextContent('Import');
  });

  it('shows the Session label on /sessions/:id', () => {
    renderStatusBar(<StatusBar testId="status" units="imperial" />, '/sessions/s_1_drive');
    expect(screen.getByTestId('status-route')).toHaveTextContent('Session');
  });

  it('renders Imperial units when units prop is imperial', () => {
    renderStatusBar(<StatusBar testId="status" units="imperial" />);
    expect(screen.getByTestId('status-units')).toHaveTextContent('Imperial units');
  });

  it('renders Metric units when units prop is metric', () => {
    renderStatusBar(<StatusBar testId="status" units="metric" />);
    expect(screen.getByTestId('status-units')).toHaveTextContent('Metric units');
  });

  it('renders the UTC offset segment', () => {
    renderStatusBar(<StatusBar testId="status" units="imperial" />);
    expect(screen.getByTestId('status-utc')).toHaveTextContent(/UTC[+-]\d+/);
  });

  it('renders the fps sentinel segment', () => {
    renderStatusBar(<StatusBar testId="status" units="imperial" />);
    expect(screen.getByTestId('status-fps')).toHaveTextContent('120 fps');
  });

  it('falls back to Library for an unknown route', () => {
    renderStatusBar(<StatusBar testId="status" units="imperial" />, '/some-unknown-route');
    expect(screen.getByTestId('status-route')).toHaveTextContent('Library');
  });
});
