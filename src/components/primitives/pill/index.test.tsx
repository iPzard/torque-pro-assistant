import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import Pill from '.';

function renderPill(node: React.ReactElement) {
  return render(<MantineProvider>{ node }</MantineProvider>);
}

describe('components/primitives/pill', () => {
  it('renders the label content', () => {
    renderPill(<Pill testId="example-pill">Connected</Pill>);
    expect(screen.getByTestId('example-pill')).toBeInTheDocument();
    expect(screen.getByTestId('example-pill-label')).toBeInTheDocument();
  });

  it('renders the status dot by default', () => {
    renderPill(<Pill testId="example-pill">Connected</Pill>);
    expect(screen.getByTestId('example-pill-dot')).toBeInTheDocument();
  });

  it('omits the dot when noDot is set', () => {
    renderPill(<Pill noDot testId="example-pill">2,418 rows</Pill>);
    expect(screen.queryByTestId('example-pill-dot')).not.toBeInTheDocument();
  });

  it('accepts each status variant without crashing', () => {
    for (const status of ['amber', 'err', 'neutral', 'ok', 'warn'] as const) {
      const { unmount } = renderPill(
        <Pill status={ status } testId={ `status-${status}` }>label</Pill>
      );
      expect(screen.getByTestId(`status-${status}`)).toBeInTheDocument();
      expect(screen.getByTestId(`status-${status}-dot`)).toBeInTheDocument();
      unmount();
    }
  });
});
