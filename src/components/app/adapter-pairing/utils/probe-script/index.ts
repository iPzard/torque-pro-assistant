/**
 * Scripted AT-command / OBD-PID exchange the pairing probe stage
 * replays as a fake terminal. Sequence matches the standard ELM327
 * handshake any Torque-style client runs on connect:
 *
 *   ATZ    — soft reset, reports firmware string
 *   ATE0   — disable command echo
 *   ATSP0  — auto-select OBD protocol
 *   0100   — Mode 01 PID 00: supported PIDs bitmask
 *   ATDP   — describe the protocol the adapter settled on
 *   0902   — Mode 09 PID 02: VIN
 *
 * `kind: 'err'` rows surface NO DATA / timeout style responses; the
 * `no-protocol` failure path swaps the last three lines to that bucket
 * so the UI can show the warn alert without a separate script.
 */

/** Severity of a single probe line. Drives the trailing status icon
 *  + the response cell color. */
export type ProbeLineKind = 'err' | 'ok' | 'warn';

/** One row in the scripted terminal — the command sent, the adapter's
 *  response, and the row's severity. */
export interface ProbeLine {
  readonly kind: ProbeLineKind;
  readonly response: string;
  readonly tx: string;
}

/** Healthy probe — the adapter settles on CAN 11/500 and returns a VIN. */
export const HEALTHY_PROBE: readonly ProbeLine[] = [
  { kind: 'ok', response: 'ELM327 v1.5',                                     tx: 'ATZ' },
  { kind: 'ok', response: 'OK',                                              tx: 'ATE0' },
  { kind: 'ok', response: 'OK',                                              tx: 'ATSP0' },
  { kind: 'ok', response: '41 00 BE 3F A8 13',                               tx: '0100' },
  { kind: 'ok', response: 'ISO 15765-4 (CAN 11/500)',                        tx: 'ATDP' },
  { kind: 'ok', response: '49 02 01 57 44 44 32 4A 36 42 42 30 4B 41',       tx: '0902' }
];

/** "Connected but no protocol" failure — adapter is fine, ECU doesn't
 *  answer. Causes the no-protocol warn alert to render. */
export const NO_PROTOCOL_PROBE: readonly ProbeLine[] = [
  { kind: 'ok',   response: 'ELM327 v1.5', tx: 'ATZ' },
  { kind: 'ok',   response: 'OK',          tx: 'ATE0' },
  { kind: 'ok',   response: 'OK',          tx: 'ATSP0' },
  { kind: 'err',  response: 'NO DATA',     tx: '0100' },
  { kind: 'warn', response: 'AUTO',        tx: 'ATDP' },
  { kind: 'err',  response: 'NO DATA',     tx: '0902' }
];
