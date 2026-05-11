import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Alert from '.';

describe('primitives/alert', () => {
  it('renders the title', () => {
    render(<Alert testId="alert" title="Something failed" />);
    expect(screen.getByTestId('alert')).toBeInTheDocument();
    expect(screen.getByTestId('alert-title')).toHaveTextContent('Something failed');
  });

  it('renders the subtitle when supplied', () => {
    render(<Alert subtitle="row 42 is malformed" testId="alert" title="Parse failed" />);
    expect(screen.getByTestId('alert-sub')).toHaveTextContent('row 42 is malformed');
  });

  it('omits the subtitle slot when no subtitle prop', () => {
    render(<Alert testId="alert" title="Title only" />);
    expect(screen.queryByTestId('alert-sub')).not.toBeInTheDocument();
  });

  it('renders detail + actions when supplied', () => {
    render(
      <Alert
        actions={ <button data-testid="alert-action-btn" type="button">Retry</button> }
        detail="raw parser line"
        testId="alert"
        title="Failed"
      />
    );
    expect(screen.getByTestId('alert-detail')).toHaveTextContent('raw parser line');
    expect(screen.getByTestId('alert-actions')).toBeInTheDocument();
    expect(screen.getByTestId('alert-action-btn')).toBeInTheDocument();
  });

  it('renders + fires the close button when onClose is supplied', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<Alert onClose={ onClose } testId="alert" title="Dismissible" />);
    await user.click(screen.getByTestId('alert-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('omits the close button when onClose is undefined', () => {
    render(<Alert testId="alert" title="No close" />);
    expect(screen.queryByTestId('alert-close')).not.toBeInTheDocument();
  });
});
