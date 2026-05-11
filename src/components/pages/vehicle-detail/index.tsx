import { Stack, Title } from '@mantine/core';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Icons } from 'components/app/icons';
import Card from 'components/primitives/card';
import { useAppDispatch, useAppSelector } from 'state/hooks';
import {
  type CalibrationOp,
  type Drivetrain,
  removeSavedVehicle,
  type SavedVehicle,
  selectActiveVehicle,
  selectPreferences,
  selectSavedVehicleById,
  type Transmission,
  updateSavedVehicle,
  type VehicleCalibration
} from 'state/preferences';
import { selectAllSessions } from 'state/sessions';
import type { Session } from 'types/session';
import { formatDistance, toast } from 'utils';

import DeleteDialog from './delete-dialog';

import styles from './index.module.scss';

/** Human-friendly transmission labels for the read-only view. */
const TRANSMISSION_LABELS: Record<Transmission, string> = {
  AT8: '8-speed automatic (AT8)',
  AT9: '9-speed automatic (AT9)',
  CVT: 'CVT',
  DCT: 'Dual-clutch (DCT)',
  M6:  '6-speed manual (M6)',
  PDK: '8-speed dual-clutch (PDK)'
};

const TRANSMISSIONS: readonly Transmission[] = ['AT9', 'AT8', 'PDK', 'DCT', 'M6', 'CVT'];

const DRIVETRAINS: readonly Drivetrain[] = ['AWD', 'FWD', 'RWD'];

const CAL_OPS: readonly CalibrationOp[] = ['-', '+', '×'];

/** Slugify the `<year>-<make>-<model>` triple for the .vprofile
 *  filename preview. Strips spaces + lowercases. */
const profileFileName = (vehicle: SavedVehicle): string => {
  const year = vehicle.year === 0 ? 'vehicle' : String(vehicle.year);
  const make = vehicle.make.toLowerCase().replace(/\s+/g, '-') || 'unknown';
  const model = vehicle.model.toLowerCase().replace(/\s+/g, '-') || 'profile';
  return `${ year }-${ make }-${ model }.vprofile`;
};

/**
 * Renders the Vehicle Detail page — `/vehicles/:id`. Pulls the vehicle
 * from `state/preferences.savedVehicles`, presents a read-only stack
 * of cards (specs / calibrations / sessions / export), and toggles
 * into an edit mode that exposes input + select editors for every
 * field.
 *
 * Save replaces the slice entry in place via `updateSavedVehicle`;
 * Cancel restores from the original. The local draft is initialized
 * from the slice + reset every time edit mode is entered, so a stale
 * unsaved buffer can't leak across visits.
 *
 * Delete fires a confirmation modal and dispatches `removeSavedVehicle`
 * on confirm — the user is bounced back to Settings since the page
 * is no longer pointing at anything.
 *
 * @returns The Vehicle Detail page React element.
 */
function VehicleDetail() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const preferences = useAppSelector((state) => selectPreferences(state.preferences));
  const allSessions = useAppSelector((state) => selectAllSessions(state.sessions));
  const activeVehicle = useAppSelector((state) => selectActiveVehicle(state.preferences));
  const vehicle = useAppSelector(
    (state) => id === undefined ? null : selectSavedVehicleById(state.preferences, id)
  );

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<SavedVehicle | null>(vehicle);
  const [confirmDelete, setConfirmDelete] = useState(false);

  /** Sync the local draft whenever the slice entry changes (vehicle
   *  id route change, or a save round-tripped). React's setState in
   *  render is fine for derived state when guarded against the same
   *  value. */
  if (vehicle !== null && (draft === null || draft.id !== vehicle.id)) {
    setDraft(vehicle);
  }

  const matchingSessions = useMemo(
    () => filterSessionsForVehicle(allSessions, vehicle),
    [allSessions, vehicle]
  );

  if (vehicle === null || draft === null) {
    return (
      <Stack data-testid="vehicle-detail-not-found" gap="md">
        <Title order={ 2 }>Vehicle not found</Title>
        <div className={ styles['not-found'] }>
          <h3 className={ styles['not-found-headline'] }>
            No saved vehicle matches this URL
          </h3>
          <p>
            Open Settings to pick or add a vehicle.
          </p>
          <button
            className="btn primary"
            data-testid="vehicle-detail-not-found-back"
            onClick={ () => navigate('/settings') }
            style={ { marginTop: 18 } }
            type="button"
          >
            { Icons.settings }<span>Open Settings</span>
          </button>
        </div>
      </Stack>
    );
  }

  const isActive = activeVehicle?.id === vehicle.id;
  const calibrations = draft.calibrations ?? [];
  const lastUsedText = formatLastUsed(vehicle.lastUsed ?? null, matchingSessions);

  const beginEdit = (): void => {
    setDraft(vehicle);
    setEditing(true);
  };

  const cancelEdit = (): void => {
    setDraft(vehicle);
    setEditing(false);
  };

  const saveEdit = (): void => {
    dispatch(updateSavedVehicle(draft));
    setEditing(false);
    toast.success('Vehicle profile saved');
  };

  const confirmDeleteVehicle = (): void => {
    dispatch(removeSavedVehicle(vehicle.id));
    setConfirmDelete(false);
    toast.error(`Deleted "${ vehicle.year } ${ vehicle.make } ${ vehicle.model }"`);
    navigate('/settings');
  };

  const updateDraft = <K extends keyof SavedVehicle>(key: K, value: SavedVehicle[K]): void => {
    setDraft({ ...draft, [key]: value });
  };

  const updateCalibrations = (next: readonly VehicleCalibration[]): void => {
    setDraft({ ...draft, calibrations: next });
  };

  const addCalibration = (): void => {
    const next: VehicleCalibration = { amount: 0, label: '', note: '', op: '-', pid: '', unit: '' };
    updateCalibrations([...calibrations, next]);
  };

  const updateCalibration = (index: number, patch: Partial<VehicleCalibration>): void => {
    updateCalibrations(calibrations.map((entry, position) => position === index ? { ...entry, ...patch } : entry));
  };

  const removeCalibration = (index: number): void => {
    updateCalibrations(calibrations.filter((_, position) => position !== index));
  };

  return (
    <div className="page" data-testid="vehicle-detail-page" style={ { maxWidth: 880 } }>
      <div className="page-h" style={ { alignItems: 'flex-start' } }>
        <div style={ { flex: 1, minWidth: 0 } }>
          <div className={ styles.crumb }>
            <button
              className="btn ghost sm"
              data-testid="vehicle-detail-back"
              onClick={ () => navigate('/settings') }
              type="button"
            >
              <span className={ styles['crumb-arrow'] }>{ Icons.chevRight }</span>
              <span>Settings</span>
            </button>
            <span className={ styles['crumb-tag'] }>
              / vehicles / <span className={ styles['crumb-tag-id'] }>{ vehicle.id }</span>
            </span>
          </div>
          <div className={ styles['title-row'] }>
            <h1 data-testid="vehicle-detail-title" style={ { margin: 0 } }>
              { vehicle.year === 0 ? '' : `${ vehicle.year } ` }{ vehicle.make } { vehicle.model }
            </h1>
            { isActive && (
              <span className="pill amber" data-testid="vehicle-detail-active-pill">
                <i className="dot" />Active vehicle
              </span>
            ) }
          </div>
          <div className={ styles.subline } data-testid="vehicle-detail-subline">
            VIN <span className={ styles['subline-value'] }>{ vehicle.vin || '—' }</span>
            <span className="dim"> · last used </span>
            <span className={ styles['subline-value'] }>{ lastUsedText }</span>
            <span className="dim"> · profile { profileFileName(vehicle) }</span>
          </div>
        </div>
        <div className={ styles['header-actions'] }>
          { editing
            ? (
              <>
                <button
                  className="btn ghost"
                  data-testid="vehicle-detail-cancel"
                  onClick={ cancelEdit }
                  type="button"
                >
                  { Icons.cross }<span>Cancel</span>
                </button>
                <button
                  className="btn primary"
                  data-testid="vehicle-detail-save"
                  onClick={ saveEdit }
                  type="button"
                >
                  { Icons.check }<span>Save changes</span>
                </button>
              </>
            )
            : (
              <>
                <button
                  className="btn"
                  data-testid="vehicle-detail-edit"
                  onClick={ beginEdit }
                  type="button"
                >
                  { Icons.settings }<span>Edit</span>
                </button>
                <button
                  className={ `btn ${ styles['danger-btn'] }` }
                  data-testid="vehicle-detail-delete"
                  onClick={ () => setConfirmDelete(true) }
                  type="button"
                >
                  { Icons.trash }<span>Delete vehicle</span>
                </button>
              </>
            ) }
        </div>
      </div>

      {/* ── Specs ── */}
      <div className="section-title">Specifications</div>
      <Card
        subtitle="Used to calibrate 0–60, peak horsepower and torque estimates from your session data."
        testId="vehicle-detail-specs"
        title="Vehicle specs"
      >
        <SettingRow
          detail="Affects 0–60 timing and horsepower estimates from acceleration."
          label="Curb weight"
        >
          { editing
            ? (
              <NumberInput
                onChange={ (value) => updateDraft('curbWeightLb', value) }
                suffix="lb"
                testId="vehicle-detail-curb"
                value={ draft.curbWeightLb ?? 0 }
              />
            )
            : (
              <span className="mono" data-testid="vehicle-detail-curb-display" style={ { color: 'var(--text-1)' } }>
                { (draft.curbWeightLb ?? 0).toLocaleString() } lb
              </span>
            ) }
        </SettingRow>

        <SettingRow
          detail="Used to convert wheel horsepower to crank horsepower and to estimate weight transfer under acceleration."
          label="Drivetrain"
        >
          { editing
            ? (
              <DrivetrainPicker
                onChange={ (value) => updateDraft('drivetrain', value) }
                testId="vehicle-detail-drivetrain"
                value={ draft.drivetrain ?? 'AWD' }
              />
            )
            : (
              <span className="pill" data-testid="vehicle-detail-drivetrain-display">
                <i className="dot" />{ draft.drivetrain ?? '—' }
              </span>
            ) }
        </SettingRow>

        <SettingRow
          detail="Marked on the RPM chart. Spikes past this line are flagged as fuel-cut events."
          label="Redline"
        >
          { editing
            ? (
              <NumberInput
                onChange={ (value) => updateDraft('redlineRpm', value) }
                suffix="rpm"
                testId="vehicle-detail-redline"
                value={ draft.redlineRpm ?? 0 }
              />
            )
            : (
              <span className="mono" data-testid="vehicle-detail-redline-display" style={ { color: 'var(--text-1)' } }>
                { (draft.redlineRpm ?? 0).toLocaleString() } rpm
              </span>
            ) }
        </SettingRow>

        <SettingRow
          detail="Estimates airflow when your adapter doesn't expose a mass-airflow sensor reading."
          label="Displacement"
        >
          { editing
            ? (
              <NumberInput
                decimals={ 1 }
                onChange={ (value) => updateDraft('displacementL', value) }
                suffix="L"
                testId="vehicle-detail-displacement"
                value={ draft.displacementL ?? 0 }
              />
            )
            : (
              <span className="mono" data-testid="vehicle-detail-displacement-display" style={ { color: 'var(--text-1)' } }>
                { (draft.displacementL ?? 0).toFixed(1) } L
              </span>
            ) }
        </SettingRow>

        <SettingRow
          detail="Tells the app how to recognize gear changes on the RPM trace."
          label="Transmission"
          last
        >
          { editing
            ? (
              <select
                className="select"
                data-testid="vehicle-detail-transmission"
                onChange={ (event) => updateDraft('transmission', event.currentTarget.value as Transmission) }
                style={ { width: 240 } }
                value={ draft.transmission ?? 'AT9' }
              >
                { TRANSMISSIONS.map((code) => (
                  <option key={ code } value={ code }>{ TRANSMISSION_LABELS[code] }</option>
                )) }
              </select>
            )
            : (
              <span data-testid="vehicle-detail-transmission-display" style={ { color: 'var(--text-1)' } }>
                { draft.transmission === undefined ? '—' : TRANSMISSION_LABELS[draft.transmission] }
              </span>
            ) }
        </SettingRow>
      </Card>

      {/* ── Calibrations ── */}
      <div className="section-title">Calibration overrides</div>
      <Card
        actions={ calibrations.length > 0
          ? (
            <span className="pill amber mono">
              <i className="dot" />{ calibrations.length } override{ calibrations.length === 1 ? '' : 's' }
            </span>
          )
          : undefined }
        flush
        subtitle="Compensate for sensor drift, replacement parts, or known ECU quirks."
        testId="vehicle-detail-calibrations"
        title={ `Per-PID calibration${ calibrations.length > 0 ? ` · ${ calibrations.length } active` : '' }` }
      >
        { calibrations.length === 0 && !editing && (
          <div className={ styles['cal-empty'] } data-testid="vehicle-detail-calibrations-empty">
            <div className={ styles['cal-empty-copy'] }>
              No overrides yet. Calibrations let you correct a known sensor offset — e.g.{ ' ' }
              <span className="mono" style={ { color: 'var(--text-1)' } }>actual = sensor − 0.5 psi</span>.
            </div>
            <button
              className="btn sm"
              data-testid="vehicle-detail-calibration-first"
              onClick={ () => { setEditing(true); addCalibration(); } }
              style={ { marginTop: 14 } }
              type="button"
            >
              { Icons.plus }<span>Add first override</span>
            </button>
          </div>
        ) }

        { calibrations.length > 0 && (
          <table className={ `tbl ${ styles['cal-table'] }` }>
            <thead>
              <tr>
                <th style={ { width: 90 } }>PID</th>
                <th>Channel</th>
                <th style={ { width: 240 } }>Formula</th>
                <th>Note</th>
                { editing && <th style={ { width: 36 } } /> }
              </tr>
            </thead>
            <tbody>
              { calibrations.map((calibration, index) => (
                <tr key={ index } data-testid={ `vehicle-detail-calibration-row-${ index }` }>
                  <td className="mono">
                    { editing
                      ? (
                        <input
                          className="input mono"
                          data-testid={ `vehicle-detail-calibration-pid-${ index }` }
                          onChange={ (event) => updateCalibration(index, { pid: event.currentTarget.value }) }
                          placeholder="0x0B"
                          style={ { width: 80 } }
                          value={ calibration.pid }
                        />
                      )
                      : calibration.pid }
                  </td>
                  <td>
                    { editing
                      ? (
                        <input
                          className="input"
                          data-testid={ `vehicle-detail-calibration-label-${ index }` }
                          onChange={ (event) => updateCalibration(index, { label: event.currentTarget.value }) }
                          placeholder="Boost"
                          style={ { width: '100%' } }
                          value={ calibration.label }
                        />
                      )
                      : calibration.label }
                  </td>
                  <td className="mono">
                    { editing
                      ? (
                        <div className={ styles['cal-formula'] }>
                          <span className="dim">actual =</span>
                          <span>sensor</span>
                          <select
                            className={ `select ${ styles['cal-formula-op'] }` }
                            data-testid={ `vehicle-detail-calibration-op-${ index }` }
                            onChange={ (event) => updateCalibration(index, { op: event.currentTarget.value as CalibrationOp }) }
                            value={ calibration.op }
                          >
                            { CAL_OPS.map((op) => <option key={ op } value={ op }>{ op }</option>) }
                          </select>
                          <input
                            className={ `input mono ${ styles['cal-formula-input'] }` }
                            data-testid={ `vehicle-detail-calibration-amount-${ index }` }
                            onChange={ (event) => updateCalibration(index, { amount: parseFloat(event.currentTarget.value) || 0 }) }
                            value={ calibration.amount }
                          />
                          <input
                            className={ `input mono ${ styles['cal-formula-unit'] }` }
                            data-testid={ `vehicle-detail-calibration-unit-${ index }` }
                            onChange={ (event) => updateCalibration(index, { unit: event.currentTarget.value }) }
                            placeholder="psi"
                            value={ calibration.unit }
                          />
                        </div>
                      )
                      : (
                        <span>
                          <span className="dim">actual =</span> sensor { calibration.op } { calibration.amount } { calibration.unit }
                        </span>
                      ) }
                  </td>
                  <td className="dim" style={ { fontSize: 11 } }>
                    { editing
                      ? (
                        <input
                          className="input"
                          data-testid={ `vehicle-detail-calibration-note-${ index }` }
                          onChange={ (event) => updateCalibration(index, { note: event.currentTarget.value }) }
                          style={ { fontSize: 11, width: '100%' } }
                          value={ calibration.note }
                        />
                      )
                      : (calibration.note === '' ? <span style={ { color: 'var(--text-3)' } }>—</span> : calibration.note) }
                  </td>
                  { editing && (
                    <td>
                      <button
                        aria-label="Remove"
                        className="btn ghost icon sm"
                        data-testid={ `vehicle-detail-calibration-remove-${ index }` }
                        onClick={ () => removeCalibration(index) }
                        type="button"
                      >
                        { Icons.cross }
                      </button>
                    </td>
                  ) }
                </tr>
              )) }
            </tbody>
          </table>
        ) }

        { editing && (
          <div className={ calibrations.length > 0 ? styles['cal-add-row-with-border'] : styles['cal-add-row'] }>
            <button
              className="btn sm"
              data-testid="vehicle-detail-calibration-add"
              onClick={ addCalibration }
              type="button"
            >
              { Icons.plus }<span>Add override row</span>
            </button>
            <span className={ styles['cal-note'] }>
              Applied to every session imported with this vehicle. Existing sessions are not retroactively rewritten.
            </span>
          </div>
        ) }
      </Card>

      {/* ── Sessions ── */}
      <div className="section-title">Sessions logged with this vehicle</div>
      <Card
        flush
        subtitle={ matchingSessions.length > 0
          ? 'Most recent 5 shown — open Library to see the rest.'
          : 'Import a CSV and pick this vehicle to start filling this list.' }
        testId="vehicle-detail-sessions"
        title={ `${ matchingSessions.length } session${ matchingSessions.length === 1 ? '' : 's' }` }
      >
        { matchingSessions.length === 0
          ? (
            <div className={ styles['sessions-empty'] } data-testid="vehicle-detail-sessions-empty">
              No sessions logged yet for this vehicle.
            </div>
          )
          : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Date</th>
                  <th className="num">Distance</th>
                  <th className="num">Peak HP</th>
                  <th style={ { width: 40 } } />
                </tr>
              </thead>
              <tbody>
                { matchingSessions.slice(0, 5).map((entry) => (
                  <tr
                    key={ entry.session.meta.id }
                    className={ styles['sessions-row'] }
                    data-testid={ `vehicle-detail-session-row-${ entry.session.meta.id }` }
                    onClick={ () => navigate(`/sessions/${ entry.session.meta.id }`) }
                  >
                    <td>{ entry.session.meta.name }</td>
                    <td className="mono dim" style={ { fontSize: 11 } }>
                      { new Date(entry.session.meta.startedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) }
                    </td>
                    <td className="num mono">{ formatDistance(entry.distance, preferences.units) }</td>
                    <td className="num mono">{ Math.round(entry.peakHp) } hp</td>
                    <td>{ Icons.chevRight }</td>
                  </tr>
                )) }
              </tbody>
            </table>
          ) }
      </Card>

      {/* ── Profile export ── */}
      <div className="section-title">Profile export</div>
      <Card
        subtitle="Bundle specs + calibrations into a single file that another TorquePro install can import."
        testId="vehicle-detail-export"
        title="Portable vehicle profile"
      >
        <SettingRow
          detail="Includes year/make/model, VIN, specs above, and every calibration override. Sessions are not included."
          label="Export as .vprofile"
          last
        >
          <div className={ styles['export-row'] }>
            <code
              className={ styles['profile-code'] }
              data-testid="vehicle-detail-profile-filename"
            >
              { profileFileName(vehicle) }
            </code>
            <button
              className="btn primary"
              data-testid="vehicle-detail-export-button"
              onClick={ () => toast.info('Vehicle profile export is coming soon') }
              type="button"
            >
              { Icons.download }<span>Export .vprofile</span>
            </button>
          </div>
        </SettingRow>
      </Card>

      { confirmDelete && (
        <DeleteDialog
          calibrationCount={ calibrations.length }
          onCancel={ () => setConfirmDelete(false) }
          onConfirm={ confirmDeleteVehicle }
          testId="vehicle-detail-delete-dialog"
          vehicle={ vehicle }
        />
      ) }
    </div>
  );
}

/** Read-only summary entry for the sessions card — pre-aggregated so
 *  the page renders without re-summarizing on every keystroke. */
interface SessionSummaryEntry {
  readonly distance: number;
  readonly peakHp: number;
  readonly session: Session;
}

/** Filter sessions to ones matching the vehicle's VIN (when present)
 *  or its make + model + year tuple. Sorts most-recent-first. */
function filterSessionsForVehicle(
  sessions: readonly Session[],
  vehicle: SavedVehicle | null
): readonly SessionSummaryEntry[] {
  if (vehicle === null) return [];
  const matches = sessions.filter((session) => {
    const meta = session.meta.vehicle;
    if (vehicle.vin !== '' && meta.vin !== '') return meta.vin === vehicle.vin;
    return meta.make === vehicle.make
      && meta.model === vehicle.model
      && meta.year === vehicle.year;
  });
  return [...matches]
    .sort((sessionA, sessionB) => sessionB.meta.startedAt.localeCompare(sessionA.meta.startedAt))
    .map((session) => ({
      distance: session.data.length === 0 ? 0 : (session.data[session.data.length - 1].t ?? 0) / 60,
      peakHp:   session.data.reduce((max, row) => Math.max(max, row.hp ?? 0), 0),
      session
    }));
}

/** Format the "last used" subline — the slice's stamp wins, else
 *  the most-recent matching session's start time, else an em-dash. */
function formatLastUsed(slice: string | null, sessions: readonly SessionSummaryEntry[]): string {
  const stamp = slice ?? (sessions[0]?.session.meta.startedAt ?? null);
  if (stamp === null) return '—';
  const date = new Date(stamp);
  return `${ date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) } · ${ date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }`;
}

export interface SettingRowProps {
  readonly children: React.ReactNode;
  readonly detail?: string;
  readonly label: string;
  readonly last?: boolean;
}

/** Local two-column row primitive shared by every spec + export entry.
 *  Mirrors the Settings page's row so the visual styling matches. */
function SettingRow({ children, detail, label, last = false }: SettingRowProps) {
  return (
    <div
      style={ {
        alignItems:          'center',
        borderBottom:        last ? 0 : '1px solid var(--border)',
        display:             'grid',
        gap:                 24,
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        padding:             '14px 0'
      } }
    >
      <div>
        <div style={ { color: 'var(--text-0)', fontSize: 13, fontWeight: 500 } }>{ label }</div>
        { detail !== undefined && (
          <div className="dim" style={ { fontSize: 11, lineHeight: 1.5, marginTop: 3, maxWidth: 480 } }>
            { detail }
          </div>
        ) }
      </div>
      <div>{ children }</div>
    </div>
  );
}

export interface NumberInputProps {
  readonly decimals?: number;
  readonly onChange: (value: number) => void;
  readonly suffix: string;
  readonly testId: string;
  readonly value: number;
}

/** Compact right-aligned numeric input + suffix label. Single source
 *  for the curb / redline / displacement editors so they stay visually
 *  aligned. */
function NumberInput({ decimals = 0, onChange, suffix, testId, value }: NumberInputProps) {
  return (
    <div className="row" style={ { gap: 6 } }>
      <input
        className="input mono"
        data-testid={ testId }
        onChange={ (event) => {
          const parsed = decimals === 0 ? Number(event.currentTarget.value) : parseFloat(event.currentTarget.value);
          onChange(Number.isFinite(parsed) ? parsed : 0);
        } }
        style={ { textAlign: 'right', width: 120 } }
        value={ value }
      />
      <span className="dim" style={ { fontSize: 12 } }>{ suffix }</span>
    </div>
  );
}

export interface DrivetrainPickerProps {
  readonly onChange: (value: Drivetrain) => void;
  readonly testId: string;
  readonly value: Drivetrain;
}

/** Inline three-button segmented control for the drivetrain field.
 *  Mirrors `SegBtn` from the Settings page but doesn't pull it in to
 *  avoid a cross-page import. */
function DrivetrainPicker({ onChange, testId, value }: DrivetrainPickerProps) {
  return (
    <div
      data-testid={ testId }
      style={ {
        background:   'var(--bg-2)',
        border:       '1px solid var(--border)',
        borderRadius: 7,
        display:      'inline-flex',
        padding:      2
      } }
    >
      { DRIVETRAINS.map((option) => {
        const on = option === value;
        return (
          <button
            key={ option }
            data-testid={ `${ testId }-${ option }` }
            onClick={ () => onChange(option) }
            style={ {
              background:   on ? 'var(--bg-3)' : 'transparent',
              border:       0,
              borderRadius: 5,
              boxShadow:    on ? 'inset 0 0 0 1px var(--border-strong)' : 'none',
              color:        on ? 'var(--text-0)' : 'var(--text-2)',
              cursor:       'pointer',
              fontSize:     12,
              fontWeight:   500,
              height:       26,
              padding:      '0 12px'
            } }
            type="button"
          >
            { option }
          </button>
        );
      }) }
    </div>
  );
}

export default VehicleDetail;
