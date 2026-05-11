import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { SavedVehicle } from 'state/preferences';

import DeleteDialog from '.';

const makeVehicle = (overrides: Partial<SavedVehicle> = {}): SavedVehicle => ({
  addedAt: '2024-10-28T13:50:51.000Z',
  id:      'v1',
  make:    'Mercedes-Benz',
  model:   'AMG GT 53',
  vin:     'WDD2J6BB0KA000000',
  year:    2019,
  ...overrides
});

describe('pages/vehicle-detail/delete-dialog', () => {
  it('renders the dialog with vehicle copy', () => {
    render(
      <DeleteDialog
        calibrationCount={ 2 }
        onCancel={ jest.fn() }
        onConfirm={ jest.fn() }
        testId="delete"
        vehicle={ makeVehicle() }
      />
    );
    expect(screen.getByTestId('delete')).toBeInTheDocument();
  });

  it('Cancel button fires onCancel', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    render(
      <DeleteDialog
        calibrationCount={ 0 }
        onCancel={ onCancel }
        onConfirm={ jest.fn() }
        testId="delete"
        vehicle={ makeVehicle() }
      />
    );
    await user.click(screen.getByTestId('delete-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('Confirm button fires onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    render(
      <DeleteDialog
        calibrationCount={ 0 }
        onCancel={ jest.fn() }
        onConfirm={ onConfirm }
        testId="delete"
        vehicle={ makeVehicle() }
      />
    );
    await user.click(screen.getByTestId('delete-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('Escape key fires onCancel', () => {
    const onCancel = jest.fn();
    render(
      <DeleteDialog
        calibrationCount={ 0 }
        onCancel={ onCancel }
        onConfirm={ jest.fn() }
        testId="delete"
        vehicle={ makeVehicle() }
      />
    );
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
