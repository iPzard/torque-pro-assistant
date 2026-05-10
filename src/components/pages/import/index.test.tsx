import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import Import from '.';

function renderImport() {
  return render(
    <MantineProvider>
      <Import />
    </MantineProvider>
  );
}

describe('pages/import', () => {
  test('renders the page heading', () => {
    renderImport();
    expect(
      screen.getByRole('heading', { level: 2, name: /import session/i })
    ).toBeInTheDocument();
  });

  test('shows the dropzone instruction copy', () => {
    renderImport();
    expect(screen.getByText(/drop a torque pro csv export/i)).toBeInTheDocument();
    expect(screen.getByText(/drop csv here/i)).toBeInTheDocument();
  });

  test('shows the size limit hint', () => {
    renderImport();
    expect(screen.getByText(/up to 200 mb/i)).toBeInTheDocument();
  });
});
