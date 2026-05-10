import { Group, Stack, Text, Title } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { handleDrop } from './utils';

/**
 * Renders the Import session page — a full-page Mantine `Dropzone` shell
 * the user lands on from the sidebar nav or the Library page's "Import CSV"
 * button. Currently a placeholder for the design's three-stage flow
 * (drop → parsing → preview); only the drop surface is wired up. The Papa
 * Parse pipeline, validation panel, and session-details form land in
 * CLAUDE.md TODO §D.
 *
 * @returns The Import page React element.
 */
function Import() {
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
