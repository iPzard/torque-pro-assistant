import { Stack, Text, Title } from '@mantine/core';

function Library() {
  return (
    <Stack gap="xs">
      <Title order={ 2 }>Library</Title>
      <Text c="dimmed">
        Imported sessions will land here. Currently a placeholder.
      </Text>
    </Stack>
  );
}

export default Library;
