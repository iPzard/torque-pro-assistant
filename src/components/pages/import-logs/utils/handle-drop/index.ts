import type { FileWithPath } from '@mantine/dropzone';
import type { NavigateFunction } from 'react-router-dom';

import { ingestCsv } from 'components/pages/import-logs/utils/ingest-csv';
import { addSession } from 'state/sessions';
import type { AppDispatch } from 'state/store';

/**
 * External dependencies the Import page injects into `handleDrop`.
 * Threading these in (rather than importing the store / router hooks
 * inside the util) keeps the handler a pure function the test can
 * call with stubs — no MantineProvider / Router boilerplate needed
 * to exercise the dispatch / navigation paths.
 */
export interface HandleDropDeps {
  readonly dispatch: AppDispatch;
  readonly navigate: NavigateFunction;
}

/**
 * Drop handler for the Import page's Mantine `Dropzone`. Takes the first
 * dropped file (the Dropzone is configured `multiple={ false }`, so the
 * list always has 0 or 1 entries), parses it through `ingestCsv`, pushes
 * the resulting `Session` into the sessions slice, and routes the user
 * to the Library where the freshly-imported session shows up at the top.
 *
 * Errors from `ingestCsv` (empty CSV, unreadable file) are caught and
 * logged. The full Import flow (CLAUDE.md TODO §D) replaces this with
 * a parsing-progress / validation panel and surfaces failures inline
 * instead of silently swallowing them; for the minimum demo path the
 * console message is enough.
 *
 * @param droppedFiles File list from the Mantine Dropzone's `onDrop`.
 *   Empty (`[]`) when the drop is rejected by `accept` / `maxSize`.
 * @param deps Injected `dispatch` + `navigate`. See `HandleDropDeps`.
 * @returns A promise that resolves once the session is dispatched and
 *   the route change is queued. The Dropzone's `onDrop` is fire-and-
 *   forget — callers don't need to await this.
 */
export const handleDrop = async (
  droppedFiles: FileWithPath[],
  { dispatch, navigate }: HandleDropDeps
): Promise<void> => {
  if (droppedFiles.length === 0) return;
  try {
    const session = await ingestCsv(droppedFiles[0]);
    dispatch(addSession(session));
    navigate('/library');
  } catch (error) {
    console.error('Failed to ingest CSV:', error);
  }
};
