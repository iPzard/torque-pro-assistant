import { Group, Stack, Text, Title } from '@mantine/core';
import { Dropzone, MIME_TYPES, type FileWithPath } from '@mantine/dropzone';

// Placeholder for the design's three-stage Import flow (drop → parsing →
// preview). For now, just the dropzone shell — Papa Parse wiring,
// validation panel, and the session-details form land during feature work.
function Import() {
  const handleDrop = (files: FileWithPath[]): void => {
    console.log('Dropped CSV files (parser wiring deferred):', files.map((f) => f.name));
  };

  return (
    <Stack gap="md">
      <Stack gap={ 4 }>
        <Title order={ 2 }>Import session</Title>
        <Text c="dimmed" size="sm">
          Drop a Torque Pro CSV export, or pick one from disk. Parsing
          happens on-device — your logs never leave the machine.
        </Text>
      </Stack>

      <Dropzone
        onDrop={ handleDrop }
        // text/csv covers the canonical mime; some OSes report
        // application/vnd.ms-excel for .csv exports, so accept that too.
        accept={ [MIME_TYPES.csv, 'application/vnd.ms-excel'] }
        maxSize={ 200 * 1024 * 1024 }
        multiple={ false }
      >
        <Group justify="center" gap="xl" mih={ 280 } style={ { pointerEvents: 'none' } }>
          <Stack gap={ 4 } align="center">
            <Text size="lg" fw={ 500 }>Drop CSV here</Text>
            <Text size="xs" c="dimmed">or click to browse — up to 200 MB</Text>
          </Stack>
        </Group>
      </Dropzone>
    </Stack>
  );
}

export default Import;
