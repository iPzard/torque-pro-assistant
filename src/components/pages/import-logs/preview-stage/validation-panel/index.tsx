import { Stack, Text } from '@mantine/core';

import type { ValidationFlag, ValidationLevel } from 'components/pages/import-logs/utils';
import Card from 'components/primitives/card';

interface ValidationPanelProps {
  readonly flags: readonly ValidationFlag[];
  readonly testId?: string;
}

/** Color-by-level dot used in the leftmost slot of each validation
 *  row. Green for info, amber for warn, red for error. */
const LEVEL_COLOR: Record<ValidationLevel, string> = {
  error: 'var(--mantine-color-red-5)',
  info:  'var(--mantine-color-green-5)',
  warn:  'var(--mantine-color-amber-6)'
};

/**
 * Validation checklist for the Import preview stage. Renders one row
 * per flag in `validateParsed`'s output, with the level dot + message +
 * optional secondary `detail` line (e.g. "23 rows jump backwards…").
 * The composer above blocks the Save action when any flag is
 * `error`-level; lower levels are informational and don't gate the
 * import.
 *
 * @returns A card listing the validation flags.
 */
function ValidationPanel({ flags, testId }: ValidationPanelProps) {
  return (
    <Card subtitle="checks against the parsed file" testId={ testId } title="Validation">
      <Stack gap="sm">
        { flags.map((flag) => (
          <Stack
            key={ flag.id }
            data-testid={ testId === undefined ? undefined : `${ testId }-row-${ flag.id }` }
            gap={ 2 }
          >
            <div style={ { alignItems: 'center', display: 'flex', gap: 10 } }>
              <span
                aria-hidden
                data-testid={ testId === undefined ? undefined : `${ testId }-dot-${ flag.id }` }
                style={ {
                  background:   LEVEL_COLOR[flag.level],
                  borderRadius: '50%',
                  flex:         'none',
                  height:       10,
                  width:        10
                } }
              />
              <Text size="sm">{ flag.message }</Text>
            </div>
            { flag.detail !== undefined && (
              <Text
                c="dimmed"
                data-testid={ testId === undefined ? undefined : `${ testId }-detail-${ flag.id }` }
                size="xs"
                style={ { paddingLeft: 20 } }
              >
                { flag.detail }
              </Text>
            ) }
          </Stack>
        )) }
      </Stack>
    </Card>
  );
}

export default ValidationPanel;
