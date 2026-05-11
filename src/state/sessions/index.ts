import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from 'immer';

import type { Session, SessionMeta } from 'types/session';

/**
 * Sessions slice — the canonical list of imported Torque Pro sessions
 * plus the currently-selected session id. The Library table reads every
 * session's meta; the Session-detail screen reads one session's full
 * row data via `selectedId`.
 *
 * Sessions are immutable after import; the slice's "update" path is to
 * add a session whose id matches an existing one (`addSession` upserts).
 *
 * Persistence is wired in `state/store/` via `loadPersistedSessions` and
 * `persistSessions` — the slice itself stays pure.
 */

/**
 * Sessions slice state. `selectedId` follows the URL / route; clearing
 * it returns to the Library landing view.
 */
export interface SessionsState {
  readonly selectedId: string | null;
  readonly sessions: readonly Session[];
}

const initialState: SessionsState = {
  selectedId: null,
  sessions: []
};

const sessionsSlice = createSlice({
  initialState,
  name: 'sessions',
  reducers: {
    /**
     * Adds a session, or replaces an existing entry with matching
     * `meta.id`. Upsert semantics let re-importing the same CSV refresh
     * the data without leaving a stale copy.
     */
    addSession: (state, action: PayloadAction<Session>) => {
      /**
       * `Session.data` is `readonly`, which Immer's `Draft<T>` widens
       * to a mutable array type. We never mutate the inner row data —
       * sessions are immutable after import — but the type variance
       * still needs a one-step cast through `unknown` to land in the
       * Draft's expected shape. Safe in practice.
       */
      const incoming = action.payload as unknown as Draft<Session>;
      const existingIndex = state.sessions.findIndex(
        (existing) => existing.meta.id === incoming.meta.id
      );
      if (existingIndex === -1) {
        state.sessions.push(incoming);
      } else {
        state.sessions[existingIndex] = incoming;
      }
    },
    /** Drops the current selection without removing any sessions. */
    clearSelection: (state) => {
      state.selectedId = null;
    },
    /**
     * Removes the session with the given id. If the removed session
     * was selected, the selection is also cleared.
     */
    removeSession: (state, action: PayloadAction<string>) => {
      const targetId = action.payload;
      state.sessions = state.sessions.filter(
        (existing) => existing.meta.id !== targetId
      );
      if (state.selectedId === targetId) {
        state.selectedId = null;
      }
    },
    /** Renames the session with the given id. No-op when the id
     *  isn't in the list. */
    renameSession: (
      state,
      action: PayloadAction<{ readonly id: string; readonly name: string }>
    ) => {
      const { id, name } = action.payload;
      const target = state.sessions.find((existing) => existing.meta.id === id);
      if (target !== undefined) {
        target.meta.name = name;
      }
    },
    /** Sets the current selection. No-op if the id isn't in the list. */
    selectSession: (state, action: PayloadAction<string>) => {
      const targetId = action.payload;
      const exists = state.sessions.some(
        (existing) => existing.meta.id === targetId
      );
      if (exists) state.selectedId = targetId;
    }
  }
});

export const {
  addSession,
  clearSelection,
  removeSession,
  renameSession,
  selectSession
} = sessionsSlice.actions;

/** Returns every session in insertion order. */
export const selectAllSessions = (state: SessionsState): readonly Session[] =>
  state.sessions;

/**
 * Returns every session's meta, in insertion order. Use this for the
 * Library table — it avoids hydrating the row data for sessions that
 * are only being browsed.
 */
export const selectAllSessionMeta = (state: SessionsState): readonly SessionMeta[] =>
  state.sessions.map((session) => session.meta);

/** Returns the session with the given id, or `undefined`. */
export const selectSessionById = (
  state: SessionsState,
  id: string
): Session | undefined =>
  state.sessions.find((session) => session.meta.id === id);

/** Returns the currently-selected session, or `undefined`. */
export const selectSelectedSession = (state: SessionsState): Session | undefined => {
  if (state.selectedId === null) return undefined;
  return state.sessions.find((session) => session.meta.id === state.selectedId);
};

export default sessionsSlice.reducer;
