import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import type { LibrarySort } from 'components/pages/library/utils';
import type { SessionMeta } from 'types/session';

import SessionsTable from '.';

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

function renderTable(
  sessions: readonly SessionMeta[],
  sort: LibrarySort = { key: 'startedAt', order: 'desc' },
  onSortChange: (next: LibrarySort) => void = jest.fn()
) {
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={ ['/library'] }>
        <Routes>
          <Route
            element={
              <SessionsTable
                onSortChange={ onSortChange }
                sessions={ sessions }
                sort={ sort }
                testId="sessions-table"
              />
            }
            path="/library"
          />
          <Route element={ <div data-testid="session-route-sentinel" /> } path="/sessions/:id" />
        </Routes>
      </MemoryRouter>
    </MantineProvider>
  );
}

describe('pages/library/sessions-table', () => {
  it('renders the table', () => {
    renderTable([makeMeta({ id: 's_1' })]);
    expect(screen.getByTestId('sessions-table')).toBeInTheDocument();
  });

  it('renders a row per session', () => {
    renderTable([makeMeta({ id: 's_1' }), makeMeta({ id: 's_2' })]);
    expect(screen.getByTestId('sessions-table-row-s_1')).toBeInTheDocument();
    expect(screen.getByTestId('sessions-table-row-s_2')).toBeInTheDocument();
  });

  it('renders a no-matches row when the input is empty', () => {
    renderTable([]);
    expect(screen.getByTestId('sessions-table-no-matches')).toBeInTheDocument();
  });

  it('renders sortable column headers', () => {
    renderTable([makeMeta({ id: 's_1' })]);
    expect(screen.getByTestId('sessions-table-header-name')).toBeInTheDocument();
    expect(screen.getByTestId('sessions-table-header-startedAt')).toBeInTheDocument();
    expect(screen.getByTestId('sessions-table-header-duration')).toBeInTheDocument();
    expect(screen.getByTestId('sessions-table-header-fileSize')).toBeInTheDocument();
  });

  it('clicking an inactive column header sorts ascending by it', async () => {
    const onSortChange = jest.fn();
    const user = userEvent.setup();
    renderTable([makeMeta({ id: 's_1' })], { key: 'name', order: 'asc' }, onSortChange);
    await user.click(screen.getByTestId('sessions-table-header-duration'));
    expect(onSortChange).toHaveBeenCalledWith({ key: 'duration', order: 'asc' });
  });

  it('clicking the active column header flips the direction', async () => {
    const onSortChange = jest.fn();
    const user = userEvent.setup();
    renderTable([makeMeta({ id: 's_1' })], { key: 'name', order: 'asc' }, onSortChange);
    await user.click(screen.getByTestId('sessions-table-header-name'));
    expect(onSortChange).toHaveBeenCalledWith({ key: 'name', order: 'desc' });
  });

  it('clicking a row navigates to that session', async () => {
    const user = userEvent.setup();
    renderTable([makeMeta({ id: 's_1' })]);
    await user.click(screen.getByTestId('sessions-table-row-s_1'));
    expect(screen.getByTestId('session-route-sentinel')).toBeInTheDocument();
  });
});
