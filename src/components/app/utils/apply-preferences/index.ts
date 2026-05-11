import { useEffect } from 'react';

import { useAppSelector } from 'state/hooks';
import { selectPreferences } from 'state/preferences';

/** Hex pair for each accent option — the `dark` value renders on the
 *  dark theme, `light` on the light theme. Light variants are tuned
 *  to clear the WCAG AA 4.5:1 contrast threshold against white so
 *  text + chart accents stay readable in both modes. */
export interface AccentSwatch {
  /** Hex used on the dark theme (matches the in-app design tokens). */
  readonly dark: string;
  /** Hex used on the light theme — darker shades that clear AA on
   *  white surfaces. */
  readonly light: string;
  /** Stable display name; doubles as the testid suffix in Settings. */
  readonly name: string;
}

/** Five-swatch accent palette. Order matches the design's pinned set;
 *  `dark` is the canonical persistence key (`preferences.accentColor`
 *  stores one of these hex values verbatim). */
export const ACCENT_SWATCHES: readonly AccentSwatch[] = [
  { dark: '#ffb020', light: '#a36400', name: 'Amber' },
  /**
   * Orange's previous dark hex (#ff5a1f) was a fully-saturated pure
   * orange. At small text sizes (e.g. the "ACTIVE PROFILE" tag,
   * 11px) the heavy red saturation read as a smudge on dark
   * surfaces — user feedback flagged it as hard to see. Bumped to a
   * lighter orange with more yellow + less red so it stays
   * readable at small sizes.
   */
  { dark: '#ff8a3a', light: '#b73e10', name: 'Orange' },
  { dark: '#6fd3f7', light: '#0e6c8a', name: 'Cyan' },
  { dark: '#34d399', light: '#0f7757', name: 'Green' },
  { dark: '#c084fc', light: '#6d28d9', name: 'Violet' }
];

/** Resolve a stored `accentColor` (dark-mode hex) to the light-mode
 *  hex when needed. Falls back to the stored value itself when no
 *  swatch matches — keeps custom user values from breaking. */
const lightVariantFor = (darkHex: string): string => {
  const match = ACCENT_SWATCHES.find((swatch) => swatch.dark.toLowerCase() === darkHex.toLowerCase());
  return match?.light ?? darkHex;
};

/** Convert a `#RRGGBB` hex to `rgba(r, g, b, alpha)`. Used to derive
 *  `--accent-soft` + `--accent-line` from the active accent so the
 *  whole tint family tracks the picker selection. */
const hexToRgba = (hex: string, alpha: number): string => {
  const cleaned = hex.startsWith('#') ? hex.slice(1) : hex;
  if (cleaned.length !== 6) return hex;
  const red = Number.parseInt(cleaned.slice(0, 2), 16);
  const green = Number.parseInt(cleaned.slice(2, 4), 16);
  const blue = Number.parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${ red }, ${ green }, ${ blue }, ${ alpha })`;
};

interface ApplyPreferencesInput {
  readonly accentColor: string;
  readonly density: string;
  readonly theme: string;
}

/**
 * Pushes the live preferences into the DOM:
 *   - `document.documentElement.dataset.theme` → drives the
 *     `[data-theme='light']` CSS variable overrides in `index.scss`.
 *   - `document.documentElement.dataset.density` → drives row-height
 *     scaling in `[data-density='...']` rules.
 *   - `--accent` / `--accent-soft` / `--accent-line` → derived from
 *     the picker's selected swatch + the active theme so the entire
 *     accent family stays self-consistent.
 *
 * Idempotent — safe to call on every render; the hook below ties it
 * to the relevant slice fields so it only runs when one changes.
 */
export const applyPreferencesToDom = ({ accentColor, density, theme }: ApplyPreferencesInput): void => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.dataset.density = density;
  /** `data-mantine-color-scheme` is what Mantine 7 reads to flip its
   *  internal palette; keep it in sync so dialogs / popovers / modals
   *  follow the user's theme without a second source of truth. */
  root.dataset.mantineColorScheme = theme;

  const resolved = theme === 'light' ? lightVariantFor(accentColor) : accentColor;
  root.style.setProperty('--accent', resolved);
  root.style.setProperty('--accent-soft', hexToRgba(resolved, 0.14));
  root.style.setProperty('--accent-line', hexToRgba(resolved, 0.55));
};

/**
 * Subscribes the renderer to the Redux preferences slice + applies
 * the active values to the document root. Mount once near the root of
 * the React tree (typically the `<App>` shell).
 */
export const useApplyPreferences = (): void => {
  const preferences = useAppSelector((state) => selectPreferences(state.preferences));

  useEffect(() => {
    applyPreferencesToDom({
      accentColor: preferences.accentColor,
      density:     preferences.density,
      theme:       preferences.theme
    });
  }, [preferences.accentColor, preferences.density, preferences.theme]);
};
