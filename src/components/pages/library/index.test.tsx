import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import Library from '.';

// Library renders a heading and a CTA that should navigate to /import.
// We mount it inside a MemoryRouter with a probe route at /import so the
// navigation can be observed by reading the screen rather than mocking
// useNavigate — keeps the assertion behavioural.
function renderLibrary() {
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={ ['/library'] }>
        <Routes>
          <Route element={ <Library /> } path="/library" />
          <Route element={ <div>IMPORT_ROUTE_PROBE</div> } path="/import" />
        </Routes>
      </MemoryRouter>
    </MantineProvider>
  );
}

describe('pages/library', () => {
  test('renders the page heading', () => {
    renderLibrary();
    expect(
      screen.getByRole('heading', { level: 2, name: /library/i })
    ).toBeInTheDocument();
  });

  test('shows the placeholder copy', () => {
    renderLibrary();
    expect(screen.getByText(/imported sessions will land here/i)).toBeInTheDocument();
  });

  test('Import CSV button is present and accessible by name', () => {
    renderLibrary();
    expect(screen.getByRole('button', { name: /import csv/i })).toBeInTheDocument();
  });

  test('clicking Import CSV navigates to /import', async () => {
    const user = userEvent.setup();
    renderLibrary();
    await user.click(screen.getByRole('button', { name: /import csv/i }));
    expect(screen.getByText('IMPORT_ROUTE_PROBE')).toBeInTheDocument();
  });
});
