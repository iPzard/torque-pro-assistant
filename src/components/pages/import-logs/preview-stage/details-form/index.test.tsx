import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Vehicle } from 'types/session';

import DetailsForm from '.';

const defaultVehicle: Vehicle = { make: '', model: '', vin: '', year: 0 };

function renderForm(overrides: Partial<Parameters<typeof DetailsForm>[0]> = {}) {
  return render(
    <MantineProvider>
      <DetailsForm
        name=""
        notes=""
        onNameChange={ jest.fn() }
        onNotesChange={ jest.fn() }
        onVehicleChange={ jest.fn() }
        testId="details"
        vehicle={ defaultVehicle }
        { ...overrides }
      />
    </MantineProvider>
  );
}

describe('pages/import-logs/preview-stage/details-form', () => {
  it('renders the card wrapper', () => {
    renderForm();
    expect(screen.getByTestId('details')).toBeInTheDocument();
  });

  it('renders pre-filled name input', () => {
    renderForm({ name: 'morning-drive' });
    expect(screen.getByTestId('details-name')).toHaveValue('morning-drive');
  });

  it('renders pre-filled vehicle inputs', () => {
    renderForm({ vehicle: { make: 'Ford', model: 'Mustang', vin: '', year: 2018 } });
    expect(screen.getByTestId('details-vehicle-make')).toHaveValue('Ford');
    expect(screen.getByTestId('details-vehicle-model')).toHaveValue('Mustang');
  });

  it('typing into name fires onNameChange', async () => {
    const onNameChange = jest.fn();
    const user = userEvent.setup();
    renderForm({ onNameChange });
    await user.type(screen.getByTestId('details-name'), 'a');
    expect(onNameChange).toHaveBeenCalled();
  });

  it('typing into notes fires onNotesChange', async () => {
    const onNotesChange = jest.fn();
    const user = userEvent.setup();
    renderForm({ onNotesChange });
    await user.type(screen.getByTestId('details-notes'), 'a');
    expect(onNotesChange).toHaveBeenCalled();
  });

  it('typing into a vehicle field fires onVehicleChange', async () => {
    const onVehicleChange = jest.fn();
    const user = userEvent.setup();
    renderForm({ onVehicleChange });
    await user.type(screen.getByTestId('details-vehicle-make'), 'F');
    expect(onVehicleChange).toHaveBeenCalledWith({ make: 'F', model: '', vin: '', year: 0 });
  });
});
