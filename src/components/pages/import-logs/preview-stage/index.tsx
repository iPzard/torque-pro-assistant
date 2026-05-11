import { Button, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { useMemo, useState } from 'react';

import type { ParsedFile, ValidationFlag } from 'components/pages/import-logs/utils';
import {
  buildSession,
  validateParsed
} from 'components/pages/import-logs/utils';
import { useAppSelector } from 'state/hooks';
import { selectPreferences } from 'state/preferences';
import type { Session, Vehicle } from 'types/session';

import DetailsForm from './details-form';
import DetectedColumns from './detected-columns';
import PreviewTable from './preview-table';
import ValidationPanel from './validation-panel';

interface PreviewStageProps {
  /** Fires when the user hits Cancel — composer should drop back to
   *  the drop stage and clear the parsed payload. */
  readonly onCancel: () => void;
  /** Fires when the user hits Save with a valid form — composer
   *  dispatches `addSession` and routes to `/library`. */
  readonly onSaved: (session: Session) => void;
  readonly parsedFile: ParsedFile;
  readonly testId?: string;
}

/**
 * Preview stage of the Import flow. Renders the parsed CSV preview
 * (sample table + detected columns + validation panel) alongside the
 * session details form. Save / Cancel emit out to the composer; this
 * stage itself doesn't touch Redux or the router.
 *
 * Form state is local. Initial values:
 *   - `name`    `parsedFile.defaultName` (the filename minus `.csv`).
 *   - `vehicle` `preferences.vehicleDefaults` from the prefs slice.
 *   - `notes`   empty.
 *
 * Save is blocked while the validation panel reports any `error`-level
 * flag — `validateParsed` currently only flips that on for the empty-
 * rows case, which `parseFile` also rejects upstream, but the guard
 * keeps the contract clean for future validators.
 *
 * @returns The Import preview stage React element.
 */
function PreviewStage({ onCancel, onSaved, parsedFile, testId }: PreviewStageProps) {
  const preferences = useAppSelector((state) => selectPreferences(state.preferences));

  const [name, setName] = useState(parsedFile.defaultName);
  const [vehicle, setVehicle] = useState<Vehicle>({
    ...preferences.vehicleDefaults,
    vin: ''
  });
  const [notes, setNotes] = useState('');

  const flags: readonly ValidationFlag[] = useMemo(
    () => validateParsed(parsedFile.parsed),
    [parsedFile.parsed]
  );
  const hasErrors = flags.some((flag) => flag.level === 'error');
  const canSave = !hasErrors && name.trim() !== '';

  const handleSave = (): void => {
    if (!canSave) return;
    const session = buildSession({
      fileName: parsedFile.fileName,
      fileSize: parsedFile.fileSize,
      name,
      notes,
      parsed:   parsedFile.parsed,
      vehicle
    });
    onSaved(session);
  };

  return (
    <Stack data-testid={ testId } gap="md">
      <Group justify="space-between">
        <Text c="dimmed" data-testid={ testId === undefined ? undefined : `${ testId }-filename` } size="sm">
          { parsedFile.fileName } · { parsedFile.parsed.rows.length.toLocaleString() } rows
        </Text>
        <Group gap="sm">
          <Button
            data-testid={ testId === undefined ? undefined : `${ testId }-cancel` }
            onClick={ onCancel }
            variant="default"
          >
            Cancel
          </Button>
          <Button
            data-testid={ testId === undefined ? undefined : `${ testId }-save` }
            disabled={ !canSave }
            onClick={ handleSave }
          >
            Save session
          </Button>
        </Group>
      </Group>

      <SimpleGrid cols={ { base: 1, md: 2 } } spacing="md">
        <ValidationPanel
          flags={ flags }
          testId={ testId === undefined ? undefined : `${ testId }-validation` }
        />
        <DetectedColumns
          columns={ parsedFile.parsed.detectedColumns }
          testId={ testId === undefined ? undefined : `${ testId }-columns` }
        />
      </SimpleGrid>

      <PreviewTable
        rows={ parsedFile.parsed.rows }
        testId={ testId === undefined ? undefined : `${ testId }-preview` }
      />

      <DetailsForm
        name={ name }
        notes={ notes }
        onNameChange={ setName }
        onNotesChange={ setNotes }
        onVehicleChange={ setVehicle }
        testId={ testId === undefined ? undefined : `${ testId }-details` }
        vehicle={ vehicle }
      />
    </Stack>
  );
}

export default PreviewStage;
