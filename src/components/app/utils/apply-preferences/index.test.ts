import { ACCENT_SWATCHES, applyPreferencesToDom } from '.';

describe('components/app/utils/apply-preferences', () => {
  beforeEach(() => {
    const root = document.documentElement;
    delete root.dataset.theme;
    delete root.dataset.density;
    delete root.dataset.mantineColorScheme;
    root.style.removeProperty('--accent');
    root.style.removeProperty('--accent-soft');
    root.style.removeProperty('--accent-line');
  });

  it('exposes the five canonical accent swatches', () => {
    expect(ACCENT_SWATCHES).toHaveLength(5);
    expect(ACCENT_SWATCHES.map((swatch) => swatch.name))
      .toEqual(['Amber', 'Orange', 'Cyan', 'Green', 'Violet']);
  });

  it('writes theme + density + mantine-color-scheme onto the root', () => {
    applyPreferencesToDom({ accentColor: '#ffb020', density: 'compact', theme: 'dark' });
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.dataset.density).toBe('compact');
    expect(document.documentElement.dataset.mantineColorScheme).toBe('dark');
  });

  it('uses the dark-mode hex verbatim when theme is dark', () => {
    applyPreferencesToDom({ accentColor: '#ffb020', density: 'regular', theme: 'dark' });
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#ffb020');
  });

  it('swaps in the light-mode hex when theme is light', () => {
    applyPreferencesToDom({ accentColor: '#ffb020', density: 'regular', theme: 'light' });
    /** Amber's light variant is the AA-passing #a36400. */
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#a36400');
  });

  it('derives --accent-soft + --accent-line as rgba transparencies', () => {
    applyPreferencesToDom({ accentColor: '#ffb020', density: 'regular', theme: 'dark' });
    const soft = document.documentElement.style.getPropertyValue('--accent-soft');
    const line = document.documentElement.style.getPropertyValue('--accent-line');
    expect(soft).toContain('rgba(255, 176, 32');
    expect(soft).toContain('0.14');
    expect(line).toContain('rgba(255, 176, 32');
    expect(line).toContain('0.55');
  });

  it('falls back to the stored hex when no swatch matches', () => {
    applyPreferencesToDom({ accentColor: '#123456', density: 'regular', theme: 'light' });
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#123456');
  });
});
