import { isActive } from '.';

describe('components/app/utils/is-active', () => {
  it('matches an exact path', () => {
    expect(isActive('/compare', '/compare')).toBe(true);
  });

  it('does not match a different path', () => {
    expect(isActive('/compare', '/library')).toBe(false);
  });

  it('treats root "/" as active for the Library nav item', () => {
    expect(isActive('/', '/library')).toBe(true);
  });

  it('does not treat root "/" as active for non-Library nav items', () => {
    expect(isActive('/', '/compare')).toBe(false);
    expect(isActive('/', '/settings')).toBe(false);
    expect(isActive('/', '/import')).toBe(false);
  });

  it('returns false for a child path that only shares a prefix', () => {
    // "/library/sessions/abc" should not light up the top-level Library item
    // (the design pins active state to exact match, not prefix).
    expect(isActive('/library/sessions/abc', '/library')).toBe(false);
  });
});
