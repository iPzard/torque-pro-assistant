import { useNavigate } from 'react-router-dom';

import { Icons } from 'components/app/icons';
import Sparkline from 'components/charts/sparkline';
import type {
  LibrarySort,
  LibrarySortKey,
  LibrarySortOrder
} from 'components/pages/library/utils';
import type { UnitsPreference } from 'state/preferences';
import type { Session, SessionSummary } from 'types/session';
import { convertDistance, convertSpeed, formatDuration } from 'utils';

interface SessionsTableProps {
  readonly onSelectionToggle: (id: string) => void;
  readonly onSortChange: (next: LibrarySort) => void;
  readonly rows: readonly { readonly session: Session; readonly summary: SessionSummary }[];
  readonly selectedIds: ReadonlySet<string>;
  readonly sort: LibrarySort;
  readonly testId?: string;
  readonly units: UnitsPreference;
}

interface ColumnSpec {
  readonly key: LibrarySortKey | null;
  readonly label: string;
  readonly numeric?: boolean;
  readonly width?: string;
}

const COLUMNS: readonly ColumnSpec[] = [
  { key: null,        label: '',          width: '30px' },
  { key: 'name',      label: 'Session',   width: '240px' },
  { key: 'startedAt', label: 'Date' },
  { key: 'duration',  label: 'Duration' },
  { key: null,        label: 'Distance',  numeric: true },
  { key: null,        label: 'Max speed', numeric: true },
  { key: null,        label: 'Peak HP',   numeric: true },
  { key: null,        label: '0-60',      numeric: true },
  { key: null,        label: 'Vehicle' },
  { key: 'fileSize',  label: 'Size',      numeric: true },
  { key: null,        label: 'Profile',   width: '240px' },
  { key: null,        label: '',          width: '30px' }
];

const arrowFor = (active: boolean, order: LibrarySortOrder): string => {
  if (!active) return '';
  return order === 'asc' ? ' ↑' : ' ↓';
};

/** Format a bytes value the way the design's `fmtFileSize` does — KB
 *  for sub-MB inputs, MB above with two decimals. */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${ bytes } B`;
  if (bytes < 1024 * 1024) return `${ (bytes / 1024).toFixed(0) } KB`;
  return `${ (bytes / 1024 / 1024).toFixed(2) } MB`;
};

const vehicleLabel = (session: Session): string => {
  const { make, model, year } = session.meta.vehicle;
  const parts = [year === 0 ? '' : String(year), make, model].filter((part) => part !== '');
  return parts.length === 0 ? '—' : parts.join(' ');
};

/**
 * Library sessions table — matches the design handoff's 12-column
 * layout with a sparkline profile column, peak metric columns, and a
 * row-action menu. Row click navigates to the matching detail page;
 * the leftmost checkbox toggles selection for the Compare flow.
 *
 * Headers for the four sort columns (name / date / duration / size)
 * are click-to-sort; numeric columns derived from `summarize` are
 * sorted via the table's data prop (caller pre-sorts via the
 * `filterAndSortSessions` util).
 *
 * @returns A raw `<table className="tbl">` element styled by the
 *   design's global table classes.
 */
function SessionsTable({
  onSelectionToggle,
  onSortChange,
  rows,
  selectedIds,
  sort,
  testId,
  units
}: SessionsTableProps) {
  const navigate = useNavigate();

  return (
    <table className="tbl" data-testid={ testId }>
      <thead>
        <tr>
          { COLUMNS.map((column, index) => {
            const columnKey = column.key;
            const active = columnKey !== null && sort.key === columnKey;
            const sortable = columnKey !== null;
            const display = column.label + (active ? arrowFor(true, sort.order) : '');
            const handleClick = columnKey === null
              ? undefined
              : (): void => onSortChange({
                key:   columnKey,
                order: active && sort.order === 'asc' ? 'desc' : 'asc'
              });
            return (
              <th
                key={ index }
                className={ column.numeric === true ? 'num' : undefined }
                data-testid={ testId === undefined || columnKey === null ? undefined : `${ testId }-header-${ columnKey }` }
                onClick={ handleClick }
                style={ {
                  cursor: sortable ? 'pointer' : undefined,
                  width:  column.width
                } }
              >
                { display }
              </th>
            );
          }) }
        </tr>
      </thead>
      <tbody>
        { rows.length === 0 && (
          <tr data-testid={ testId === undefined ? undefined : `${ testId }-no-matches` }>
            <td className="dim" colSpan={ COLUMNS.length } style={ { padding: '16px 12px' } }>
              No sessions match the current filters.
            </td>
          </tr>
        ) }
        { rows.map(({ session, summary }) => {
          const meta = session.meta;
          const selected = selectedIds.has(meta.id);
          const distance = convertDistance(summary.dist, units);
          const speed = convertSpeed(summary.maxSpeed, units);
          return (
            <tr
              key={ meta.id }
              className={ selected ? 'sel' : undefined }
              data-testid={ testId === undefined ? undefined : `${ testId }-row-${ meta.id }` }
            >
              <td>
                <button
                  aria-checked={ selected }
                  aria-label={ selected ? 'Deselect session' : 'Select session' }
                  className={ `checkbox${ selected ? ' on' : '' }` }
                  data-testid={ testId === undefined ? undefined : `${ testId }-checkbox-${ meta.id }` }
                  onClick={ () => onSelectionToggle(meta.id) }
                  role="checkbox"
                  style={ { padding: 0 } }
                  type="button"
                />
              </td>
              <td onClick={ () => navigate(`/sessions/${ meta.id }`) } style={ { cursor: 'pointer' } }>
                <div style={ { display: 'flex', flexDirection: 'column', gap: 2 } }>
                  <div style={ { color: 'var(--text-0)', fontWeight: 500 } }>{ meta.name }</div>
                  <div className="dim mono" style={ { fontSize: 11 } }>{ meta.fileName }</div>
                </div>
              </td>
              <td onClick={ () => navigate(`/sessions/${ meta.id }`) } style={ { cursor: 'pointer' } }>
                <div style={ { display: 'flex', flexDirection: 'column', gap: 2 } }>
                  <div>{ new Date(meta.startedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) }</div>
                  <div className="dim mono" style={ { fontSize: 11 } }>
                    { new Date(meta.startedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }
                  </div>
                </div>
              </td>
              <td className="mono">{ formatDuration(meta.duration) }</td>
              <td className="num">
                { distance.value.toFixed(1) } <span className="dim">{ distance.unit }</span>
              </td>
              <td className="num">
                { speed.value.toFixed(0) } <span className="dim">{ speed.unit }</span>
              </td>
              <td className="num">{ Math.round(summary.peakHp) }</td>
              <td className="num">{ summary.t0to60 === null ? '—' : `${ summary.t0to60.toFixed(1) }s` }</td>
              <td>{ vehicleLabel(session) }</td>
              <td className="num dim">{ formatFileSize(meta.fileSize) }</td>
              <td>
                <Sparkline
                  color="var(--d-speed)"
                  data={ session.data }
                  dataKey="speed_mph"
                  height={ 26 }
                  testId={ testId === undefined ? undefined : `${ testId }-sparkline-${ meta.id }` }
                  width={ 210 }
                />
              </td>
              <td>
                <button
                  aria-label="More actions"
                  className="btn ghost icon sm"
                  data-testid={ testId === undefined ? undefined : `${ testId }-more-${ meta.id }` }
                  type="button"
                >
                  { Icons.more }
                </button>
              </td>
            </tr>
          );
        }) }
      </tbody>
    </table>
  );
}

export default SessionsTable;
