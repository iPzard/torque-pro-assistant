import { Stack, Text, Title } from '@mantine/core';

/**
 * Renders the Settings page — the design's preferences view, exposing
 * theme, density, units (imperial/metric), accent shade, and vehicle
 * defaults. State is meant to be backed by a `preferencesSlice` persisted
 * to disk. Currently a placeholder; real content lands in CLAUDE.md
 * TODO §G.
 *
 * @returns The Settings page React element.
 */
function Settings() {
  return (
    <Stack gap="xs">
      <Title order={ 2 }>Settings</Title>
      <Text c="dimmed">
        Theme, units, and vehicle defaults will live here. Currently a placeholder.
      </Text>
    </Stack>
  );
}

export default Settings;
