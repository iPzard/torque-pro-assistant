import { NumberInput, SimpleGrid, Stack, Textarea, TextInput } from '@mantine/core';

import Card from 'components/primitives/card';
import type { Vehicle } from 'types/session';

interface DetailsFormProps {
  readonly name: string;
  readonly notes: string;
  readonly onNameChange: (next: string) => void;
  readonly onNotesChange: (next: string) => void;
  readonly onVehicleChange: (next: Vehicle) => void;
  readonly testId?: string;
  readonly vehicle: Vehicle;
}

/**
 * Session details form for the Import preview stage — captures the
 * fields that don't come out of the CSV directly (name, vehicle make /
 * model / year, optional notes). Pre-fills name from the file name
 * and vehicle from `preferences.vehicleDefaults` (composer wires it).
 *
 * Every input is controlled; the composer owns the state and routes
 * updates back to the parent. Save action lives on the composer too,
 * so the form is presentational.
 *
 * @returns A card containing the details form.
 */
function DetailsForm({
  name,
  notes,
  onNameChange,
  onNotesChange,
  onVehicleChange,
  testId,
  vehicle
}: DetailsFormProps) {
  return (
    <Card subtitle="name, vehicle, notes" testId={ testId } title="Session details">
      <Stack gap="md">
        <TextInput
          data-testid={ testId === undefined ? undefined : `${ testId }-name` }
          label="Session name"
          onChange={ (event) => onNameChange(event.currentTarget.value) }
          placeholder="Morning commute"
          required
          value={ name }
        />
        <SimpleGrid cols={ { base: 1, sm: 3 } } spacing="md">
          <TextInput
            data-testid={ testId === undefined ? undefined : `${ testId }-vehicle-make` }
            label="Make"
            onChange={ (event) => onVehicleChange({ ...vehicle, make: event.currentTarget.value }) }
            placeholder="Ford"
            value={ vehicle.make }
          />
          <TextInput
            data-testid={ testId === undefined ? undefined : `${ testId }-vehicle-model` }
            label="Model"
            onChange={ (event) => onVehicleChange({ ...vehicle, model: event.currentTarget.value }) }
            placeholder="Mustang"
            value={ vehicle.model }
          />
          <NumberInput
            data-testid={ testId === undefined ? undefined : `${ testId }-vehicle-year` }
            label="Year"
            max={ 2100 }
            min={ 1980 }
            onChange={ (next) => {
              if (typeof next === 'number') {
                onVehicleChange({ ...vehicle, year: next });
              }
            } }
            placeholder="2018"
            value={ vehicle.year === 0 ? '' : vehicle.year }
          />
        </SimpleGrid>
        <Textarea
          autosize
          data-testid={ testId === undefined ? undefined : `${ testId }-notes` }
          label="Notes"
          minRows={ 2 }
          onChange={ (event) => onNotesChange(event.currentTarget.value) }
          placeholder="Conditions, mods, anything to remember about this session"
          value={ notes }
        />
      </Stack>
    </Card>
  );
}

export default DetailsForm;
