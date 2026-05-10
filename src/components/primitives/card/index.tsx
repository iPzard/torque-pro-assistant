import { Card as MantineCard, Group, Text } from '@mantine/core';
import type { ReactNode } from 'react';

import styles from './index.module.scss';

interface CardProps {
  /** Right-aligned header content — buttons / kbd hints / status pills. */
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
  /** Drop body padding (use when the body owns its own layout — e.g. tables). */
  readonly flush?: boolean;
  /** Optional sub-line shown inline next to the title. */
  readonly subtitle?: ReactNode;
  readonly testId?: string;
  /** Card title; when omitted (and `actions` is too) the header bar is hidden. */
  readonly title?: ReactNode;
}

/**
 * Design-matched card primitive. Mirrors the design's `card` element —
 * a bordered surface with an optional title + actions header row and a
 * padded (or flush) body. Thin wrapper around Mantine's `Card`; the
 * design's hover / shadow / radius defaults are baked in via the
 * `radius` + `withBorder` + `padding={0}` combination so the header /
 * body sections can manage their own spacing.
 *
 * @returns A bordered card containing the children, optionally framed
 *   by a header bar with the title, subtitle, and actions.
 */
function Card({ actions, children, className, flush = false, subtitle, testId, title }: CardProps) {
  const hasHeader = title !== undefined || actions !== undefined;
  return (
    <MantineCard
      className={ className }
      data-testid={ testId }
      padding={ 0 }
      radius="md"
      withBorder
    >
      { hasHeader && (
        <Group className={ styles.header } gap="sm" justify="space-between" px="md" py="sm">
          <Group align="baseline" gap="xs">
            { title !== undefined && (
              <Text data-testid={ testId ? `${testId}-title` : undefined } fw={ 600 } size="sm">
                { title }
              </Text>
            ) }
            { subtitle !== undefined && (
              <Text c="dimmed" data-testid={ testId ? `${testId}-subtitle` : undefined } size="xs">
                { subtitle }
              </Text>
            ) }
          </Group>
          { actions !== undefined && (
            <Group data-testid={ testId ? `${testId}-actions` : undefined } gap="xs">
              { actions }
            </Group>
          ) }
        </Group>
      ) }
      <div
        className={ flush ? styles.bodyFlush : styles.body }
        data-testid={ testId ? `${testId}-body` : undefined }
      >
        { children }
      </div>
    </MantineCard>
  );
}

export default Card;
