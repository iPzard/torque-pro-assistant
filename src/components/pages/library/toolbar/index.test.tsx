import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LibraryToolbar from '.';

const noopString = (): void => undefined;
const noopDate = (): void => undefined;
const noopUnits = (): void => undefined;

function renderToolbar(overrides: Partial<Parameters<typeof LibraryToolbar>[0]> = {}) {
  return render(
    <MantineProvider>
      <LibraryToolbar
        fromDate={ null }
        onFromDateChange={ noopDate }
        onQueryChange={ noopString }
        onToDateChange={ noopDate }
        onUnitsChange={ noopUnits }
        query=""
        testId="toolbar"
        toDate={ null }
        units="imperial"
        { ...overrides }
      />
    </MantineProvider>
  );
}

describe('pages/library/toolbar', () => {
  it('renders the toolbar wrapper', () => {
    renderToolbar();
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
  });

  it('renders the search field', () => {
    renderToolbar();
    expect(screen.getByTestId('toolbar-search')).toBeInTheDocument();
  });

  it('renders the date-range inputs', () => {
    renderToolbar();
    expect(screen.getByTestId('toolbar-from')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar-to')).toBeInTheDocument();
  });

  it('renders the units toggle pre-populated with the active preference', () => {
    renderToolbar({ units: 'metric' });
    expect(screen.getByTestId('toolbar-units')).toBeInTheDocument();
  });

  it('typing into the search field fires onQueryChange', async () => {
    const onQueryChange = jest.fn();
    const user = userEvent.setup();
    renderToolbar({ onQueryChange });
    await user.type(screen.getByTestId('toolbar-search'), 'a');
    expect(onQueryChange).toHaveBeenCalledWith('a');
  });
});
