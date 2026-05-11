import type { Session, SessionDataRow } from 'types/session';
import { parseCsv } from 'utils';

/**
 * Read a dropped `File`, parse it through the CSV adapter, and assemble
 * a `Session` (meta + data) ready to dispatch into the sessions slice.
 *
 * Minimum-viable wiring for now — vehicle / notes stay empty placeholders;
 * the full Import flow (CLAUDE.md TODO §D) adds the parsing / preview /
 * validation stages + session-details form. This util is what that flow
 * will eventually consume internally; for the demo path the ImportPage
 * dispatches its output directly.
 *
 * Derived `SessionMeta` fields:
 *   - `id`         `s_<epochMs>_<filename>` — stable, sortable, dedups on
 *                  identical-filename re-imports.
 *   - `fileName`   raw file name.
 *   - `fileSize`   raw byte count.
 *   - `name`       file name without trailing `.csv`.
 *   - `startedAt`  ISO timestamp of the first row's `ts`.
 *   - `duration`   seconds between the first and last row's `ts`.
 *   - `gpsStart`   first row with both `lat` and `lon` defined; `{0,0}`
 *                  if the file contains no GPS samples.
 *   - `vehicle`    empty placeholder — vehicle picker lands in Phase D.
 *   - `notes`      empty.
 *
 * @param file Dropped CSV file (from the Mantine Dropzone or any
 *   `File` source).
 * @returns A fully-formed `Session` ready for `addSession`.
 * @throws When the parsed CSV has no rows.
 */
export const ingestCsv = async (file: File): Promise<Session> => {
  const text = await file.text();
  const { rows } = parseCsv(text);
  if (rows.length === 0) {
    throw new Error('CSV contains no data rows');
  }

  const firstRow = rows[0];
  const lastRow = rows[rows.length - 1];
  const durationSeconds = Math.max(0, (lastRow.ts - firstRow.ts) / 1000);
  const startedAt = new Date(firstRow.ts).toISOString();

  const firstGpsRow: SessionDataRow | undefined = rows.find(
    (row) => row.lat !== undefined && row.lon !== undefined
  );
  const gpsStart = firstGpsRow !== undefined
    ? { lat: firstGpsRow.lat ?? 0, lon: firstGpsRow.lon ?? 0 }
    : { lat: 0, lon: 0 };

  const baseName = file.name.replace(/\.csv$/i, '');

  return {
    data: rows,
    meta: {
      duration: durationSeconds,
      fileName: file.name,
      fileSize: file.size,
      gpsStart,
      id: `s_${Date.now()}_${file.name}`,
      name: baseName,
      notes: '',
      startedAt,
      vehicle: { make: '', model: '', vin: '', year: 0 }
    }
  };
};
