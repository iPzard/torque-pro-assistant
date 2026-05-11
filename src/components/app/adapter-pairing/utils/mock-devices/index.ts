/**
 * Mock OBD-II adapter catalog the pairing scan stage streams through
 * the UI. Real Bluetooth discovery isn't wired yet (would need an
 * Electron-side `noble` / `@abandonware/noble` bridge); until then the
 * pairing flow runs against this fake set so the visual flow + state
 * machine can be tested in isolation.
 *
 * Five entries cover the common chipsets and a spread of RSSI values
 * so the rssi-bars indicator exercises each bucket.
 */

/** Chipset family — `elm327` is the canonical reference chip; `stn1170`
 *  is OBDLink's faster, multi-protocol successor. */
export type AdapterChip = 'elm327' | 'stn1170';

/** One discoverable Bluetooth OBD-II adapter. */
export interface MockDevice {
  readonly chip: AdapterChip;
  readonly firmware: string;
  readonly mac: string;
  readonly name: string;
  /** Signal strength in dBm; closer to 0 = stronger. */
  readonly rssi: number;
  readonly vendor: string;
}

export const MOCK_DEVICES: readonly MockDevice[] = [
  { chip: 'elm327',  firmware: '1.5',   mac: '00:1D:A5:68:98:8B', name: 'OBDII',                rssi: -42, vendor: 'Veepeak Mini' },
  { chip: 'elm327',  firmware: '1.5',   mac: '88:6B:0F:3C:1A:09', name: 'BAFX Products 34t5',   rssi: -61, vendor: 'BAFX' },
  { chip: 'stn1170', firmware: '4.5.3', mac: '00:04:3E:7A:11:42', name: 'OBDLink MX+',          rssi: -55, vendor: 'OBDLink' },
  { chip: 'elm327',  firmware: '2.1',   mac: '30:14:08:14:8E:22', name: 'Carista',              rssi: -73, vendor: 'Carista' },
  { chip: 'elm327',  firmware: '2.2',   mac: 'A4:34:F1:09:55:7B', name: 'iCar Pro',             rssi: -82, vendor: 'Vgate' }
];
