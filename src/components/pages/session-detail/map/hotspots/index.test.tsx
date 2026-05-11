import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import type { Hotspot } from 'components/pages/session-detail/map/utils';

import Hotspots from '.';

const makeHotspot = (overrides: Partial<Hotspot> = {}): Hotspot => ({
  id:    'max-speed',
  kind:  'max-speed',
  label: 'Max Speed',
  lat:   45.62,
  lon:   -122.38,
  t:     5,
  unit:  'mph',
  value: 95,
  ...overrides
});

function renderHotspots(hotspots: readonly Hotspot[]) {
  return render(
    <MantineProvider>
      <Hotspots hotspots={ hotspots } testId="hotspots" />
    </MantineProvider>
  );
}

describe('pages/session-detail/map/hotspots', () => {
  it('renders the card wrapper', () => {
    renderHotspots([]);
    expect(screen.getByTestId('hotspots')).toBeInTheDocument();
  });

  it('renders the empty-state placeholder when the list is empty', () => {
    renderHotspots([]);
    expect(screen.getByTestId('hotspots-empty')).toBeInTheDocument();
  });

  it('renders one row per supplied hotspot', () => {
    renderHotspots([
      makeHotspot({ kind: 'max-speed' }),
      makeHotspot({ kind: 'max-rpm', label: 'Max RPM', unit: 'rpm', value: 6500 })
    ]);
    expect(screen.getByTestId('hotspots-row-max-speed')).toBeInTheDocument();
    expect(screen.getByTestId('hotspots-row-max-rpm')).toBeInTheDocument();
  });

  it('renders the hotspot value rounded to whole units (except boost)', () => {
    renderHotspots([makeHotspot({ value: 95.7 })]);
    expect(screen.getByTestId('hotspots-row-max-speed-value')).toHaveTextContent('96');
  });

  it('renders boost values with one decimal', () => {
    renderHotspots([
      makeHotspot({ kind: 'max-boost', label: 'Max Boost', unit: 'psi', value: 18.4 })
    ]);
    expect(screen.getByTestId('hotspots-row-max-boost-value')).toHaveTextContent('18.4');
  });
});
