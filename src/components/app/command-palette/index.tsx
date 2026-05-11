import { Modal, Stack, Text } from '@mantine/core';

interface CommandPaletteProps {
  readonly onClose: () => void;
  readonly opened: boolean;
  readonly testId?: string;
}

/**
 * Command palette placeholder — a Mantine `Modal` keyed off `⌘K` /
 * `Ctrl+K`. The full implementation (fuzzy-search across routes,
 * sessions, and PIDs) lands later; this render is just a stub so
 * the shortcut hangs off something visible.
 *
 * @returns The command palette modal React element.
 */
function CommandPalette({ onClose, opened, testId }: CommandPaletteProps) {
  return (
    <Modal
      centered
      data-testid={ testId }
      onClose={ onClose }
      opened={ opened }
      size="md"
      title="Command palette"
    >
      <Stack gap="sm">
        <Text c="dimmed" size="sm">
          A quick-search across pages, sessions, and PIDs is coming soon. The keyboard shortcut already works — the search itself is still on the way.
        </Text>
        <Text c="dimmed" size="xs">
          Press Escape to close.
        </Text>
      </Stack>
    </Modal>
  );
}

export default CommandPalette;
