import { Group, Stack, Text, Title } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from 'state/hooks';

import { handleDrop } from './utils';

/**
 * Renders the Import Logs page — a full-page Mantine `Dropzone` shell
 * the user lands on from the sidebar nav or the Library page's "Import
 * CSV" button. Drops are parsed on the renderer, dispatched into the
 * sessions slice, and the user is routed to `/library` where the new
 * session shows up at the top.
 *
 * Currently a minimum-viable drop surface; the design's full three-stage
 * flow (drop → parsing-progress → validated-preview → details form)
 * lands in CLAUDE.md TODO §D. The util used here (`handleDrop`) is
 * already the right boundary for that expansion — only the page-level
 * UX around it changes.
 *
 * @returns The Import Logs page React element.
 */
function ImportLogs() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return (
    <Stack data-testid="import-logs-page" gap="md">
      <Stack gap={ 4 }>
        <Title data-testid="import-logs-page-title" order={ 2 }>Import session</Title>
        <Text c="dimmed" data-testid="import-logs-page-description" size="sm">
          Drop a Torque Pro CSV export, or pick one from disk. Parsing
          happens on-device — your logs never leave the machine.
        </Text>
      </Stack>

      {/* `accept` covers both the canonical text/csv mime and the
          application/vnd.ms-excel spelling some OSes report for .csv. */}
      <Dropzone
        accept={ [MIME_TYPES.csv, 'application/vnd.ms-excel'] }
        data-testid="import-logs-dropzone"
        maxSize={ 200 * 1024 * 1024 }
        multiple={ false }
        onDrop={ (files) => { void handleDrop(files, { dispatch, navigate }); } }
      >
        <Group gap="xl" justify="center" mih={ 280 } style={ { pointerEvents: 'none' } }>
          <Stack align="center" gap={ 4 }>
            <Text data-testid="import-logs-dropzone-headline" fw={ 500 } size="lg">Drop CSV here</Text>
            <Text c="dimmed" data-testid="import-logs-dropzone-hint" size="xs">
              or click to browse — up to 200 MB
            </Text>
          </Stack>
        </Group>
      </Dropzone>
    </Stack>
  );
}

export default ImportLogs;
