import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import type { SessionMeta } from 'types/session';

import RecentlyDriven from '.';

const makeMeta = (overrides: Partial<SessionMeta>): SessionMeta => ({
  duration:  60,
  fileName:  'drive.csv',
  fileSize:  1_572_864,
  gpsStart:  { lat: 0, lon: 0 },
  id:        's_default',
  name:      'drive',
  notes:     '',
  startedAt: '2024-10-28T13:50:51.000Z',
  vehicle:   { make: '', model: '', vin: '', year: 0 },
  ...overrides
});

function renderRecentlyDriven(sessions: readonly SessionMeta[]) {
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={ ['/library'] }>
        <Routes>
          <Route element={ <RecentlyDriven sessions={ sessions } testId="recent" /> } path="/library" />
          <Route element={ <div data-testid="session-route-sentinel" /> } path="/sessions/:id" />
        </Routes>
      </MemoryRouter>
    </MantineProvider>
  );
}

describe('pages/library/recently-driven', () => {
  it('renders nothing when sessions is empty', () => {
    renderRecentlyDriven([]);
    expect(screen.queryByTestId('recent')).not.toBeInTheDocument();
  });

  it('renders the strip wrapper when at least one session is present', () => {
    renderRecentlyDriven([makeMeta({ id: 's_1' })]);
    expect(screen.getByTestId('recent')).toBeInTheDocument();
  });

  it('renders up to four cards, picking the most recent by startedAt', () => {
    renderRecentlyDriven([
      makeMeta({ id: 's_1', name: 'a', startedAt: '2024-01-01T00:00:00.000Z' }),
      makeMeta({ id: 's_2', name: 'b', startedAt: '2024-06-01T00:00:00.000Z' }),
      makeMeta({ id: 's_3', name: 'c', startedAt: '2024-09-01T00:00:00.000Z' }),
      makeMeta({ id: 's_4', name: 'd', startedAt: '2024-12-01T00:00:00.000Z' }),
      makeMeta({ id: 's_5', name: 'e', startedAt: '2025-03-01T00:00:00.000Z' })
    ]);
    expect(screen.getByTestId('recent-card-s_5')).toBeInTheDocument();
    expect(screen.getByTestId('recent-card-s_4')).toBeInTheDocument();
    expect(screen.getByTestId('recent-card-s_3')).toBeInTheDocument();
    expect(screen.getByTestId('recent-card-s_2')).toBeInTheDocument();
    expect(screen.queryByTestId('recent-card-s_1')).not.toBeInTheDocument();
  });

  it('clicking a card navigates to that session', async () => {
    const user = userEvent.setup();
    renderRecentlyDriven([makeMeta({ id: 's_1', name: 'drive' })]);
    await user.click(screen.getByTestId('recent-card-s_1'));
    expect(screen.getByTestId('session-route-sentinel')).toBeInTheDocument();
  });
});
