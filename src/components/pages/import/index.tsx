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

      {/* `accept` covers both the canonical text/csv mime and the
          application/vnd.ms-excel spelling some OSes report for .csv. */}
      <Dropzone
        accept={ [MIME_TYPES.csv, 'application/vnd.ms-excel'] }
        maxSize={ 200 * 1024 * 1024 }
        multiple={ false }
        onDrop={ handleDrop }
      >
        <Group gap="xl" justify="center" mih={ 280 } style={ { pointerEvents: 'none' } }>
          <Stack align="center" gap={ 4 }>
            <Text fw={ 500 } size="lg">Drop CSV here</Text>
            <Text c="dimmed" size="xs">or click to browse — up to 200 MB</Text>
          </Stack>
        </Group>
      </Dropzone>
    </Stack>
  );
}

export default Import;
