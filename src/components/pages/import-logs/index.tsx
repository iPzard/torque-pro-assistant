import { Stack, Text, Title } from '@mantine/core';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Alert from 'components/primitives/alert';
import { useAppDispatch } from 'state/hooks';
import { addSession } from 'state/sessions';
import type { Session } from 'types/session';

import DropStage from './drop-stage';
import PreviewStage from './preview-stage';
import { type ParsedFile, parseFile } from './utils';

/**
 * Renders the Import Logs page — the design's three-stage Drop →
 * Parse → Preview flow.
 *
 * State machine (held in local state, not Redux):
 *   - `parsedFile === null && error === null && !busy` — drop stage.
 *   - `busy` — parse in flight; drop stage shows the loading shell.
 *   - `parsedFile !== null` — preview stage.
 *   - `error !== null` — Alert above the drop stage; user can retry.
 *
 * Save lifts the form-derived `Session` up here so the page can
 * dispatch `addSession` + navigate to `/library` without each stage
 * sub-component knowing about Redux / routing.
 *
 * @returns The Import Logs page React element.
 */
/** Captured parse failure — keeps the original file reference so the
 *  user can hit "Try again" without re-picking it. */
interface ImportError {
  readonly file: File;
  readonly message: string;
}

function ImportLogs() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ImportError | null>(null);

  const handleDrop = async (file: File): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const result = await parseFile(file);
      setParsedFile(result);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Failed to parse CSV.';
      setError({ file, message });
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = (): void => {
    setParsedFile(null);
    setError(null);
  };

  const handleSaved = (session: Session): void => {
    dispatch(addSession(session));
    setParsedFile(null);
    setError(null);
    navigate('/library');
  };

  return (
    <Stack data-testid="import-logs-page" gap="md">
      <Stack gap={ 4 }>
        <Title data-testid="import-logs-page-title" order={ 2 }>Import session</Title>
        <Text c="dimmed" data-testid="import-logs-page-description" size="sm">
          Drop a Torque Pro CSV export, or pick one from disk. Parsing
          happens on-device — your logs never leave the machine.
        </Text>
      </Stack>

      { error !== null && (
        <Alert
          actions={
            <>
              <button
                className="btn primary sm"
                data-testid="import-logs-error-retry"
                onClick={ () => { void handleDrop(error.file); } }
                type="button"
              >
                Try again
              </button>
              <button
                className="btn ghost sm"
                data-testid="import-logs-error-dismiss"
                onClick={ () => setError(null) }
                type="button"
              >
                Cancel
              </button>
            </>
          }
          detail={ error.message }
          subtitle={
            <>
              <span className="mono" style={ { color: 'var(--text-0)' } }>{ error.file.name }</span>
              { ' ' }couldn&apos;t be parsed. This usually means the export was interrupted, or the file was concatenated.
            </>
          }
          testId="import-logs-error"
          title={ <>Couldn&apos;t parse this CSV<span className="pill err" style={ { marginLeft: 4 } }><i className="dot" />parse failed</span></> }
          variant="danger"
        />
      ) }

      { parsedFile === null
        ? (
          <DropStage
            busy={ busy }
            onDrop={ (file) => { void handleDrop(file); } }
            testId="import-logs-dropzone"
          />
        )
        : (
          <PreviewStage
            onCancel={ handleCancel }
            onSaved={ handleSaved }
            parsedFile={ parsedFile }
            testId="import-logs-preview"
          />
        ) }
    </Stack>
  );
}

export default ImportLogs;
