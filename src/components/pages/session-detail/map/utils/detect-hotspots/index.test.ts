import type { SessionDataRow } from 'types/session';

import { detectHotspots } from '.';

const makeRow = (overrides: Partial<SessionDataRow>): SessionDataRow => ({
  t:  0,
  ts: 0,
  ...overrides
});

describe('pages/session-detail/map/utils/detect-hotspots', () => {
  it('emits no hotspots for an empty session', () => {
    expect(detectHotspots([])).toEqual([]);
  });

  it('emits no hotspots when no rows carry GPS', () => {
    const hotspots = detectHotspots([
      makeRow({ rpm: 4000, speed_mph: 80 }),
      makeRow({ rpm: 5500, speed_mph: 100 })
    ]);
    expect(hotspots).toEqual([]);
  });

  it('emits max-speed at the GPS-anchored peak speed sample', () => {
    const hotspots = detectHotspots([
      makeRow({ lat: 45.60, lon: -122.40, speed_mph: 30, t: 0 }),
      makeRow({ lat: 45.62, lon: -122.38, speed_mph: 85, t: 10 }),
      makeRow({ lat: 45.64, lon: -122.36, speed_mph: 60, t: 20 })
    ]);
    const speedHotspot = hotspots.find((spot) => spot.kind === 'max-speed');
    expect(speedHotspot).toBeDefined();
    expect(speedHotspot?.value).toBe(85);
    expect(speedHotspot?.lat).toBeCloseTo(45.62);
    expect(speedHotspot?.t).toBe(10);
    expect(speedHotspot?.unit).toBe('mph');
  });

  it('emits max-rpm separately from max-speed', () => {
    const hotspots = detectHotspots([
      makeRow({ lat: 45.60, lon: -122.40, rpm: 2000, speed_mph: 30, t: 0 }),
      makeRow({ lat: 45.62, lon: -122.38, rpm: 6500, speed_mph: 60, t: 10 }),
      makeRow({ lat: 45.64, lon: -122.36, rpm: 4000, speed_mph: 95, t: 20 })
    ]);
    const rpmHotspot = hotspots.find((spot) => spot.kind === 'max-rpm');
    expect(rpmHotspot?.value).toBe(6500);
    expect(rpmHotspot?.t).toBe(10);

    const speedHotspot = hotspots.find((spot) => spot.kind === 'max-speed');
    expect(speedHotspot?.value).toBe(95);
    expect(speedHotspot?.t).toBe(20);
  });

  it('emits max-boost when boost data is logged', () => {
    const hotspots = detectHotspots([
      makeRow({ boost_psi: 5,  lat: 45.60, lon: -122.40 }),
      makeRow({ boost_psi: 18, lat: 45.62, lon: -122.38 }),
      makeRow({ boost_psi: 12, lat: 45.64, lon: -122.36 })
    ]);
    const boostHotspot = hotspots.find((spot) => spot.kind === 'max-boost');
    expect(boostHotspot?.value).toBe(18);
  });

  it('drops a kind whose peak sample lacks GPS', () => {
    const hotspots = detectHotspots([
      makeRow({ lat: 45.60, lon: -122.40, speed_mph: 30 }),
      /** Peak speed lands here — no GPS — dropped. */
      makeRow({                          speed_mph: 95 }),
      makeRow({ lat: 45.62, lon: -122.38, speed_mph: 60 })
    ]);
    expect(hotspots.find((spot) => spot.kind === 'max-speed')).toBeUndefined();
  });

  it('drops a kind whose PID was never logged', () => {
    const hotspots = detectHotspots([
      makeRow({ lat: 45.60, lon: -122.40, speed_mph: 50 }),
      makeRow({ lat: 45.62, lon: -122.38, speed_mph: 90 })
    ]);
    expect(hotspots.find((spot) => spot.kind === 'max-boost')).toBeUndefined();
    expect(hotspots.find((spot) => spot.kind === 'max-rpm')).toBeUndefined();
  });

  it('preserves the canonical hotspot order (speed → rpm → boost)', () => {
    const hotspots = detectHotspots([
      makeRow({ boost_psi: 10, lat: 45.60, lon: -122.40, rpm: 5000, speed_mph: 80 })
    ]);
    expect(hotspots.map((spot) => spot.kind)).toEqual(['max-speed', 'max-rpm', 'max-boost']);
  });
});
