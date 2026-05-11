import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import type { Session, SessionDataRow } from 'types/session';

import PickStage from '.';

const makeRow = (overrides: Partial<SessionDataRow>): SessionDataRow => ({
  t:  0,
  ts: 0,
  ...overrides
});

const makeSession = (id: string, name: string, fileName = `${ name }.csv`): Session => ({
  data: [
    makeRow({ rpm: 1500, speed_mph: 30, t: 0 }),
    makeRow({ rpm: 4500, speed_mph: 80, t: 5 })
  ],
  meta: {
    duration:  5,
    fileName,
    fileSize:  1024,
    gpsStart:  { lat: 0, lon: 0 },
    id,
    name,
    notes:     '',
    startedAt: '2024-10-28T13:50:51.000Z',
    vehicle:   { make: '', model: '', vin: '', year: 0 }
  }
});

const COLORS = ['var(--accent)', 'var(--d-speed)', 'var(--d-load)', '#c084fc'];

function renderPicker(
  sessions: readonly Session[],
  options: { onPick?: (ids: readonly string[]) => void; seededIds?: readonly string[] } = {}
) {
  const onPick = options.onPick ?? jest.fn();
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={ ['/compare'] }>
        <PickStage
          colors={ COLORS }
          max={ 4 }
          onPick={ onPick }
          seededIds={ options.seededIds ?? [] }
          sessions={ sessions }
          testId="picker"
          units="imperial"
        />
      </MemoryRouter>
    </MantineProvider>
  );
}

describe('pages/compare-logs/pick-stage', () => {
  it('renders the picker grid + counter', () => {
    renderPicker([makeSession('s_1', 'run-a')]);
    expect(screen.getByTestId('picker')).toBeInTheDocument();
    expect(screen.getByTestId('picker-counter')).toHaveTextContent('0/4');
  });

  it('renders one row per session', () => {
    renderPicker([makeSession('s_1', 'run-a'), makeSession('s_2', 'run-b')]);
    expect(screen.getByTestId('picker-row-s_1')).toBeInTheDocument();
    expect(screen.getByTestId('picker-row-s_2')).toBeInTheDocument();
  });

  it('clicking a row toggles it into the picked set', async () => {
    const user = userEvent.setup();
    renderPicker([makeSession('s_1', 'run-a')]);
    await user.click(screen.getByTestId('picker-row-s_1'));
    expect(screen.getByTestId('picker-counter')).toHaveTextContent('1/4');
  });

  it('Compare button is disabled until at least two are picked', async () => {
    const user = userEvent.setup();
    renderPicker([makeSession('s_1', 'a'), makeSession('s_2', 'b')]);
    expect(screen.getByTestId('picker-compare')).toBeDisabled();
    await user.click(screen.getByTestId('picker-row-s_1'));
    expect(screen.getByTestId('picker-compare')).toBeDisabled();
    await user.click(screen.getByTestId('picker-row-s_2'));
    expect(screen.getByTestId('picker-compare')).toBeEnabled();
  });

  it('one-picked state shows the warn need-more line', async () => {
    const user = userEvent.setup();
    renderPicker([makeSession('s_1', 'a'), makeSession('s_2', 'b')]);
    await user.click(screen.getByTestId('picker-row-s_1'));
    expect(screen.getByTestId('picker-need-more')).toBeInTheDocument();
  });

  it('Compare button hands the picked ids up via onPick', async () => {
    const user = userEvent.setup();
    const onPick = jest.fn();
    renderPicker([makeSession('s_1', 'a'), makeSession('s_2', 'b')], { onPick });
    await user.click(screen.getByTestId('picker-row-s_1'));
    await user.click(screen.getByTestId('picker-row-s_2'));
    await user.click(screen.getByTestId('picker-compare'));
    expect(onPick).toHaveBeenCalledWith(['s_1', 's_2']);
  });

  it('search filters the list', async () => {
    const user = userEvent.setup();
    renderPicker([makeSession('s_1', 'morning-drive'), makeSession('s_2', 'track-day')]);
    await user.type(screen.getByTestId('picker-search'), 'morning');
    expect(screen.getByTestId('picker-row-s_1')).toBeInTheDocument();
    expect(screen.queryByTestId('picker-row-s_2')).not.toBeInTheDocument();
  });

  it('shows the no-match placeholder when search yields zero rows', async () => {
    const user = userEvent.setup();
    renderPicker([makeSession('s_1', 'run-a')]);
    await user.type(screen.getByTestId('picker-search'), 'xyz');
    expect(screen.getByTestId('picker-no-match')).toBeInTheDocument();
  });

  it('disables rows beyond the max-4 cap', async () => {
    const user = userEvent.setup();
    renderPicker([
      makeSession('s_1', 'a'),
      makeSession('s_2', 'b'),
      makeSession('s_3', 'c'),
      makeSession('s_4', 'd'),
      makeSession('s_5', 'e')
    ]);
    await user.click(screen.getByTestId('picker-row-s_1'));
    await user.click(screen.getByTestId('picker-row-s_2'));
    await user.click(screen.getByTestId('picker-row-s_3'));
    await user.click(screen.getByTestId('picker-row-s_4'));
    expect(screen.getByTestId('picker-row-s_5')).toBeDisabled();
  });

  it('Clear empties the selection', async () => {
    const user = userEvent.setup();
    renderPicker([makeSession('s_1', 'a')]);
    await user.click(screen.getByTestId('picker-row-s_1'));
    await user.click(screen.getByTestId('picker-clear'));
    expect(screen.getByTestId('picker-counter')).toHaveTextContent('0/4');
  });

  it('seededIds pre-fills the picked set', () => {
    renderPicker(
      [makeSession('s_1', 'a'), makeSession('s_2', 'b')],
      { seededIds: ['s_1'] }
    );
    expect(screen.getByTestId('picker-counter')).toHaveTextContent('1/4');
    expect(screen.getByTestId('picker-picked-s_1')).toBeInTheDocument();
  });
});
