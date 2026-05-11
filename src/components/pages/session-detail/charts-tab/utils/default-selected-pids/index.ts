/**
 * Initial PID selection the Charts tab renders before the user
 * touches the picker drawer. Picked to cover the most-commonly-
 * inspected channels in a real Torque Pro export — top-line speed,
 * engine RPM, throttle input, boost, and coolant temp.
 *
 * Keys match `SessionDataRow` fields directly so the LineChart can
 * resolve them without translation.
 */
export const DEFAULT_SELECTED_PIDS: readonly string[] = [
  'speed_mph',
  'rpm',
  'throttle',
  'boost_psi',
  'coolant_f'
];
