import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import Metric from '.';

function renderMetric(node: React.ReactElement) {
  return render(<MantineProvider>{ node }</MantineProvider>);
}

describe('components/primitives/metric', () => {
  it('renders the label and value', () => {
    renderMetric(<Metric label="Max speed" testId="max-speed" value={ 118 } />);
    expect(screen.getByTestId('max-speed')).toBeInTheDocument();
    expect(screen.getByTestId('max-speed-label')).toBeInTheDocument();
    expect(screen.getByTestId('max-speed-value')).toBeInTheDocument();
  });

  it('omits the unit element when no unit is provided', () => {
    renderMetric(<Metric label="0–60" testId="zero-sixty" value="—" />);
    expect(screen.queryByTestId('zero-sixty-unit')).not.toBeInTheDocument();
  });

  it('renders the unit when provided', () => {
    renderMetric(<Metric label="Max speed" testId="max-speed" unit="mph" value={ 118 } />);
    expect(screen.getByTestId('max-speed-unit')).toBeInTheDocument();
  });

  it('omits the sub line when no sub is provided', () => {
    renderMetric(<Metric label="Max speed" testId="max-speed" value={ 118 } />);
    expect(screen.queryByTestId('max-speed-sub')).not.toBeInTheDocument();
  });

  it('renders the sub line when provided', () => {
    renderMetric(<Metric label="Max speed" sub="@ 11:52" testId="max-speed" value={ 118 } />);
    expect(screen.getByTestId('max-speed-sub')).toBeInTheDocument();
  });

  it('accepts numeric or string values', () => {
    renderMetric(<Metric label="0–60" testId="zero-sixty" value="—" />);
    expect(screen.getByTestId('zero-sixty-value')).toBeInTheDocument();
  });
});
