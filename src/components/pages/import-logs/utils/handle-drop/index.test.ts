import type { FileWithPath } from '@mantine/dropzone';

import { handleDrop } from '.';

/**
 * Build a minimal FileWithPath-shaped object for tests. The Mantine type is
 * a structural extension of File; only the .name field is read by handleDrop,
 * but we keep enough of the shape that consumers can be exercised against it.
 */
const makeDroppedFile = (name: string): FileWithPath => {
  const file = new File(['speed,rpm\n0,820'], name, { type: 'text/csv' });
  return Object.assign(file, { path: name }) as FileWithPath;
};

describe('pages/import-logs/utils/handle-drop', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('logs an empty filename list when the dropzone resolves with no files', () => {
    handleDrop([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Dropped CSV files (parser wiring deferred):',
      []
    );
  });

  it('logs the names of every dropped file in order', () => {
    const droppedFiles = [
      makeDroppedFile('trackLog-20260510-093412.csv'),
      makeDroppedFile('trackLog-20260509-074218.csv')
    ];
    handleDrop(droppedFiles);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Dropped CSV files (parser wiring deferred):',
      ['trackLog-20260510-093412.csv', 'trackLog-20260509-074218.csv']
    );
  });

  it('does not throw on a single-file drop', () => {
    expect(() => handleDrop([makeDroppedFile('one.csv')])).not.toThrow();
  });
});
