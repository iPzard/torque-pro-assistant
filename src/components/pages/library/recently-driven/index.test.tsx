import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import type { Session, SessionSummary } from 'types/session';

import RecentlyDriven from '.';

const makeSession = (overrides: Partial<Session['meta']> = {}): Session => ({
  data: [
    { rpm: 1500, speed_mph: 30, t: 0, ts: 1_730_127_051_000 },
    { rpm: 4500, speed_mph: 80, t: 5, ts: 1_730_127_056_000 }
  ],
  meta: {
    duration:  5,
    fileName:  'drive.csv',
    fileSize:  1024,
    gpsStart:  { lat: 0, lon: 0 },
    id:        's_default',
    name:      'drive',
    notes:     '',
    startedAt: '2024-10-28T13:50:51.000Z',
    vehicle:   { make: '', model: '', vin: '', year: 0 },
    ...overrides
  }
});

const makeSummary = (overrides: Partial<SessionSummary> = {}): SessionSummary => ({
  avgMpg:   21.4,
  dist:     124.6,
  duration: 5,
  maxBoost: 0,
  maxCool:  205,
  maxSpeed: 80,
  peakHp:   200,
  peakTq:   200,
  t0to30:   null,
  t0to60:   7.1,
  ...overrides
});

const makeRow = (
  id: string,
  startedAt: string
): { session: Session; summary: SessionSummary } => ({
  session: makeSession({ id, startedAt }),
  summary: makeSummary()
});

function renderRecentlyDriven(rows: readonly { session: Session; summary: SessionSummary }[]) {
  return render(
    <MemoryRouter initialEntries={ ['/library'] }>
      <Routes>
        <Route element={ <RecentlyDriven rows={ rows } testId="recent" units="imperial" /> } path="/library" />
        <Route element={ <div data-testid="session-route-sentinel" /> } path="/sessions/:id" />
      </Routes>
    </MemoryRouter>
  );
}

describe('pages/library/recently-driven', () => {
  it('renders nothing when rows is empty', () => {
    renderRecentlyDriven([]);
    expect(screen.queryByTestId('recent')).not.toBeInTheDocument();
  });

  it('renders the section title when at least one row is present', () => {
    renderRecentlyDriven([makeRow('s_1', '2024-10-28T13:50:51.000Z')]);
    expect(screen.getByTestId('recent-title')).toBeInTheDocument();
  });

  it('renders up to three cards, in input order', () => {
    renderRecentlyDriven([
      makeRow('s_1', '2025-03-01T00:00:00.000Z'),
      makeRow('s_2', '2024-12-01T00:00:00.000Z'),
      makeRow('s_3', '2024-09-01T00:00:00.000Z'),
      makeRow('s_4', '2024-06-01T00:00:00.000Z')
    ]);
    expect(screen.getByTestId('recent-card-s_1')).toBeInTheDocument();
    expect(screen.getByTestId('recent-card-s_2')).toBeInTheDocument();
    expect(screen.getByTestId('recent-card-s_3')).toBeInTheDocument();
    expect(screen.queryByTestId('recent-card-s_4')).not.toBeInTheDocument();
  });

  it('renders the Dist / Max / 0-60 KV tiles per card', () => {
    renderRecentlyDriven([makeRow('s_1', '2024-10-28T13:50:51.000Z')]);
    expect(screen.getByTestId('recent-card-s_1-dist')).toHaveTextContent('mi');
    expect(screen.getByTestId('recent-card-s_1-max')).toHaveTextContent('mph');
    expect(screen.getByTestId('recent-card-s_1-zero-to-sixty')).toHaveTextContent('7.1s');
  });

  it('clicking a card navigates to that session', async () => {
    const user = userEvent.setup();
    renderRecentlyDriven([makeRow('s_1', '2024-10-28T13:50:51.000Z')]);
    await user.click(screen.getByTestId('recent-card-s_1'));
    expect(screen.getByTestId('session-route-sentinel')).toBeInTheDocument();
  });
});
