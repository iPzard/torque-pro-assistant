import { render, screen } from '@testing-library/react';

import NoGpsEmpty from '.';

describe('pages/session-detail/map/big-map/no-gps-empty', () => {
  it('renders the empty container', () => {
    render(<NoGpsEmpty rowCount={ 2418 } testId="no-gps" />);
    expect(screen.getByTestId('no-gps')).toBeInTheDocument();
  });

  it('renders the dashed icon + headline + sub + checks', () => {
    render(<NoGpsEmpty rowCount={ 0 } testId="no-gps" />);
    expect(screen.getByTestId('no-gps-icon')).toBeInTheDocument();
    expect(screen.getByTestId('no-gps-headline')).toHaveTextContent('No GPS data');
    expect(screen.getByTestId('no-gps-sub')).toBeInTheDocument();
    expect(screen.getByTestId('no-gps-checks')).toBeInTheDocument();
  });

  it('formats the row count with thousand separators', () => {
    render(<NoGpsEmpty rowCount={ 12345 } testId="no-gps" />);
    expect(screen.getByTestId('no-gps-checks')).toHaveTextContent('12,345 rows logged');
  });
});
