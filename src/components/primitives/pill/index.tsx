import { Group, Text } from '@mantine/core';
import type { ReactNode } from 'react';

import styles from './index.module.scss';

/**
 * Status variant — drives the dot color (and amber pill body in the
 * `amber` case, matching the design's vehicle-status pill).
 */
export type PillStatus = 'amber' | 'err' | 'neutral' | 'ok' | 'warn';

interface PillProps {
  readonly children: ReactNode;
  /** Hides the leading status dot. Useful for plain count / label pills. */
  readonly noDot?: boolean;
  readonly status?: PillStatus;
  readonly testId?: string;
}

/**
 * Compact rounded label used across the design — connection status,
 * row counts, vehicle name, filter chips. A small colored dot precedes
 * the text when `noDot` is not set; status drives the dot color and (for
 * `amber`) the pill background.
 *
 * @returns A pill containing the children with an optional status dot.
 */
function Pill({ children, noDot = false, status = 'neutral', testId }: PillProps) {
  return (
    <Group
      className={ status === 'amber' ? styles.pillAmber : styles.pill }
      data-testid={ testId }
      gap={ 5 }
      wrap="nowrap"
    >
      { !noDot && (
        <span
          aria-hidden
          className={ styles[`dot-${status}`] }
          data-testid={ testId ? `${testId}-dot` : undefined }
        />
      ) }
      <Text className={ styles.label } data-testid={ testId ? `${testId}-label` : undefined } span>
        { children }
      </Text>
    </Group>
  );
}

export default Pill;
