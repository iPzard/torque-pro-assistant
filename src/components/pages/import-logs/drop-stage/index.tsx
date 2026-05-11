import { Group, Stack, Text } from '@mantine/core';
import { Dropzone, type FileWithPath, MIME_TYPES } from '@mantine/dropzone';

interface DropStageProps {
  readonly busy: boolean;
  readonly onDrop: (file: File) => void;
  readonly testId?: string;
}

/**
 * Drop-target stage of the Import flow. Wraps the Mantine `Dropzone`
 * with the design's headline + hint. While `busy` is true (the parser
 * is running on a previously-dropped file) the zone disables itself
 * so a quick second drop can't race the in-flight parse.
 *
 * `onDrop` receives the first file from the dropzone — the dropzone
 * is configured `multiple={ false }`, so the list always has 0 or 1
 * entries.
 *
 * @returns The drop stage React element.
 */
function DropStage({ busy, onDrop, testId }: DropStageProps) {
  return (
    <Dropzone
      accept={ [MIME_TYPES.csv, 'application/vnd.ms-excel'] }
      data-testid={ testId }
      disabled={ busy }
      loading={ busy }
      maxSize={ 200 * 1024 * 1024 }
      multiple={ false }
      onDrop={ (files: FileWithPath[]) => {
        if (files.length > 0) onDrop(files[0]);
      } }
    >
      <Group gap="xl" justify="center" mih={ 280 } style={ { pointerEvents: 'none' } }>
        <Stack align="center" gap={ 4 }>
          <Text data-testid={ testId === undefined ? undefined : `${ testId }-headline` } fw={ 500 } size="lg">
            { busy ? 'Parsing…' : 'Drop CSV here' }
          </Text>
          <Text c="dimmed" data-testid={ testId === undefined ? undefined : `${ testId }-hint` } size="xs">
            { busy ? 'Reading rows and detecting columns.' : 'or click to browse — up to 200 MB' }
          </Text>
        </Stack>
      </Group>
    </Dropzone>
  );
}

export default DropStage;
