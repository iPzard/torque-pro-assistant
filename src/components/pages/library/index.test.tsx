import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import Library from '.';

// Library renders a heading and a CTA that should navigate to /import.
// We mount it inside a MemoryRouter with a probe route at /import so the
// navigation can be observed by reading the sentinel — keeps the assertion
// behavioural without rendering the real Import page.
function renderLibrary() {
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={ ['/library'] }>
        <Routes>
          <Route element={ <Library /> } path="/library" />
          <Route element={ <div data-testid="import-route-sentinel" /> } path="/import" />
        </Routes>
      </MemoryRouter>
    </MantineProvider>
  );
}

describe('pages/library', () => {
  it('renders the page heading', () => {
    renderLibrary();
    expect(screen.getByTestId('library-page-title')).toBeInTheDocument();
  });

  it('shows the placeholder copy', () => {
    renderLibrary();
    expect(screen.getByTestId('library-page-description')).toBeInTheDocument();
  });

  it('Import CSV button is present', () => {
    renderLibrary();
    expect(screen.getByTestId('library-import-button')).toBeInTheDocument();
  });

  it('clicking Import CSV navigates to /import', async () => {
    const user = userEvent.setup();
    renderLibrary();
    await user.click(screen.getByTestId('library-import-button'));
    expect(screen.getByTestId('import-route-sentinel')).toBeInTheDocument();
  });
});
