import { Stack, Text, Title } from '@mantine/core';

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
