import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { adapterPairing, toast } from 'utils';

import AdapterPairing from '.';

beforeEach(() => {
  adapterPairing.close();
  toast.clear();
});

function renderHost() {
  return render(<AdapterPairing testId="pairing" />);
}

describe('components/app/adapter-pairing', () => {
  it('renders nothing while the controller is closed', () => {
    renderHost();
    expect(screen.queryByTestId('pairing')).not.toBeInTheDocument();
  });

  it('opens at the scan stage by default', () => {
    renderHost();
    act(() => { adapterPairing(); });
    expect(screen.getByTestId('pairing')).toBeInTheDocument();
    expect(screen.getByTestId('pairing-step-scan')).toBeInTheDocument();
  });

  it('renders the four-step stepper header', () => {
    renderHost();
    act(() => { adapterPairing(); });
    expect(screen.getByTestId('pairing-step-scan')).toBeInTheDocument();
    expect(screen.getByTestId('pairing-step-pair')).toBeInTheDocument();
    expect(screen.getByTestId('pairing-step-probe')).toBeInTheDocument();
    expect(screen.getByTestId('pairing-step-done')).toBeInTheDocument();
  });

  it('close button shuts the modal', async () => {
    const user = userEvent.setup();
    renderHost();
    act(() => { adapterPairing(); });
    await user.click(screen.getByTestId('pairing-close'));
    expect(screen.queryByTestId('pairing')).not.toBeInTheDocument();
  });

  it('jumping to the no-adapters stage shows the failure alert', () => {
    renderHost();
    act(() => { adapterPairing('no-adapters'); });
    expect(screen.getByTestId('pairing-no-adapters')).toBeInTheDocument();
    expect(screen.getByTestId('pairing-scan-retry')).toBeInTheDocument();
  });

  it('jumping to the failed stage renders the pair-failed alert', () => {
    renderHost();
    act(() => { adapterPairing('failed'); });
    expect(screen.getByTestId('pairing-pair-failed')).toBeInTheDocument();
    expect(screen.getByTestId('pairing-pair-retry')).toBeInTheDocument();
  });

  it('jumping to the done stage renders the success pane', () => {
    renderHost();
    act(() => { adapterPairing('done'); });
    expect(screen.getByTestId('pairing-done')).toBeInTheDocument();
    expect(screen.getByTestId('pairing-done-finish')).toBeInTheDocument();
  });

  it('Finish & close fires a success toast + closes the modal', async () => {
    const user = userEvent.setup();
    renderHost();
    act(() => { adapterPairing('done'); });
    await user.click(screen.getByTestId('pairing-done-finish'));
    expect(screen.queryByTestId('pairing')).not.toBeInTheDocument();
  });
});
