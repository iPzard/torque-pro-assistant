import { rssiBars } from '.';

describe('components/app/adapter-pairing/utils/rssi-bars', () => {
  it('returns 4 bars for excellent signal (> -55 dBm)', () => {
    expect(rssiBars(-42)).toBe(4);
    expect(rssiBars(-54)).toBe(4);
  });

  it('returns 3 bars for good signal (-55 to -65 dBm)', () => {
    expect(rssiBars(-55)).toBe(3);
    expect(rssiBars(-64)).toBe(3);
  });

  it('returns 2 bars for fair signal (-66 to -75 dBm)', () => {
    expect(rssiBars(-66)).toBe(2);
    expect(rssiBars(-74)).toBe(2);
  });

  it('returns 1 bar for poor signal (≤ -75 dBm)', () => {
    expect(rssiBars(-75)).toBe(1);
    expect(rssiBars(-95)).toBe(1);
  });
});
