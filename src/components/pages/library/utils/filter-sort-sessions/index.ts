import type { SessionMeta } from 'types/session';

/** Columns the Library table can sort by. */
export type LibrarySortKey = 'duration' | 'fileSize' | 'name' | 'startedAt';

/** Sort direction — `asc` ascending, `desc` descending. */
export type LibrarySortOrder = 'asc' | 'desc';

/** Sort spec — column + direction. */
export interface LibrarySort {
  readonly key: LibrarySortKey;
  readonly order: LibrarySortOrder;
}

/** Filter spec — search query + optional date range. Empty values
 *  mean "no filter on that axis." */
export interface LibraryFilters {
  /** Inclusive lower bound on `startedAt`. `null` disables the
   *  lower-bound check. */
  readonly fromDate: Date | null;
  /** Case-insensitive substring matched against `meta.name`. Empty
   *  string disables the search. */
  readonly query: string;
  /** Inclusive upper bound on `startedAt`. `null` disables the
   *  upper-bound check. */
  readonly toDate: Date | null;
}

/**
 * Apply the Library toolbar's search + date filters and then sort
 * the result by the chosen column. Pure / immutable — returns a new
 * array without touching the input.
 *
 * Sort behavior:
 *   - `name`      — case-insensitive locale comparison.
 *   - `startedAt` — ISO string lexicographic compare (works because
 *                   ISO 8601 sorts as text).
 *   - `duration`  — numeric.
 *   - `fileSize`  — numeric.
 *
 * @param sessions Source list (e.g. `selectAllSessionMeta`).
 * @param filters  Active filter state.
 * @param sort     Active sort state.
 * @returns A new filtered + sorted array.
 */
export const filterAndSortSessions = (
  sessions: readonly SessionMeta[],
  filters: LibraryFilters,
  sort: LibrarySort
): readonly SessionMeta[] => {
  const query = filters.query.trim().toLowerCase();
  const filtered = sessions.filter((meta) => {
    if (query !== '' && !meta.name.toLowerCase().includes(query)) {
      return false;
    }
    if (filters.fromDate !== null) {
      const startedAt = Date.parse(meta.startedAt);
      if (Number.isFinite(startedAt) && startedAt < filters.fromDate.getTime()) {
        return false;
      }
    }
    if (filters.toDate !== null) {
      const startedAt = Date.parse(meta.startedAt);
      /** Push the upper bound to the end of the selected day so a
       *  range like `Jan 1 — Jan 1` still includes sessions logged
       *  on that day. */
      const endOfDay = filters.toDate.getTime() + 24 * 60 * 60 * 1000 - 1;
      if (Number.isFinite(startedAt) && startedAt > endOfDay) {
        return false;
      }
    }
    return true;
  });

  const sorted = [...filtered].sort((sessionA, sessionB) => {
    let comparison = 0;
    if (sort.key === 'name') {
      comparison = sessionA.name.localeCompare(sessionB.name, undefined, { sensitivity: 'base' });
    } else if (sort.key === 'startedAt') {
      comparison = sessionA.startedAt.localeCompare(sessionB.startedAt);
    } else if (sort.key === 'duration') {
      comparison = sessionA.duration - sessionB.duration;
    } else {
      comparison = sessionA.fileSize - sessionB.fileSize;
    }
    return sort.order === 'asc' ? comparison : -comparison;
  });

  return sorted;
};
