import { MantineProvider } from '@mantine/core';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import type { ParsedFile } from 'components/pages/import-logs/utils';
import preferencesReducer, { INITIAL_PREFERENCES } from 'state/preferences';

import PreviewStage from '.';

const makeParsedFile = (): ParsedFile => ({
  defaultName: 'drive',
  fileName:    'drive.csv',
  fileSize:    1024,
  parsed: {
    detectedColumns: [
      { header: 'Speed (OBD)(mph)', mappedTo: 'speed_mph' },
      { header: 'Engine RPM(rpm)',  mappedTo: 'rpm' }
    ],
    rows: [
      { rpm: 1500, speed_mph: 30, t: 0, ts: 1_730_127_051_000 },
      { lat: 45.6, lon: -122.4, rpm: 4500, speed_mph: 80, t: 5, ts: 1_730_127_056_000 }
    ]
  }
});

const makeStore = () => configureStore({
  preloadedState: { preferences: INITIAL_PREFERENCES },
  reducer:        { preferences: preferencesReducer }
});

function renderPreview(overrides: Partial<Parameters<typeof PreviewStage>[0]> = {}) {
  const onCancel = jest.fn();
  const onSaved = jest.fn();
  render(
    <Provider store={ makeStore() }>
      <MantineProvider>
        <PreviewStage
          onCancel={ onCancel }
          onSaved={ onSaved }
          parsedFile={ makeParsedFile() }
          testId="preview"
          { ...overrides }
        />
      </MantineProvider>
    </Provider>
  );
  return { onCancel, onSaved };
}

describe('pages/import-logs/preview-stage', () => {
  it('renders the stage wrapper', () => {
    renderPreview();
    expect(screen.getByTestId('preview')).toBeInTheDocument();
  });

  it('renders the validation panel', () => {
    renderPreview();
    expect(screen.getByTestId('preview-validation')).toBeInTheDocument();
  });

  it('renders the detected columns panel', () => {
    renderPreview();
    expect(screen.getByTestId('preview-columns')).toBeInTheDocument();
  });

  it('renders the preview table', () => {
    renderPreview();
    expect(screen.getByTestId('preview-preview')).toBeInTheDocument();
  });

  it('renders the details form pre-filled with the default name', () => {
    renderPreview();
    expect(screen.getByTestId('preview-details-name')).toHaveValue('drive');
  });

  it('clicking Cancel fires onCancel', async () => {
    const { onCancel } = renderPreview();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('preview-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('clicking Save fires onSaved with the built session', async () => {
    const { onSaved } = renderPreview();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('preview-save'));
    expect(onSaved).toHaveBeenCalledTimes(1);
    const session = onSaved.mock.calls[0][0];
    expect(session.meta.name).toBe('drive');
    expect(session.meta.fileName).toBe('drive.csv');
    expect(session.data.length).toBe(2);
  });
});
