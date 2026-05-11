import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import NotFound from '.';

function renderNotFound(routeId: string) {
  render(
    <MemoryRouter initialEntries={ ['/sessions/missing'] }>
      <Routes>
        <Route
          element={ <NotFound routeId={ routeId } testId="not-found" /> }
          path="/sessions/:id"
        />
        <Route element={ <div data-testid="library-sentinel" /> } path="/library" />
        <Route element={ <div data-testid="import-sentinel" /> } path="/import" />
      </Routes>
    </MemoryRouter>
  );
}

describe('pages/session-detail/not-found', () => {
  it('renders the takeover with code + tag + headline', () => {
    renderNotFound('abc');
    expect(screen.getByTestId('not-found')).toBeInTheDocument();
    expect(screen.getByTestId('not-found-code')).toHaveTextContent('404');
    expect(screen.getByTestId('not-found-tag')).toHaveTextContent('Session not found');
    expect(screen.getByTestId('not-found-headline')).toBeInTheDocument();
  });

  it('embeds the routeId in the mono trace card', () => {
    renderNotFound('zzz_missing');
    expect(screen.getByTestId('not-found-trace')).toHaveTextContent('/sessions/zzz_missing');
    expect(screen.getByTestId('not-found-trace')).toHaveTextContent('404');
  });

  it('Back to Library navigates to /library', async () => {
    const user = userEvent.setup();
    renderNotFound('abc');
    await user.click(screen.getByTestId('not-found-back'));
    expect(screen.getByTestId('library-sentinel')).toBeInTheDocument();
  });

  it('Import a CSV navigates to /import', async () => {
    const user = userEvent.setup();
    renderNotFound('abc');
    await user.click(screen.getByTestId('not-found-import'));
    expect(screen.getByTestId('import-sentinel')).toBeInTheDocument();
  });
});
