/**
 * Map a raw RSSI value (dBm; closer to 0 = stronger) onto the 1-4
 * bucket displayed by the rssi-bars indicator in the device list. The
 * thresholds match common Wi-Fi / BT signal-strength conventions:
 *
 *   > -55  → 4 bars (excellent)
 *   > -65  → 3 bars (good)
 *   > -75  → 2 bars (fair)
 *   else   → 1 bar  (poor)
 *
 * @param rssi Measured signal strength in dBm.
 * @returns Bucket 1-4 for rendering.
 */
export const rssiBars = (rssi: number): number => {
  if (rssi > -55) return 4;
  if (rssi > -65) return 3;
  if (rssi > -75) return 2;
  return 1;
};
