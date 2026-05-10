import { Stack, Text } from '@mantine/core';

import styles from './index.module.scss';

interface MetricProps {
  /** Short label rendered above the value. Tracks the design's all-caps,
   *  10px label style. */
  readonly label: string;
  /** Highlights the metric with the amber accent — used for the "peak"
   *  metrics in the Session Overview grid (max speed, peak HP, etc.). */
  readonly peak?: boolean;
  /** Optional secondary line under the value — e.g. `@ 11:52` or
   *  `moving avg`. */
  readonly sub?: string;
  readonly testId?: string;
  /** Optional unit suffix rendered inline at the end of the value. */
  readonly unit?: string;
  /** Already-formatted display value. Caller decides precision / unit
   *  conversion before passing in. */
  readonly value: string | number;
}

/**
 * Single tile from the Session Overview "summary grid" — one label, one
 * big value, an optional unit + sub-line. The design lays eight of
 * these out in a responsive grid; consumers render Metric in the cells
 * and the grid styling lives at the consuming page.
 *
 * `peak` flips the value color to the amber brand accent — reserved for
 * the design's "peak" tiles (max speed, peak HP, peak torque, max
 * boost).
 *
 * @returns A small label / value / sub tile.
 */
function Metric({ label, peak = false, sub, testId, unit, value }: MetricProps) {
  return (
    <Stack className={ styles.metric } data-testid={ testId } gap={ 4 }>
      <Text className={ styles.label } data-testid={ testId ? `${testId}-label` : undefined }>
        { label }
      </Text>
      <Text
        className={ peak ? styles.valuePeak : styles.value }
        data-testid={ testId ? `${testId}-value` : undefined }
      >
        { value }
        { unit !== undefined && (
          <Text className={ styles.unit } data-testid={ testId ? `${testId}-unit` : undefined } span>
            { unit }
          </Text>
        ) }
      </Text>
      { sub !== undefined && (
        <Text className={ styles.sub } data-testid={ testId ? `${testId}-sub` : undefined }>
          { sub }
        </Text>
      ) }
    </Stack>
  );
}

export default Metric;
