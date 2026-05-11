import type { ParsedCsv } from 'utils';

import type { Session, SessionDataRow, Vehicle } from 'types/session';

/** Input to {@link buildSession}. The details form on the Import
 *  preview stage collects everything not on `ParsedCsv` itself. */
export interface BuildSessionInput {
  readonly fileName: string;
  readonly fileSize: number;
  readonly name: string;
  readonly notes: string;
  readonly parsed: ParsedCsv;
  readonly vehicle: Vehicle;
}

/**
 * Assemble a complete `Session` from a `ParsedCsv` + the metadata
 * collected on the Import preview stage's details form. Mirrors the
 * derivations the minimum-viable `ingestCsv` did internally, with the
 * vehicle / notes / name pulled from the form instead of being empty
 * placeholders.
 *
 * Derived `SessionMeta` fields:
 *   - `id`        `s_<epochMs>_<filename>` — stable, sortable, dedups
 *                 on identical-filename re-imports.
 *   - `startedAt` ISO timestamp of the first row's `ts`.
 *   - `duration`  seconds between the first and last row's `ts`.
 *   - `gpsStart`  first row with both `lat` + `lon`; `{0,0}` fallback.
 *
 * @param input Form fields + parsed CSV + file metadata.
 * @returns A fully-formed Session ready for `addSession`.
 */
export const buildSession = ({
  fileName,
  fileSize,
  name,
  notes,
  parsed,
  vehicle
}: BuildSessionInput): Session => {
  const rows = parsed.rows;
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

  return {
    data: rows,
    meta: {
      duration: durationSeconds,
      fileName,
      fileSize,
      gpsStart,
      id:        `s_${ Date.now() }_${ fileName }`,
      name,
      notes,
      startedAt,
      vehicle
    }
  };
};
