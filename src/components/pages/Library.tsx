import { Button, Group, Stack, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import ImportDropzone from '../ImportDropzone';

function Library() {
  const [importOpen, { close, open }] = useDisclosure(false);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Stack gap={ 4 }>
          <Title order={ 2 }>Library</Title>
          <Text c="dimmed" size="sm">
            Imported sessions will land here. Currently a placeholder.
          </Text>
        </Stack>
        <Button onClick={ open }>Import CSV</Button>
      </Group>

      <ImportDropzone opened={ importOpen } onClose={ close } />
    </Stack>
  );
}

export default Library;
