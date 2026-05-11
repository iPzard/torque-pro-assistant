import { formatDuration } from '.';

describe('pages/library/utils/format-duration', () => {
  it('formats sub-minute durations as `0:SS`', () => {
    expect(formatDuration(42)).toBe('0:42');
  });

  it('zero-pads seconds under ten', () => {
    expect(formatDuration(65)).toBe('1:05');
  });

  it('formats multi-minute sub-hour durations as `M:SS`', () => {
    expect(formatDuration(187)).toBe('3:07');
  });

  it('switches to `H:MM:SS` once the duration crosses one hour', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
    expect(formatDuration(4465)).toBe('1:14:25');
  });

  it('floors fractional seconds rather than rounding', () => {
    expect(formatDuration(59.9)).toBe('0:59');
  });

  it('clamps negative inputs to zero', () => {
    expect(formatDuration(-12)).toBe('0:00');
  });
});
