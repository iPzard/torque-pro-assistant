/**
 * Barrel for the adapter-pairing modal's local utils. Mock device
 * catalog + RSSI bucket helper + scripted AT-command sequence — all
 * pure data / pure functions so the modal can render deterministically
 * before a real Bluetooth bridge is wired.
 */
export type { AdapterChip, MockDevice } from './mock-devices';
export { MOCK_DEVICES } from './mock-devices';
export type { ProbeLine, ProbeLineKind } from './probe-script';
export { HEALTHY_PROBE, NO_PROTOCOL_PROBE } from './probe-script';
export { rssiBars } from './rssi-bars';
