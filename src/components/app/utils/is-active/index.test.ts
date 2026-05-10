import { isActive } from '.';

describe('components/app/utils/is-active', () => {
  test('matches an exact path', () => {
    expect(isActive('/compare', '/compare')).toBe(true);
  });

  test('does not match a different path', () => {
    expect(isActive('/compare', '/library')).toBe(false);
  });

  test('treats root "/" as active for the Library nav item', () => {
    expect(isActive('/', '/library')).toBe(true);
  });

  test('does not treat root "/" as active for non-Library nav items', () => {
    expect(isActive('/', '/compare')).toBe(false);
    expect(isActive('/', '/settings')).toBe(false);
    expect(isActive('/', '/import')).toBe(false);
  });

  test('returns false for a child path that only shares a prefix', () => {
    // "/library/sessions/abc" should not light up the top-level Library item
    // (the design pins active state to exact match, not prefix).
    expect(isActive('/library/sessions/abc', '/library')).toBe(false);
  });
});
