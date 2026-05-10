import { Group, Modal, Stack, Text } from '@mantine/core';
import { Dropzone, MIME_TYPES, type FileWithPath } from '@mantine/dropzone';

interface ImportDropzoneProps {
  opened: boolean;
  onClose: () => void;
}

// Modal-hosted Dropzone for the "Import CSV" header button. No parsing logic
// yet — onDrop just logs. Wiring Papa Parse + the renderer-side ingestion
// flow comes when feature work begins.
function ImportDropzone({ opened, onClose }: ImportDropzoneProps) {
  const handleDrop = (files: FileWithPath[]): void => {
    console.log('Dropped CSV files (parser wiring deferred):', files.map((f) => f.name));
  };

  return (
    <Modal
      opened={ opened }
      onClose={ onClose }
      title="Import CSV"
      size="lg"
      centered
    >
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          Drop a Torque Pro CSV export here, or click to browse. Parsing
          happens on-device — your logs never leave the machine.
        </Text>

        <Dropzone
          onDrop={ handleDrop }
          // text/csv covers the canonical mime type; some OSes report
          // application/vnd.ms-excel for .csv exports, so allow that too.
          accept={ [MIME_TYPES.csv, 'application/vnd.ms-excel'] }
          maxSize={ 200 * 1024 * 1024 }
          multiple={ false }
        >
          <Group justify="center" gap="xl" mih={ 200 } style={ { pointerEvents: 'none' } }>
            <Stack gap={ 4 } align="center">
              <Text size="lg" fw={ 500 }>Drop CSV here</Text>
              <Text size="xs" c="dimmed">or click to browse — up to 200 MB</Text>
            </Stack>
          </Group>
        </Dropzone>
      </Stack>
    </Modal>
  );
}

export default ImportDropzone;
