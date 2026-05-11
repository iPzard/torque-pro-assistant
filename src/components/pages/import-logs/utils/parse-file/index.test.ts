import { parseFile } from '.';

function makeCsvFile(name: string, body: string, mime = 'text/csv'): File {
  const file = new File([body], name, { type: mime });
  // jsdom 16 doesn't implement Blob.prototype.text(); shim per-instance.
  Object.defineProperty(file, 'text', {
    value: () => Promise.resolve(body)
  });
  return file;
}

const minimalCsv = [
  'GPS Time,Device Time,Latitude,Longitude,Speed (OBD)(mph),Engine RPM(rpm)',
  '-,28-Oct-2024 13:50:51,-,-,0,820',
  '-,28-Oct-2024 13:50:52,-,-,5,1200'
].join('\n');

describe('pages/import-logs/utils/parse-file', () => {
  it('parses a CSV file into rows', async () => {
    const file = makeCsvFile('drive.csv', minimalCsv);
    const result = await parseFile(file);
    expect(result.parsed.rows.length).toBe(2);
  });

  it('captures the source file name and size', async () => {
    const file = makeCsvFile('trackLog.csv', minimalCsv);
    const result = await parseFile(file);
    expect(result.fileName).toBe('trackLog.csv');
    expect(result.fileSize).toBe(file.size);
  });

  it('derives a default session name by stripping the .csv extension', async () => {
    const file = makeCsvFile('trackLog-2024-10-28.csv', minimalCsv);
    const result = await parseFile(file);
    expect(result.defaultName).toBe('trackLog-2024-10-28');
  });

  it('throws when the CSV has no data rows', async () => {
    const file = makeCsvFile('drive.csv', 'GPS Time,Speed (OBD)(mph)\n');
    await expect(parseFile(file)).rejects.toThrow(/no data rows/i);
  });
});
