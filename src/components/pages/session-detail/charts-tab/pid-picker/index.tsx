import { Checkbox, Drawer, Group, Stack, Text, TextInput } from '@mantine/core';
import { useMemo, useState } from 'react';

import { PID_CATEGORIES } from 'data/pids';

export interface PidPickerProps {
  readonly onChange: (next: readonly string[]) => void;
  readonly onClose: () => void;
  readonly opened: boolean;
  readonly selectedPids: readonly string[];
  readonly testId?: string;
}

/**
 * Mantine `Drawer` housing the categorized PID picker for the
 * Charts tab. Renders each `PID_CATEGORIES` group as a section with
 * its label and a column of checkboxes — one per PID in that group.
 * A search input at the top filters across labels and keys so the
 * user doesn't have to scroll the entire catalog.
 *
 * Selection state is controlled — every toggle fires `onChange`
 * with the new array. The drawer itself doesn't apply / commit;
 * caller owns the persisted state.
 *
 * @returns The PID picker drawer React element.
 */
function PidPicker({ onChange, onClose, opened, selectedPids, testId }: PidPickerProps) {
  const [query, setQuery] = useState('');
  const selectedSet = useMemo(() => new Set(selectedPids), [selectedPids]);

  const filteredCategories = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (lower === '') return PID_CATEGORIES;
    return PID_CATEGORIES
      .map((category) => ({
        ...category,
        pids: category.pids.filter(
          (pid) =>
            pid.label.toLowerCase().includes(lower)
            || pid.key.toLowerCase().includes(lower)
        )
      }))
      .filter((category) => category.pids.length > 0);
  }, [query]);

  return (
    <Drawer
      data-testid={ testId }
      onClose={ onClose }
      opened={ opened }
      padding="md"
      position="right"
      size="md"
      title="PID picker"
    >
      <Stack gap="md">
        <TextInput
          data-testid={ testId === undefined ? undefined : `${ testId }-search` }
          onChange={ (event) => setQuery(event.currentTarget.value) }
          placeholder="Search PIDs"
          value={ query }
        />
        { filteredCategories.length === 0 && (
          <Text
            c="dimmed"
            data-testid={ testId === undefined ? undefined : `${ testId }-no-results` }
            size="sm"
          >
            No PIDs match &ldquo;{ query }&rdquo;.
          </Text>
        ) }
        { filteredCategories.map((category) => (
          <Stack
            key={ category.id }
            data-testid={ testId === undefined ? undefined : `${ testId }-category-${ category.id }` }
            gap={ 6 }
          >
            <Text c="dimmed" fw={ 600 } size="xs" tt="uppercase">
              { category.label }
            </Text>
            { category.pids.map((pid) => (
              <Group key={ pid.key } gap="sm" wrap="nowrap">
                <Checkbox
                  checked={ selectedSet.has(pid.key) }
                  data-testid={ testId === undefined ? undefined : `${ testId }-pid-${ pid.key }` }
                  label={ pid.label }
                  onChange={ (event) => {
                    const next = new Set(selectedSet);
                    if (event.currentTarget.checked) {
                      next.add(pid.key);
                    } else {
                      next.delete(pid.key);
                    }
                    onChange(Array.from(next));
                  } }
                />
                <Text c="dimmed" size="xs">{ pid.unit }</Text>
              </Group>
            )) }
          </Stack>
        )) }
      </Stack>
    </Drawer>
  );
}

export default PidPicker;
