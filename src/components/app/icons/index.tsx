import type { ReactNode } from 'react';

export interface IconProps {
  readonly children: ReactNode;
  readonly fill?: string;
  readonly size?: number;
  readonly stroke?: string;
  readonly strokeWidth?: number;
}

/**
 * Minimal stroked-line icon primitive matching the design handoff's
 * `<Icon>` component. Caller passes SVG children (paths / circles).
 *
 * @returns A 24×24-viewBox SVG sized via the `size` prop.
 */
function Icon({
  children,
  fill = 'none',
  size = 16,
  stroke = 'currentColor',
  strokeWidth = 1.7
}: IconProps) {
  return (
    <svg
      fill={ fill }
      height={ size }
      stroke={ stroke }
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={ strokeWidth }
      viewBox="0 0 24 24"
      width={ size }
    >
      { children }
    </svg>
  );
}

/**
 * Named icon set used across the app shell and screens. Pulled
 * straight from the design handoff so the visual vocabulary stays
 * consistent.
 */
export const Icons = {
  chart:    <Icon><path d="M3 3v18h18" /><path d="m7 14 4-4 3 3 5-7" /></Icon>,
  check:    <Icon><path d="m5 12 5 5L20 7" /></Icon>,
  chevDown: <Icon><path d="m6 9 6 6 6-6" /></Icon>,
  chevRight: <Icon><path d="m9 6 6 6-6 6" /></Icon>,
  compare:  <Icon><path d="M8 4v16M16 4v16M3 8l5-4 5 4M21 16l-5 4-5-4" /></Icon>,
  copy:     <Icon><rect height="13" rx="2" width="13" x="9" y="9" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></Icon>,
  cross:    <Icon><path d="M6 6l12 12M18 6l-12 12" /></Icon>,
  download: <Icon><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></Icon>,
  ext:      <Icon><path d="M14 4h6v6" /><path d="M10 14 20 4" /><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" /></Icon>,
  filter:   <Icon><path d="M3 5h18M6 12h12M10 19h4" /></Icon>,
  folder:   <Icon><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Icon>,
  importArrow: <Icon><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></Icon>,
  library:  <Icon><path d="M3 5h18M3 12h18M3 19h18" /></Icon>,
  list:     <Icon><path d="M3 6h18M3 12h18M3 18h18" /></Icon>,
  map:      <Icon><path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14" /></Icon>,
  more:     <Icon fill="currentColor" stroke="none" strokeWidth={ 0 }><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></Icon>,
  pencil:   <Icon><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z" /></Icon>,
  plus:     <Icon><path d="M12 5v14M5 12h14" /></Icon>,
  reset:    <Icon><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></Icon>,
  search:   <Icon><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></Icon>,
  session:  <Icon><rect height="16" rx="2" width="18" x="3" y="4" /><path d="M7 9h10M7 13h6" /></Icon>,
  settings: <Icon><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.4 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Icon>,
  table:    <Icon><rect height="16" rx="1" width="18" x="3" y="4" /><path d="M3 10h18M3 16h18M9 4v16M15 4v16" /></Icon>,
  trash:    <Icon><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></Icon>,
  upload:   <Icon><path d="M12 21V9M7 14l5-5 5 5M5 3h14" /></Icon>,
  vehicle:  <Icon><path d="M3 13l2-5a3 3 0 0 1 3-2h8a3 3 0 0 1 3 2l2 5" /><path d="M5 13h14v5H5z" /><circle cx="7.5" cy="18" r="1.5" /><circle cx="16.5" cy="18" r="1.5" /></Icon>,
  warn:     <Icon><path d="M12 3 2 21h20z" /><path d="M12 10v5M12 18h.01" /></Icon>
} as const;

export default Icon;
