import type { FileWithPath } from '@mantine/dropzone';

/**
 * Drop handler for the Import page's Mantine `Dropzone`. Logs the names of
 * each file the user drops so the integration is visibly working until the
 * Papa Parse pipeline lands.
 *
 * Replace with the real ingest dispatcher when the sessions slice + CSV
 * parser arrive in CLAUDE.md TODO §A / §D.
 *
 * @param droppedFiles - Files accepted by the Dropzone. The list is filtered
 *   by the Dropzone's `accept` prop before this handler runs.
 */
export const handleDrop = (droppedFiles: FileWithPath[]): void => {
  const fileNames = droppedFiles.map((file) => file.name);
  console.log('Dropped CSV files (parser wiring deferred):', fileNames);
};
