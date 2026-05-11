import { Group, Stack, Text } from '@mantine/core';
import type { ColumnDetection } from 'utils';

import Card from 'components/primitives/card';

export interface DetectedColumnsProps {
  readonly columns: readonly ColumnDetection[];
  readonly testId?: string;
}

/**
 * Detected-columns checklist for the Import preview stage. Renders
 * one row per CSV header showing the raw header text alongside the
 * `SessionDataRow` field it mapped to (or "unrecognized" when the
 * adapter didn't match anything). Unrecognized columns aren't an
 * error — Torque exports vary by PID selection — they're just a
 * heads-up so the user notices when something they expected didn't
 * make it through.
 *
 * @returns A card listing the detected columns.
 */
function DetectedColumns({ columns, testId }: DetectedColumnsProps) {
  const recognized = columns.filter((entry) => entry.mappedTo !== null).length;

  return (
    <Card
      subtitle={ `${ recognized } of ${ columns.length } columns mapped` }
      testId={ testId }
      title="Detected columns"
    >
      <Stack gap={ 4 }>
        { columns.length === 0 && (
          <Text c="dimmed" data-testid={ testId === undefined ? undefined : `${ testId }-empty` } size="sm">
            No columns detected.
          </Text>
        ) }
        { columns.map((column) => (
          <Group
            key={ column.header }
            data-testid={ testId === undefined ? undefined : `${ testId }-row-${ column.header }` }
            gap="sm"
            justify="space-between"
            wrap="nowrap"
          >
            <Text size="sm" style={ { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }>
              { column.header }
            </Text>
            <Text c={ column.mappedTo === null ? 'dimmed' : undefined } ff="monospace" size="xs">
              { column.mappedTo ?? 'unrecognized' }
            </Text>
          </Group>
        )) }
      </Stack>
    </Card>
  );
}

export default DetectedColumns;
