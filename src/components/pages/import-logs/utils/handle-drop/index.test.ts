import type { FileWithPath } from '@mantine/dropzone';

import { addSession } from 'state/sessions';

import { handleDrop } from '.';

/**
 * Minimal valid CSV body for tests that need `ingestCsv` to succeed.
 * Mirrors the ingest-csv suite's `minimalCsv` — three rows, two with
 * just RPM, one with full GPS + speed — so the parser hits enough
 * branches to produce a usable Session.
 */
const validCsvBody = [
  'GPS Time,Device Time,Latitude,Longitude,Speed (OBD)(mph),Engine RPM(rpm)',
  '-,28-Oct-2024 13:50:51,-,-,0,820',
  '-,28-Oct-2024 13:50:52,-,-,5,1200',
  'Mon Oct 28 13:51:00 PDT 2024,28-Oct-2024 13:51:00,45.60,-122.38,18,2400'
].join('\n');

/**
 * Build a minimal FileWithPath-shaped object for tests. The Mantine type
 * is a structural extension of File; `handleDrop` reads `.name`, `.text()`,
 * and `.size`, all of which `File` already provides.
 */
const makeDroppedFile = (
  name: string,
  body: string = validCsvBody
): FileWithPath => {
  const file = new File([body], name, { type: 'text/csv' });
  // jsdom 16 doesn't implement Blob.prototype.text(); shim per-instance so
  // the `ingestCsv` call inside `handleDrop` can read the body back out.
  Object.defineProperty(file, 'text', {
    value: () => Promise.resolve(body)
  });
  return Object.assign(file, { path: name }) as FileWithPath;
};

describe('pages/import-logs/utils/handle-drop', () => {
  let dispatch: jest.Mock;
  let navigate: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    dispatch = jest.fn();
    navigate = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('is a no-op when no files are dropped', async () => {
    await handleDrop([], { dispatch, navigate });
    expect(dispatch).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('dispatches an addSession action with the parsed Session', async () => {
    await handleDrop([makeDroppedFile('drive.csv')], { dispatch, navigate });
    expect(dispatch).toHaveBeenCalledTimes(1);
    const dispatched = dispatch.mock.calls[0][0];
    expect(dispatched.type).toBe(addSession.type);
    expect(dispatched.payload.meta.fileName).toBe('drive.csv');
    expect(dispatched.payload.meta.name).toBe('drive');
    expect(dispatched.payload.data.length).toBe(3);
  });

  it('navigates to /library after a successful import', async () => {
    await handleDrop([makeDroppedFile('drive.csv')], { dispatch, navigate });
    expect(navigate).toHaveBeenCalledWith('/library');
  });

  it('processes only the first file when multiple are dropped', async () => {
    await handleDrop(
      [makeDroppedFile('first.csv'), makeDroppedFile('second.csv')],
      { dispatch, navigate }
    );
    expect(dispatch).toHaveBeenCalledTimes(1);
    const dispatched = dispatch.mock.calls[0][0];
    expect(dispatched.payload.meta.fileName).toBe('first.csv');
  });

  it('catches and logs ingest errors without rethrowing', async () => {
    const emptyCsv = 'GPS Time,Speed (OBD)(mph)\n';
    await expect(
      handleDrop([makeDroppedFile('empty.csv', emptyCsv)], { dispatch, navigate })
    ).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
