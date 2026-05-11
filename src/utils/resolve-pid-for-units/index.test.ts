import { resolvePidForUnits } from '.';

describe('utils/resolve-pid-for-units', () => {
  it('returns the catalog native key + unit under imperial', () => {
    const resolved = resolvePidForUnits('speed_mph', 'imperial');
    expect(resolved.key).toBe('speed_mph');
    expect(resolved.unit).toBe('mph');
  });

  it('swaps to the metric companion key + unit under metric', () => {
    const resolved = resolvePidForUnits('speed_mph', 'metric');
    expect(resolved.key).toBe('speed_kph');
    expect(resolved.unit).toBe('km/h');
  });

  it('keeps the native PID when no metric companion exists in the catalog', () => {
    const resolved = resolvePidForUnits('rpm', 'metric');
    expect(resolved.key).toBe('rpm');
    expect(resolved.unit).toBe('rpm');
  });

  it('returns the raw key + empty unit for PIDs missing from the catalog', () => {
    const resolved = resolvePidForUnits('not_a_real_pid', 'imperial');
    expect(resolved.key).toBe('not_a_real_pid');
    expect(resolved.unit).toBe('');
  });

  it('swaps boost_psi to boost_kpa under metric', () => {
    const resolved = resolvePidForUnits('boost_psi', 'metric');
    expect(resolved.key).toBe('boost_kpa');
    expect(resolved.unit).toBe('kPa');
  });

  it('swaps coolant_f to coolant_c under metric', () => {
    const resolved = resolvePidForUnits('coolant_f', 'metric');
    expect(resolved.key).toBe('coolant_c');
    expect(resolved.unit).toBe('°C');
  });
});
