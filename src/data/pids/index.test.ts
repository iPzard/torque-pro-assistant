import { PID_BY_KEY, PID_CATEGORIES } from '.';

/**
 * The PID catalog is static data, so the test guards its structural
 * invariants — every PID has a unique key, every key in `PID_BY_KEY`
 * comes from a category entry, every entry has a non-empty label / unit,
 * and the range is a non-empty interval.
 */

describe('data/pids', () => {
  it('every category has at least one PID', () => {
    for (const category of PID_CATEGORIES) {
      expect(category.pids.length).toBeGreaterThan(0);
    }
  });

  it('every category has a unique id', () => {
    const seenIds = new Set<string>();
    for (const category of PID_CATEGORIES) {
      expect(seenIds.has(category.id)).toBe(false);
      seenIds.add(category.id);
    }
  });

  it('every PID has a unique key across all categories', () => {
    const seenKeys = new Set<string>();
    for (const category of PID_CATEGORIES) {
      for (const pid of category.pids) {
        expect(seenKeys.has(pid.key)).toBe(false);
        seenKeys.add(pid.key);
      }
    }
  });

  it('every PID has a non-empty label and color', () => {
    for (const category of PID_CATEGORIES) {
      for (const pid of category.pids) {
        expect(pid.label.length).toBeGreaterThan(0);
        expect(pid.color.length).toBeGreaterThan(0);
      }
    }
  });

  it('every PID range is a min<max numeric interval', () => {
    for (const category of PID_CATEGORIES) {
      for (const pid of category.pids) {
        const [min, max] = pid.range;
        expect(Number.isFinite(min)).toBe(true);
        expect(Number.isFinite(max)).toBe(true);
        expect(min).toBeLessThan(max);
      }
    }
  });

  it('PID_BY_KEY contains exactly one entry per PID in PID_CATEGORIES', () => {
    const totalFromCategories = PID_CATEGORIES.reduce(
      (count, category) => count + category.pids.length,
      0
    );
    expect(Object.keys(PID_BY_KEY).length).toBe(totalFromCategories);
  });

  it('every PID_BY_KEY entry carries the originating category id', () => {
    for (const category of PID_CATEGORIES) {
      for (const pid of category.pids) {
        expect(PID_BY_KEY[pid.key].category).toBe(category.id);
      }
    }
  });

  it('PID_BY_KEY preserves the source PID fields', () => {
    const boost = PID_BY_KEY.boost_psi;
    expect(boost).toBeDefined();
    expect(boost.label).toBe('Turbo Boost / Vacuum');
    expect(boost.unit).toBe('psi');
    expect(boost.altUnit?.metric.key).toBe('boost_kpa');
    expect(boost.altUnit?.metric.unit).toBe('kPa');
  });

  it('exposes the six expected categories in display order', () => {
    expect(PID_CATEGORIES.map((category) => category.id)).toEqual([
      'perf',
      'vitals',
      'throttle',
      'airfuel',
      'econ',
      'gps'
    ]);
  });
});
