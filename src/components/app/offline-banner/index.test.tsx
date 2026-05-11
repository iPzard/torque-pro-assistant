import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import OfflineBanner from '.';

describe('components/app/offline-banner', () => {
  it('renders the banner with attempt counter', () => {
    render(
      <OfflineBanner
        attempts={ 3 }
        onDismiss={ jest.fn() }
        onRetry={ jest.fn() }
        testId="banner"
      />
    );
    expect(screen.getByTestId('banner')).toBeInTheDocument();
    expect(screen.getByTestId('banner-text')).toHaveTextContent('Can\'t reach the local service');
    expect(screen.getByTestId('banner-meta')).toHaveTextContent('(3/10)');
  });

  it('Retry button calls onRetry', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();
    render(
      <OfflineBanner attempts={ 1 } onDismiss={ jest.fn() } onRetry={ onRetry } testId="banner" />
    );
    await user.click(screen.getByTestId('banner-retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('Close button calls onDismiss', async () => {
    const user = userEvent.setup();
    const onDismiss = jest.fn();
    render(
      <OfflineBanner attempts={ 1 } onDismiss={ onDismiss } onRetry={ jest.fn() } testId="banner" />
    );
    await user.click(screen.getByTestId('banner-close'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
