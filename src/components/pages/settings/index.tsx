import {
  NumberInput,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title
} from '@mantine/core';

import Card from 'components/primitives/card';
import { useAppDispatch, useAppSelector } from 'state/hooks';
import {
  selectPreferences,
  setAccentShade,
  setDensity,
  setTheme,
  setUnits,
  setVehicleDefaults
} from 'state/preferences';

/**
 * Renders the Settings page — surfaces every field on the preferences
 * slice as a control. Changes dispatch immediately and the store's
 * subscribe listener persists to localStorage, so there's no save /
 * cancel split.
 *
 * Sections:
 *   - Appearance — theme + accent shade + density (display knobs).
 *   - Units      — imperial vs metric.
 *   - Vehicle    — defaults pre-filled into the Import flow.
 *
 * @returns The Settings page React element.
 */
function Settings() {
  const dispatch = useAppDispatch();
  const preferences = useAppSelector((state) => selectPreferences(state.preferences));

  return (
    <Stack data-testid="settings-page" gap="md">
      <Stack gap={ 4 }>
        <Title data-testid="settings-page-title" order={ 2 }>Settings</Title>
        <Text c="dimmed" data-testid="settings-page-description" size="sm">
          Tweaks persist locally; nothing leaves the device.
        </Text>
      </Stack>

      <Card subtitle="theme + accent + density" testId="settings-appearance" title="Appearance">
        <Stack gap="md">
          <Stack gap={ 4 }>
            <Text fw={ 500 } size="sm">Theme</Text>
            <SegmentedControl
              data={ [
                { label: 'Dark',  value: 'dark' },
                { label: 'Light', value: 'light' }
              ] }
              data-testid="settings-theme"
              onChange={ (next) => dispatch(setTheme(next as 'dark' | 'light')) }
              value={ preferences.theme }
            />
          </Stack>
          <Stack gap={ 4 }>
            <Text fw={ 500 } size="sm">Density</Text>
            <SegmentedControl
              data={ [
                { label: 'Compact', value: 'compact' },
                { label: 'Regular', value: 'regular' },
                { label: 'Comfy',   value: 'comfy' }
              ] }
              data-testid="settings-density"
              onChange={ (next) => dispatch(setDensity(next as 'comfy' | 'compact' | 'regular')) }
              value={ preferences.density }
            />
          </Stack>
          <NumberInput
            data-testid="settings-accent-shade"
            description="Mantine amber shade index. 6 matches the design."
            label="Accent shade"
            max={ 9 }
            min={ 1 }
            onChange={ (next) => {
              if (typeof next === 'number') dispatch(setAccentShade(next));
            } }
            value={ preferences.accentShade }
          />
        </Stack>
      </Card>

      <Card subtitle="speed, temperature, pressure" testId="settings-units" title="Units">
        <SegmentedControl
          data={ [
            { label: 'Imperial (mph · °F · psi)', value: 'imperial' },
            { label: 'Metric (km/h · °C · kPa)',  value: 'metric' }
          ] }
          data-testid="settings-units-toggle"
          onChange={ (next) => dispatch(setUnits(next as 'imperial' | 'metric')) }
          value={ preferences.units }
        />
      </Card>

      <Card subtitle="pre-fill the Import flow" testId="settings-vehicle" title="Vehicle defaults">
        <SimpleGrid cols={ { base: 1, sm: 3 } } spacing="md">
          <TextInput
            data-testid="settings-vehicle-make"
            label="Make"
            onChange={ (event) => dispatch(setVehicleDefaults({
              ...preferences.vehicleDefaults,
              make: event.currentTarget.value
            })) }
            placeholder="Ford"
            value={ preferences.vehicleDefaults.make }
          />
          <TextInput
            data-testid="settings-vehicle-model"
            label="Model"
            onChange={ (event) => dispatch(setVehicleDefaults({
              ...preferences.vehicleDefaults,
              model: event.currentTarget.value
            })) }
            placeholder="Mustang"
            value={ preferences.vehicleDefaults.model }
          />
          <NumberInput
            data-testid="settings-vehicle-year"
            label="Year"
            max={ 2100 }
            min={ 1980 }
            onChange={ (next) => {
              if (typeof next === 'number') {
                dispatch(setVehicleDefaults({
                  ...preferences.vehicleDefaults,
                  year: next
                }));
              }
            } }
            placeholder="2018"
            value={ preferences.vehicleDefaults.year === 0 ? '' : preferences.vehicleDefaults.year }
          />
        </SimpleGrid>
      </Card>
    </Stack>
  );
}

export default Settings;
