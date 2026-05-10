import { Button, Group, Stack, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

function Library() {
  const navigate = useNavigate();

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Stack gap={ 4 }>
          <Title order={ 2 }>Library</Title>
          <Text c="dimmed" size="sm">
            Imported sessions will land here. Currently a placeholder.
          </Text>
        </Stack>
        <Button onClick={ () => navigate('/import') }>Import CSV</Button>
      </Group>
    </Stack>
  );
}

export default Library;
