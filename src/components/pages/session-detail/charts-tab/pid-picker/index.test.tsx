import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PidPicker from '.';

function renderPicker(
  selectedPids: readonly string[] = [],
  onChange: (next: readonly string[]) => void = jest.fn(),
  onClose: () => void = jest.fn()
) {
  return render(
    <MantineProvider>
      <PidPicker
        onChange={ onChange }
        onClose={ onClose }
        opened
        selectedPids={ selectedPids }
        testId="pid-picker"
      />
    </MantineProvider>
  );
}

describe('pages/session-detail/charts-tab/pid-picker', () => {
  it('renders the search input', () => {
    renderPicker();
    expect(screen.getByTestId('pid-picker-search')).toBeInTheDocument();
  });

  it('renders the Performance category section', () => {
    renderPicker();
    expect(screen.getByTestId('pid-picker-category-perf')).toBeInTheDocument();
  });

  it('renders a checkbox for the speed_mph PID', () => {
    renderPicker();
    expect(screen.getByTestId('pid-picker-pid-speed_mph')).toBeInTheDocument();
  });

  it('marks already-selected PIDs as checked', () => {
    renderPicker(['rpm']);
    const checkbox = screen.getByTestId('pid-picker-pid-rpm');
    expect(checkbox).toBeChecked();
  });

  it('toggling a checkbox fires onChange with the new selection', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    renderPicker([], onChange);
    await user.click(screen.getByTestId('pid-picker-pid-speed_mph'));
    expect(onChange).toHaveBeenCalledWith(['speed_mph']);
  });

  it('unchecking a PID fires onChange with that PID removed', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    renderPicker(['speed_mph', 'rpm'], onChange);
    await user.click(screen.getByTestId('pid-picker-pid-rpm'));
    expect(onChange).toHaveBeenCalled();
    const callArg = onChange.mock.calls[0][0] as readonly string[];
    expect(callArg).toContain('speed_mph');
    expect(callArg).not.toContain('rpm');
  });

  it('filters categories by the search query', async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.type(screen.getByTestId('pid-picker-search'), 'speed');
    expect(screen.getByTestId('pid-picker-pid-speed_mph')).toBeInTheDocument();
    /** RPM is in the same Performance category but not matched by the
     *  query — it should be filtered out. */
    expect(screen.queryByTestId('pid-picker-pid-rpm')).not.toBeInTheDocument();
  });

  it('shows the no-results state when the search matches nothing', async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.type(screen.getByTestId('pid-picker-search'), 'xyzzy');
    expect(screen.getByTestId('pid-picker-no-results')).toBeInTheDocument();
  });
});
