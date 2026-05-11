/**
 * Format a duration in seconds as `H:MM:SS` (or `M:SS` for sub-hour
 * sessions) for the Library table's "Duration" column. Negative values
 * clamp to zero — the upstream `ingestCsv` already guards against
 * out-of-order rows, but the formatter stays defensive so a malformed
 * persisted session can't crash the row.
 *
 * @param totalSeconds Duration in seconds (typically `meta.duration`).
 * @returns A short, human-readable timecode — `"0:42"`, `"3:07"`,
 *   `"1:14:25"`. Never returns an empty string.
 */
export const formatDuration = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const pad = (value: number): string => value.toString().padStart(2, '0');
  if (hours > 0) {
    return `${ hours }:${ pad(minutes) }:${ pad(seconds) }`;
  }
  return `${ minutes }:${ pad(seconds) }`;
};
