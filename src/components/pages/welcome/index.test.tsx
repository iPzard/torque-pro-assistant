import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import Welcome from '.';

function renderWelcome() {
  return render(
    <MemoryRouter initialEntries={ ['/library'] }>
      <Routes>
        <Route element={ <Welcome /> } path="/library" />
        <Route element={ <div data-testid="settings-route-sentinel" /> } path="/settings" />
        <Route element={ <div data-testid="import-route-sentinel" /> } path="/import" />
      </Routes>
    </MemoryRouter>
  );
}

describe('pages/welcome', () => {
  it('renders the page wrapper', () => {
    renderWelcome();
    expect(screen.getByTestId('welcome-page')).toBeInTheDocument();
  });

  it('renders the title with the amber Pro tag', () => {
    renderWelcome();
    expect(screen.getByTestId('welcome-title')).toHaveTextContent('Welcome to');
    expect(screen.getByTestId('welcome-title')).toHaveTextContent('TorquePro Assistant');
  });

  it('renders the three-step intro card grid', () => {
    renderWelcome();
    expect(screen.getByTestId('welcome-steps')).toBeInTheDocument();
  });

  it('renders the sample.csv download card', () => {
    renderWelcome();
    expect(screen.getByTestId('welcome-sample-card')).toBeInTheDocument();
    expect(screen.getByTestId('welcome-sample-download-button')).toBeInTheDocument();
  });

  it('renders the version + privacy meta line', () => {
    renderWelcome();
    expect(screen.getByTestId('welcome-footer-meta')).toHaveTextContent('v0.4.2');
  });

  it('the primary CTA routes to /settings', async () => {
    const user = userEvent.setup();
    renderWelcome();
    await user.click(screen.getByTestId('welcome-add-vehicle-button'));
    expect(screen.getByTestId('settings-route-sentinel')).toBeInTheDocument();
  });

  it('the ghost CTA routes to /import', async () => {
    const user = userEvent.setup();
    renderWelcome();
    await user.click(screen.getByTestId('welcome-skip-button'));
    expect(screen.getByTestId('import-route-sentinel')).toBeInTheDocument();
  });
});
