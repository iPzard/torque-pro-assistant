import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icons } from 'components/app/icons';
import { useAppDispatch, useAppSelector } from 'state/hooks';
import { selectUnits, setUnits } from 'state/preferences';
import { selectAllSessions } from 'state/sessions';
import { summarize } from 'utils';

import RecentlyDriven from './recently-driven';
import SessionsTable from './sessions-table';
import { filterAndSortSessions, type LibrarySort } from './utils';

/** Format a bytes value the way the design's `fmtFileSize` does — MB
 *  with two decimals at the page-header level. */
const formatTotalSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${ (bytes / 1024).toFixed(0) } KB`;
  return `${ (bytes / 1024 / 1024).toFixed(2) } MB`;
};

/**
 * Renders the Library page — the design's home view. Imported sessions
 * show up in a sortable table with peak metric columns + a speed
 * profile sparkline, beneath a toolbar (search, date range, vehicle,
 * sort, units, selection count). Below the table is the "Recently
 * driven" card strip — three top recents with their own sparklines
 * and metric tiles.
 *
 * Selection state lives here; clicking the leftmost checkbox in the
 * table toggles it. With two or more selected, a "Compare {N}" button
 * appears next to "Import CSV" and routes to `/compare?ids=...`.
 *
 * @returns The Library page React element.
 */
function Library() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const sessions = useAppSelector((state) => selectAllSessions(state.sessions));
  const units = useAppSelector((state) => selectUnits(state.preferences));

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<LibrarySort>({ key: 'startedAt', order: 'desc' });
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());

  /**
   * Memoize the (session, summary) rows so we don't re-walk every
   * session's row array per render. `sessions` is immutable in the
   * store; identity is a sound cache key.
   */
  const allRows = useMemo(
    () => sessions.map((session) => ({ session, summary: summarize(session) })),
    [sessions]
  );

  /** Filter + sort against the cached rows. */
  const visibleRows = useMemo(() => {
    const allMeta = allRows.map(({ session }) => session.meta);
    const filteredMeta = filterAndSortSessions(
      allMeta,
      { fromDate: null, query, toDate: null },
      sort
    );
    const byId = new Map(allRows.map((row) => [row.session.meta.id, row]));
    return filteredMeta
      .map((meta) => byId.get(meta.id))
      .filter((row): row is NonNullable<typeof row> => row !== undefined);
  }, [allRows, query, sort]);

  /** Recently-driven sort is independent — always newest first. */
  const recentRows = useMemo(
    () => [...allRows].sort((rowA, rowB) =>
      rowB.session.meta.startedAt.localeCompare(rowA.session.meta.startedAt)
    ),
    [allRows]
  );

  const totalSize = sessions.reduce((sum, session) => sum + session.meta.fileSize, 0);
  const hasSessions = sessions.length > 0;

  const handleSelectionToggle = (id: string): void => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleCompareClick = (): void => {
    if (selectedIds.size < 2) return;
    navigate(`/compare?ids=${ [...selectedIds].join(',') }`);
  };

  return (
    <div className="page" data-testid="library-page">
      <div className="page-h">
        <div>
          <h1 data-testid="library-page-title">Library</h1>
          <div className="sub" data-testid="library-page-description">
            { sessions.length } session{ sessions.length === 1 ? '' : 's' } · { formatTotalSize(totalSize) } on disk
          </div>
        </div>
        <div className="row">
          { selectedIds.size >= 2 && (
            <button
              className="btn"
              data-testid="library-compare-button"
              onClick={ handleCompareClick }
              type="button"
            >
              { Icons.compare }
              <span>Compare { selectedIds.size }</span>
            </button>
          ) }
          <button
            className="btn primary"
            data-testid="library-import-button"
            onClick={ () => navigate('/import') }
            type="button"
          >
            { Icons.plus }
            <span>Import CSV</span>
            <span
              className="kbd"
              style={ {
                background:   'rgba(0,0,0,.08)',
                borderColor:  'rgba(0,0,0,.15)',
                color:        '#1a1200',
                marginLeft:   6
              } }
            >
              { '⌘O' }
            </span>
          </button>
        </div>
      </div>

      { !hasSessions && (
        <div className="empty" data-testid="library-empty-state">
          <div style={ { background: 'var(--accent-soft)', borderRadius: 14, color: 'var(--accent)', display: 'inline-flex', padding: 14 } }>
            { Icons.upload }
          </div>
          <h3>No sessions yet</h3>
          <p>
            Drop a Torque Pro CSV here to get started, or pick one from your computer.
            <br />
            We parse on-device — your logs never leave the machine.
          </p>
          <div style={ { display: 'inline-flex', gap: 8, marginTop: 18 } }>
            <button
              className="btn primary"
              data-testid="library-empty-import-button"
              onClick={ () => navigate('/import') }
              type="button"
            >
              { Icons.plus }
              <span>Import CSV</span>
            </button>
          </div>
        </div>
      ) }

      { hasSessions && (
        <>
          <div className="toolbar" data-testid="library-toolbar">
            <input
              className="input search"
              data-testid="library-toolbar-search"
              onChange={ (event) => setQuery(event.currentTarget.value) }
              placeholder="Search sessions…"
              style={ { width: 260 } }
              value={ query }
            />
            <div className="sep" />
            <button className="btn ghost sm" type="button">
              { Icons.filter }
              <span>Date range</span>
              <span className="dim">All time</span>
              { Icons.chevDown }
            </button>
            <button className="btn ghost sm" type="button">
              { Icons.vehicle }
              <span>Vehicle</span>
              <span className="dim">All</span>
              { Icons.chevDown }
            </button>
            <div className="sep" />
            <span className="muted" style={ { fontSize: 11 } }>Sort by</span>
            <select
              className="select"
              data-testid="library-toolbar-sort"
              onChange={ (event) => {
                const value = event.currentTarget.value;
                if (value === 'date') setSort({ key: 'startedAt', order: 'desc' });
                else if (value === 'duration') setSort({ key: 'duration', order: 'desc' });
                else if (value === 'size') setSort({ key: 'fileSize', order: 'desc' });
                else setSort({ key: 'name', order: 'asc' });
              } }
              value={
                sort.key === 'startedAt' ? 'date'
                  : sort.key === 'duration' ? 'duration'
                    : sort.key === 'fileSize' ? 'size'
                      : 'name'
              }
            >
              <option value="date">Date · newest</option>
              <option value="duration">Duration</option>
              <option value="size">Size</option>
              <option value="name">Name</option>
            </select>
            <select
              className="select"
              data-testid="library-toolbar-units"
              onChange={ (event) => dispatch(setUnits(event.currentTarget.value as 'imperial' | 'metric')) }
              value={ units }
            >
              <option value="imperial">Imperial</option>
              <option value="metric">Metric</option>
            </select>
            <div className="right" />
            <span className="pill ok" data-testid="library-toolbar-selection">
              <i className="dot" />
              { selectedIds.size } selected
            </span>
          </div>

          <div className="card" style={ { padding: 0 } }>
            <SessionsTable
              onSelectionToggle={ handleSelectionToggle }
              onSortChange={ setSort }
              rows={ visibleRows }
              selectedIds={ selectedIds }
              sort={ sort }
              testId="library-sessions-table"
              units={ units }
            />
          </div>

          <RecentlyDriven rows={ recentRows } testId="library-recent" units={ units } />
        </>
      ) }
    </div>
  );
}

export default Library;
