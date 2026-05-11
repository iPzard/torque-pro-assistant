import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import NoSessionsEmpty from '.';

function renderEmpty() {
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={ ['/compare'] }>
        <Routes>
          <Route element={ <NoSessionsEmpty testId="no-sessions" /> } path="/compare" />
          <Route element={ <div data-testid="import-sentinel" /> } path="/import" />
        </Routes>
      </MemoryRouter>
    </MantineProvider>
  );
}

describe('pages/compare-logs/no-sessions-empty', () => {
  it('renders the card + headline + copy', () => {
    renderEmpty();
    expect(screen.getByTestId('no-sessions')).toBeInTheDocument();
    expect(screen.getByTestId('no-sessions-headline')).toHaveTextContent('at least two sessions');
    expect(screen.getByTestId('no-sessions-copy')).toBeInTheDocument();
  });

  it('Import a session navigates to /import', async () => {
    const user = userEvent.setup();
    renderEmpty();
    await user.click(screen.getByTestId('no-sessions-import'));
    expect(screen.getByTestId('import-sentinel')).toBeInTheDocument();
  });
});
