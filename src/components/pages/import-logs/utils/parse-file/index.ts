import type { ParsedCsv } from 'utils';

import { parseCsv } from 'utils';

/** Output of {@link parseFile}. */
export interface ParsedFile {
  /** Default session name — file name with `.csv` stripped. The
   *  details form pre-fills this value but lets the user edit. */
  readonly defaultName: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly parsed: ParsedCsv;
}

/**
 * Read a dropped File, run it through Papa Parse via `parseCsv`, and
 * package the result alongside the file metadata the preview / save
 * stages need downstream.
 *
 * Throws when the parsed CSV has zero data rows so the composer can
 * surface a clear error message; the empty-file case is the only
 * thing the parser itself doesn't recover from gracefully.
 *
 * @param file Dropped CSV file from the Mantine Dropzone.
 * @returns Parsed CSV + the original file name / size + a default
 *   session name.
 * @throws When the parsed CSV has no rows.
 */
export const parseFile = async (file: File): Promise<ParsedFile> => {
  const text = await file.text();
  const parsed = parseCsv(text);
  if (parsed.rows.length === 0) {
    throw new Error('CSV contains no data rows');
  }
  return {
    defaultName: file.name.replace(/\.csv$/i, ''),
    fileName:    file.name,
    fileSize:    file.size,
    parsed
  };
};
