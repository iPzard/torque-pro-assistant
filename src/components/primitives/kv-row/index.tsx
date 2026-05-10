import { Group, Text } from '@mantine/core';
import type { ReactNode } from 'react';

import styles from './index.module.scss';

interface KvRowProps {
  /** Left-aligned label — dimmed by default. */
  readonly label: ReactNode;
  /** Drops the bottom border. Use on the last row of a stack. */
  readonly last?: boolean;
  readonly testId?: string;
  /** Right-aligned value. */
  readonly value: ReactNode;
}

/**
 * Single label / value row — used in the design's Trip Stats card,
 * Hotspots panel, and side-by-side comparison summaries. Renders the
 * label dimmed on the left and the value right-aligned in the mono
 * font, separated by a one-pixel bottom border unless `last` is set.
 *
 * @returns One key/value row.
 */
function KvRow({ label, last = false, testId, value }: KvRowProps) {
  return (
    <Group
      className={ last ? styles.rowLast : styles.row }
      data-testid={ testId }
      gap="sm"
      justify="space-between"
      wrap="nowrap"
    >
      <Text c="dimmed" data-testid={ testId ? `${testId}-label` : undefined } size="sm">
        { label }
      </Text>
      <Text className={ styles.value } data-testid={ testId ? `${testId}-value` : undefined }>
        { value }
      </Text>
    </Group>
  );
}

export default KvRow;
