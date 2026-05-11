import { Group, SegmentedControl, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';

import type { UnitsPreference } from 'state/preferences';

interface LibraryToolbarProps {
  readonly fromDate: Date | null;
  readonly onFromDateChange: (next: Date | null) => void;
  readonly onQueryChange: (next: string) => void;
  readonly onToDateChange: (next: Date | null) => void;
  readonly onUnitsChange: (next: UnitsPreference) => void;
  readonly query: string;
  readonly testId?: string;
  readonly toDate: Date | null;
  readonly units: UnitsPreference;
}

/**
 * Toolbar above the Library sessions table — search by name, narrow
 * by date range, and swap units without leaving the page.
 *
 * Every control is controlled by the caller; the toolbar itself holds
 * no internal state. Date inputs use Mantine's `@mantine/dates`
 * `DateInput` (no provider required for the basic clear / pick UI).
 *
 * @returns The Library toolbar React element.
 */
function LibraryToolbar({
  fromDate,
  onFromDateChange,
  onQueryChange,
  onToDateChange,
  onUnitsChange,
  query,
  testId,
  toDate,
  units
}: LibraryToolbarProps) {
  return (
    <Group align="flex-end" data-testid={ testId } gap="md" wrap="wrap">
      <TextInput
        data-testid={ testId === undefined ? undefined : `${ testId }-search` }
        label="Search"
        onChange={ (event) => onQueryChange(event.currentTarget.value) }
        placeholder="Filter by name"
        style={ { flex: 1, minWidth: 220 } }
        value={ query }
      />
      <DateInput
        clearable
        data-testid={ testId === undefined ? undefined : `${ testId }-from` }
        label="From"
        onChange={ (next) => onFromDateChange(next === null ? null : new Date(next)) }
        placeholder="Any"
        style={ { width: 160 } }
        value={ fromDate }
        valueFormat="YYYY-MM-DD"
      />
      <DateInput
        clearable
        data-testid={ testId === undefined ? undefined : `${ testId }-to` }
        label="To"
        onChange={ (next) => onToDateChange(next === null ? null : new Date(next)) }
        placeholder="Any"
        style={ { width: 160 } }
        value={ toDate }
        valueFormat="YYYY-MM-DD"
      />
      <SegmentedControl
        data={ [
          { label: 'mph',  value: 'imperial' },
          { label: 'km/h', value: 'metric' }
        ] }
        data-testid={ testId === undefined ? undefined : `${ testId }-units` }
        onChange={ (next) => onUnitsChange(next as UnitsPreference) }
        value={ units }
      />
    </Group>
  );
}

export default LibraryToolbar;
