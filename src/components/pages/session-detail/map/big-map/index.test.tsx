import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import type { Hotspot } from 'components/pages/session-detail/map/utils';
import type { SessionDataRow } from 'types/session';

import BigMap from '.';

const makeRow = (overrides: Partial<SessionDataRow>): SessionDataRow => ({
  t:  0,
  ts: 0,
  ...overrides
});

const makeRoute = (): SessionDataRow[] => [
  makeRow({ lat: 45.60, lon: -122.40, t: 0 }),
  makeRow({ lat: 45.62, lon: -122.38, t: 5 }),
  makeRow({ lat: 45.64, lon: -122.36, t: 10 })
];

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

function renderBigMap(
  data: readonly SessionDataRow[] = makeRoute(),
  hotspots: readonly Hotspot[] = []
) {
  return render(
    <MantineProvider>
      <BigMap data={ data } hotspots={ hotspots } testId="big-map" />
    </MantineProvider>
  );
}

describe('pages/session-detail/map/big-map', () => {
  it('renders the card wrapper', () => {
    renderBigMap();
    expect(screen.getByTestId('big-map')).toBeInTheDocument();
  });

  it('renders the route SVG when GPS data is present', () => {
    renderBigMap();
    expect(screen.getByTestId('big-map-svg')).toBeInTheDocument();
    expect(screen.getByTestId('big-map-route')).toBeInTheDocument();
  });

  it('renders start + end markers when GPS data is present', () => {
    renderBigMap();
    expect(screen.getByTestId('big-map-start')).toBeInTheDocument();
    expect(screen.getByTestId('big-map-end')).toBeInTheDocument();
  });

  it('renders the empty-state placeholder when no rows carry GPS', () => {
    renderBigMap([makeRow({ rpm: 800 })]);
    expect(screen.getByTestId('big-map-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('big-map-svg')).not.toBeInTheDocument();
  });

  it('renders a hotspot marker for each supplied hotspot', () => {
    renderBigMap(makeRoute(), [
      makeHotspot({ id: 'max-speed', kind: 'max-speed' }),
      makeHotspot({ id: 'max-rpm',   kind: 'max-rpm',   label: 'Max RPM', unit: 'rpm', value: 6500 })
    ]);
    expect(screen.getByTestId('big-map-hotspot-max-speed')).toBeInTheDocument();
    expect(screen.getByTestId('big-map-hotspot-max-rpm')).toBeInTheDocument();
  });
});
