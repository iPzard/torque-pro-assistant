import { ingestCsv } from '.';

function makeCsvFile(name: string, body: string, mime = 'text/csv'): File {
  const file = new File([body], name, { type: mime });
  // jsdom 16 doesn't implement Blob.prototype.text(); shim per-instance so
  // `ingestCsv` (which awaits `file.text()`) can read the body back out.
  Object.defineProperty(file, 'text', {
    value: () => Promise.resolve(body)
  });
  return file;
}

const minimalCsv = [
  'GPS Time,Device Time,Latitude,Longitude,Speed (OBD)(mph),Engine RPM(rpm)',
  '-,28-Oct-2024 13:50:51,-,-,0,820',
  '-,28-Oct-2024 13:50:52,-,-,5,1200',
  'Mon Oct 28 13:51:00 PDT 2024,28-Oct-2024 13:51:00,45.60,-122.38,18,2400'
].join('\n');

describe('pages/import-logs/utils/ingest-csv', () => {
  it('parses a CSV file into a Session with the data rows', async () => {
    const file = makeCsvFile('trackLog-2024-Oct-28_13-29-32.csv', minimalCsv);
    const session = await ingestCsv(file);
    expect(session.data.length).toBe(3);
    expect(session.data[0].rpm).toBe(820);
  });

  it('derives a stable session id prefixed with `s_` and including the file name', async () => {
    const file = makeCsvFile('trackLog-foo.csv', minimalCsv);
    const session = await ingestCsv(file);
    expect(session.meta.id).toMatch(/^s_\d+_trackLog-foo\.csv$/);
  });

  it('strips the .csv extension from the name', async () => {
    const file = makeCsvFile('trackLog-2024-Oct-28_13-29-32.csv', minimalCsv);
    const session = await ingestCsv(file);
    expect(session.meta.name).toBe('trackLog-2024-Oct-28_13-29-32');
  });

  it('captures the original fileName and fileSize', async () => {
    const file = makeCsvFile('drive.csv', minimalCsv);
    const session = await ingestCsv(file);
    expect(session.meta.fileName).toBe('drive.csv');
    expect(session.meta.fileSize).toBe(file.size);
  });

  it('derives startedAt from the first row\'s timestamp', async () => {
    const file = makeCsvFile('drive.csv', minimalCsv);
    const session = await ingestCsv(file);
    expect(session.meta.startedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // First row is 13:50:51 UTC offset; ISO will be UTC.
    expect(session.meta.startedAt).toContain('2024-10-28T');
  });

  it('derives duration from the gap between first and last row', async () => {
    const file = makeCsvFile('drive.csv', minimalCsv);
    const session = await ingestCsv(file);
    // Rows at 13:50:51, 13:50:52, 13:51:00 → 9 seconds end-to-end.
    expect(session.meta.duration).toBe(9);
  });

  it('takes gpsStart from the first row that carries both lat + lon', async () => {
    const file = makeCsvFile('drive.csv', minimalCsv);
    const session = await ingestCsv(file);
    expect(session.meta.gpsStart.lat).toBeCloseTo(45.60);
    expect(session.meta.gpsStart.lon).toBeCloseTo(-122.38);
  });

  it('falls back to lat/lon = 0/0 when the file contains no GPS samples', async () => {
    const noGpsCsv = [
      'Device Time,Engine RPM(rpm)',
      '28-Oct-2024 13:50:51,820',
      '28-Oct-2024 13:50:52,1200'
    ].join('\n');
    const file = makeCsvFile('drive.csv', noGpsCsv);
    const session = await ingestCsv(file);
    expect(session.meta.gpsStart).toEqual({ lat: 0, lon: 0 });
  });

  it('leaves vehicle as an empty placeholder', async () => {
    const file = makeCsvFile('drive.csv', minimalCsv);
    const session = await ingestCsv(file);
    expect(session.meta.vehicle).toEqual({ make: '', model: '', vin: '', year: 0 });
    expect(session.meta.notes).toBe('');
  });

  it('throws on an empty CSV', async () => {
    const file = makeCsvFile('drive.csv', 'GPS Time,Speed (OBD)(mph)\n');
    await expect(ingestCsv(file)).rejects.toThrow(/no data rows/i);
  });
});
