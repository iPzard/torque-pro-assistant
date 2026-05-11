import { render, screen } from '@testing-library/react';

import Sparkline from '.';

const sampleData = [
  { speed_mph: 0,  t: 0, ts: 0    },
  { speed_mph: 12, t: 1, ts: 1000 },
  { speed_mph: 35, t: 2, ts: 2000 },
  { speed_mph: 58, t: 3, ts: 3000 },
  { speed_mph: 42, t: 4, ts: 4000 }
];

describe('components/charts/sparkline', () => {
  it('renders the sparkline container at the requested dimensions', () => {
    render(<Sparkline data={ sampleData } dataKey="speed_mph" testId="row-spark" />);
    const wrapper = screen.getByTestId('row-spark');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveStyle({ height: '28px', width: '110px' });
  });

  it('honors custom width / height props', () => {
    render(
      <Sparkline
        data={ sampleData }
        dataKey="speed_mph"
        height={ 40 }
        testId="big-spark"
        width={ 240 }
      />
    );
    expect(screen.getByTestId('big-spark')).toHaveStyle({ height: '40px', width: '240px' });
  });

  it('renders an empty container when given no data (instead of throwing)', () => {
    render(<Sparkline data={ [] } dataKey="speed_mph" testId="empty-spark" />);
    expect(screen.getByTestId('empty-spark')).toBeInTheDocument();
  });

  it('renders without crashing when filled is set', () => {
    render(
      <Sparkline
        data={ sampleData }
        dataKey="speed_mph"
        filled
        testId="filled-spark"
      />
    );
    expect(screen.getByTestId('filled-spark')).toBeInTheDocument();
  });

  it('does not require an explicit color prop', () => {
    render(<Sparkline data={ sampleData } dataKey="speed_mph" testId="default-color" />);
    expect(screen.getByTestId('default-color')).toBeInTheDocument();
  });
});
