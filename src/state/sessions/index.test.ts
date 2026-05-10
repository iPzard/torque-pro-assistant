import type { Session, SessionMeta } from 'types/session';

import sessionsReducer, {
  addSession,
  clearSelection,
  removeSession,
  selectAllSessionMeta,
  selectAllSessions,
  selectSelectedSession,
  selectSession,
  selectSessionById,
  type SessionsState
} from '.';

/**
 * Slice tests exercise the reducer + selectors directly (no store
 * wrapper) — they don't need React, persistence, or any other surface
 * the production wiring sits behind. Builds minimal Session objects so
 * the test reads as "what action does what" rather than session
 * bookkeeping.
 */

function buildSession(id: string, name: string = id): Session {
  const meta: SessionMeta = {
    duration: 60,
    fileName: `${id}.csv`,
    fileSize: 0,
    gpsStart: { lat: 0, lon: 0 },
    id,
    name,
    notes: '',
    startedAt: '2026-01-01T00:00:00Z',
    vehicle: { make: 'Test', model: 'Test', vin: '', year: 2020 }
  };
  return { data: [], meta };
}

describe('state/sessions', () => {
  describe('reducer', () => {
    it('starts with empty sessions and no selection', () => {
      const state = sessionsReducer(undefined, { type: '@@INIT' });
      expect(state).toEqual({ selectedId: null, sessions: [] });
    });

    it('addSession appends a new session', () => {
      const startState: SessionsState = { selectedId: null, sessions: [] };
      const next = sessionsReducer(startState, addSession(buildSession('a')));
      expect(next.sessions).toHaveLength(1);
      expect(next.sessions[0].meta.id).toBe('a');
    });

    it('addSession upserts when the id already exists', () => {
      const startState: SessionsState = {
        selectedId: null,
        sessions: [buildSession('a', 'Original')]
      };
      const next = sessionsReducer(startState, addSession(buildSession('a', 'Renamed')));
      expect(next.sessions).toHaveLength(1);
      expect(next.sessions[0].meta.name).toBe('Renamed');
    });

    it('removeSession deletes by id and leaves siblings alone', () => {
      const startState: SessionsState = {
        selectedId: null,
        sessions: [buildSession('a'), buildSession('b'), buildSession('c')]
      };
      const next = sessionsReducer(startState, removeSession('b'));
      expect(next.sessions.map((session) => session.meta.id)).toEqual(['a', 'c']);
    });

    it('removeSession clears selection when the removed session was selected', () => {
      const startState: SessionsState = {
        selectedId: 'a',
        sessions: [buildSession('a'), buildSession('b')]
      };
      const next = sessionsReducer(startState, removeSession('a'));
      expect(next.selectedId).toBeNull();
    });

    it('removeSession preserves selection for a different id', () => {
      const startState: SessionsState = {
        selectedId: 'a',
        sessions: [buildSession('a'), buildSession('b')]
      };
      const next = sessionsReducer(startState, removeSession('b'));
      expect(next.selectedId).toBe('a');
    });

    it('selectSession sets selectedId when the id exists', () => {
      const startState: SessionsState = {
        selectedId: null,
        sessions: [buildSession('a')]
      };
      const next = sessionsReducer(startState, selectSession('a'));
      expect(next.selectedId).toBe('a');
    });

    it('selectSession is a no-op when the id is not in the list', () => {
      const startState: SessionsState = {
        selectedId: null,
        sessions: [buildSession('a')]
      };
      const next = sessionsReducer(startState, selectSession('z'));
      expect(next.selectedId).toBeNull();
    });

    it('clearSelection clears selectedId without dropping any sessions', () => {
      const startState: SessionsState = {
        selectedId: 'a',
        sessions: [buildSession('a'), buildSession('b')]
      };
      const next = sessionsReducer(startState, clearSelection());
      expect(next.selectedId).toBeNull();
      expect(next.sessions).toHaveLength(2);
    });
  });

  describe('selectors', () => {
    const populated: SessionsState = {
      selectedId: 'b',
      sessions: [buildSession('a'), buildSession('b'), buildSession('c')]
    };

    it('selectAllSessions returns every session in order', () => {
      const result = selectAllSessions(populated);
      expect(result.map((session) => session.meta.id)).toEqual(['a', 'b', 'c']);
    });

    it('selectAllSessionMeta projects to meta only', () => {
      const result = selectAllSessionMeta(populated);
      expect(result.map((meta) => meta.id)).toEqual(['a', 'b', 'c']);
      // `data` should not be present on a SessionMeta.
      expect(Object.keys(result[0])).not.toContain('data');
    });

    it('selectSessionById returns the matching session or undefined', () => {
      expect(selectSessionById(populated, 'b')?.meta.id).toBe('b');
      expect(selectSessionById(populated, 'z')).toBeUndefined();
    });

    it('selectSelectedSession returns the session referenced by selectedId', () => {
      expect(selectSelectedSession(populated)?.meta.id).toBe('b');
    });

    it('selectSelectedSession returns undefined when nothing is selected', () => {
      const empty: SessionsState = { selectedId: null, sessions: populated.sessions };
      expect(selectSelectedSession(empty)).toBeUndefined();
    });
  });
});
