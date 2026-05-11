import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icons } from 'components/app/icons';
import { ACCENT_SWATCHES } from 'components/app/utils';
import { useAppDispatch, useAppSelector } from 'state/hooks';
import {
  type BindAddressPreference,
  type DensityPreference,
  removeSavedVehicle,
  selectPreferences,
  setAccentColor,
  setActiveVehicleId,
  setBindAddress,
  setDensity,
  setTheme,
  setUnits,
  type ThemePreference,
  type UnitsPreference
} from 'state/preferences';
import { selectAllSessions } from 'state/sessions';
import { adapterPairing } from 'utils';

interface SegmentedOption<T extends string> {
  readonly label: string;
  readonly value: T;
}

interface SegBtnProps<T extends string> {
  readonly onChange: (next: T) => void;
  readonly options: readonly SegmentedOption<T>[];
  readonly testId?: string;
  readonly value: T;
  /** Wider segments — used for the Units toggle. */
  readonly wide?: boolean;
}

/** Inline segmented control — matches handoff-3's `SegBtn`. Smaller +
 *  more compact than Mantine's SegmentedControl; pinned to in-page
 *  styling so it sits naturally inside a card row. */
function SegBtn<T extends string>({ onChange, options, testId, value, wide = false }: SegBtnProps<T>) {
  return (
    <div
      data-testid={ testId }
      style={ {
        background:   'var(--bg-2)',
        border:       '1px solid var(--border)',
        borderRadius: 7,
        display:      'inline-flex',
        gap:          0,
        padding:      2
      } }
    >
      { options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={ option.value }
            data-testid={ testId === undefined ? undefined : `${ testId }-${ option.value }` }
            onClick={ () => onChange(option.value) }
            style={ {
              background:    on ? 'var(--bg-3)' : 'transparent',
              border:        0,
              borderRadius:  5,
              boxShadow:     on ? 'inset 0 0 0 1px var(--border-strong)' : 'none',
              color:         on ? 'var(--text-0)' : 'var(--text-2)',
              cursor:        'pointer',
              fontSize:      12,
              fontWeight:    500,
              height:        26,
              padding:       wide ? '0 18px' : '0 12px',
              textTransform: 'capitalize'
            } }
            type="button"
          >
            { option.label }
          </button>
        );
      }) }
    </div>
  );
}

export interface SettingRowProps {
  readonly children: React.ReactNode;
  readonly detail?: string;
  readonly label: string;
  readonly last?: boolean;
  readonly testId?: string;
}

/** Two-column setting row — label + detail on the left, control on
 *  the right, bottom border unless `last`. */
function SettingRow({ children, detail, label, last = false, testId }: SettingRowProps) {
  return (
    <div
      data-testid={ testId }
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

const THEME_OPTIONS: readonly SegmentedOption<ThemePreference>[] = [
  { label: 'Dark',  value: 'dark' },
  { label: 'Light', value: 'light' }
];

const DENSITY_OPTIONS: readonly SegmentedOption<DensityPreference>[] = [
  { label: 'Compact', value: 'compact' },
  { label: 'Regular', value: 'regular' },
  { label: 'Comfy',   value: 'comfy' }
];

const UNITS_OPTIONS: readonly SegmentedOption<UnitsPreference>[] = [
  { label: 'Imperial', value: 'imperial' },
  { label: 'Metric',   value: 'metric' }
];

const BIND_ADDRESS_OPTIONS: readonly { detail: string; label: string; value: BindAddressPreference }[] = [
  {
    detail: 'Localhost only — your phone must be on the same machine via USB tether.',
    label:  '127.0.0.1 — localhost only',
    value:  '127.0.0.1'
  },
  {
    detail: '0.0.0.0 binds all interfaces — your phone can post over Wi-Fi. Make sure your network is trusted.',
    label:  '0.0.0.0 — all interfaces (LAN)',
    value:  '0.0.0.0'
  }
];

/** Format bytes the way handoff-3 does — MB w/ 2 decimals. */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${ bytes } B`;
  if (bytes < 1024 * 1024) return `${ (bytes / 1024).toFixed(0) } KB`;
  return `${ (bytes / 1024 / 1024).toFixed(2) } MB`;
};

/**
 * Settings page — implements the design handoff-3 layout. Single-
 * column scroll over `.section-title` headers + `.card` blocks.
 *
 * Sections: Appearance · Units · Vehicles · Data · Network · About.
 *
 * Every control dispatches immediately (no Save / Cancel split) and
 * the preferences slice persists via the store's subscribe listener.
 *
 * @returns The Settings page React element.
 */
function Settings() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const preferences = useAppSelector((state) => selectPreferences(state.preferences));
  const sessions = useAppSelector((state) => selectAllSessions(state.sessions));
  const [copied, setCopied] = useState(false);

  const totalSize = sessions.reduce((sum, session) => sum + session.meta.fileSize, 0);
  const totalRows = sessions.reduce((sum, session) => sum + session.data.length, 0);
  const activeCount = preferences.savedVehicles.filter(
    (vehicle) => vehicle.id === preferences.activeVehicleId
  ).length;

  /** Mock port + upload URL — wired to the real electronAPI.getPort
   *  once the Phase J live-capture endpoint lands. */
  const port = window.electronAPI.getPort();

  /** GitHub project URLs surfaced by the About card. Centralized here
   *  so the same /releases /issues /pages targets line up with the
   *  package.json `repository` + `homepage` fields if those ever drift. */
  const REPO_URL = 'https://github.com/iPzard/torque-pro-assistant';
  const ABOUT_LINKS = {
    docs:     'https://ipzard.github.io/torque-pro-assistant/',
    issues:   `${ REPO_URL }/issues`,
    /** GitHub's `/releases/latest` 302-redirects to the newest release
     *  tag, which doubles as the release-notes page for that build. */
    releaseLatest: `${ REPO_URL }/releases/latest`,
    
    releases: `${ REPO_URL }/releases`,
    repo:     REPO_URL
  } as const;

  const openExternal = (url: string): void => {
    window.electronAPI.openExternal(url);
  };
  const uploadHost = preferences.bindAddress === '127.0.0.1' ? '127.0.0.1' : '192.168.1.42';
  const uploadUrl = `http://${ uploadHost }:${ port }/torque/upload`;

  const copyUploadUrl = (): void => {
    if (typeof navigator !== 'undefined' && navigator.clipboard !== undefined) {
      navigator.clipboard.writeText(uploadUrl).catch(() => undefined);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="page" data-testid="settings-page" style={ { maxWidth: 880 } }>
      <div className="page-h">
        <div>
          <h1 data-testid="settings-page-title">Settings</h1>
          <div className="sub" data-testid="settings-page-description">
            Preferences, vehicles, storage, and network. All changes save instantly.
          </div>
        </div>
        <div className="dim mono" style={ { fontSize: 11 } }>~/Library/Application Support/TorquePro</div>
      </div>

      {/* ── Appearance ── */}
      <div className="section-title">Appearance</div>
      <div className="card" data-testid="settings-appearance">
        <div className="card-h">
          <div className="title">Theme &amp; display <small>instrument-cluster defaults</small></div>
        </div>
        <div className="card-body">
          <SettingRow detail="Dark is recommended for night sessions." label="Theme">
            <SegBtn
              onChange={ (next) => dispatch(setTheme(next)) }
              options={ THEME_OPTIONS }
              testId="settings-theme"
              value={ preferences.theme }
            />
          </SettingRow>
          <SettingRow detail="Compact fits ~30% more rows per screen." label="Density">
            <SegBtn
              onChange={ (next) => dispatch(setDensity(next)) }
              options={ DENSITY_OPTIONS }
              testId="settings-density"
              value={ preferences.density }
            />
          </SettingRow>
          <SettingRow
            detail="Used on the active nav rail, primary buttons, and chart cursors."
            label="Accent color"
            last
          >
            <div className="row" data-testid="settings-accent-swatches" style={ { gap: 8 } }>
              { ACCENT_SWATCHES.map((swatch) => {
                const on = preferences.accentColor === swatch.dark;
                /** Render the swatch in whichever variant the active
                 *  theme uses — so the picker previews the exact tone
                 *  that will land on the rest of the UI. */
                const preview = preferences.theme === 'light' ? swatch.light : swatch.dark;
                return (
                  <button
                    key={ swatch.dark }
                    aria-label={ `Accent color ${ swatch.name }` }
                    aria-pressed={ on }
                    data-testid={ `settings-accent-${ swatch.name.toLowerCase() }` }
                    onClick={ () => dispatch(setAccentColor(swatch.dark)) }
                    style={ {
                      background:   preview,
                      border:       on ? '2px solid var(--text-0)' : '1px solid var(--border)',
                      borderRadius: 6,
                      boxShadow:    on ? `0 0 0 3px ${ preview }33` : 'none',
                      cursor:       'pointer',
                      height:       28,
                      padding:      0,
                      width:        28
                    } }
                    title={ swatch.name }
                    type="button"
                  />
                );
              }) }
            </div>
          </SettingRow>
        </div>
      </div>

      {/* ── Units ── */}
      <div className="section-title">Units</div>
      <div className="card" data-testid="settings-units">
        <div className="card-h">
          <div className="title">Measurement system <small>affects every chart, table, and export</small></div>
        </div>
        <div className="card-body">
          <SettingRow
            detail={ preferences.units === 'imperial' ? 'Showing mph · °F · psi' : 'Showing km/h · °C · kPa' }
            label="Speed, temperature, pressure"
            last
          >
            <SegBtn
              onChange={ (next) => dispatch(setUnits(next)) }
              options={ UNITS_OPTIONS }
              testId="settings-units-toggle"
              value={ preferences.units }
              wide
            />
          </SettingRow>
        </div>
      </div>

      {/* ── Vehicles ── */}
      <div className="section-title">Vehicles</div>
      <div className="card" data-testid="settings-vehicles">
        <div className="card-h">
          <div className="title">
            Saved vehicles
            <small>{ preferences.savedVehicles.length } total · { activeCount } active</small>
          </div>
          <div className="actions">
            <button className="btn ghost sm" type="button">
              { Icons.upload }
              <span>Import .vprofile</span>
            </button>
            <button className="btn ghost sm" type="button">
              <span>Export all</span>
            </button>
            <button
              className="btn primary sm"
              data-testid="settings-vehicles-add-button"
              onClick={ () => navigate('/vehicle/setup') }
              type="button"
            >
              { Icons.plus }
              <span>Add vehicle</span>
            </button>
          </div>
        </div>
        <div className="card-body flush">
          { preferences.savedVehicles.length === 0
            ? (
              <div
                data-testid="settings-vehicles-empty"
                style={ { padding: '32px 20px', textAlign: 'center' } }
              >
                <div className="dim" style={ { fontSize: 12, marginBottom: 12 } }>No vehicles saved yet.</div>
                <button
                  className="btn primary sm"
                  data-testid="settings-vehicles-empty-add-button"
                  onClick={ () => navigate('/vehicle/setup') }
                  type="button"
                >
                  { Icons.plus }
                  <span>Add your first vehicle</span>
                </button>
              </div>
            )
            : (
              <table className="tbl" data-testid="settings-vehicles-table">
                <thead>
                  <tr>
                    <th style={ { width: 24 } } />
                    <th>Vehicle</th>
                    <th>VIN</th>
                    <th className="num">Sessions</th>
                    <th>Added</th>
                    <th style={ { width: 200 } } />
                  </tr>
                </thead>
                <tbody>
                  { preferences.savedVehicles.map((vehicle) => {
                    const isActive = vehicle.id === preferences.activeVehicleId;
                    const sessionCount = sessions.filter(
                      (session) => session.meta.vehicle.vin === vehicle.vin && vehicle.vin !== ''
                    ).length;
                    return (
                      <tr
                        key={ vehicle.id }
                        data-testid={ `settings-vehicles-row-${ vehicle.id }` }
                      >
                        <td>
                          { isActive && (
                            <span
                              data-testid={ `settings-vehicles-row-${ vehicle.id }-active-dot` }
                              style={ {
                                background:   'var(--accent)',
                                borderRadius: 50,
                                boxShadow:    '0 0 0 3px var(--accent-soft)',
                                display:      'inline-block',
                                height:       8,
                                width:        8
                              } }
                            />
                          ) }
                        </td>
                        <td>
                          <div style={ { display: 'flex', flexDirection: 'column', gap: 2 } }>
                            <div style={ { fontWeight: 500 } }>
                              { vehicle.year } { vehicle.make } { vehicle.model }
                            </div>
                            { isActive && (
                              <div
                                className="mono"
                                style={ {
                                  color:         'var(--accent)',
                                  fontSize:      11,
                                  fontWeight:    600,
                                  letterSpacing: '.08em'
                                } }
                              >
                                ACTIVE PROFILE
                              </div>
                            ) }
                          </div>
                        </td>
                        <td className="mono dim" style={ { fontSize: 11 } }>
                          { vehicle.vin === '' ? '—' : vehicle.vin }
                        </td>
                        <td className="num mono">{ sessionCount }</td>
                        <td className="dim">
                          { new Date(vehicle.addedAt).toLocaleDateString('en-US', {
                            day:   'numeric',
                            month: 'short',
                            year:  'numeric'
                          }) }
                        </td>
                        <td>
                          <div className="row" style={ { gap: 6, justifyContent: 'flex-end' } }>
                            { !isActive && (
                              <button
                                className="btn ghost sm"
                                data-testid={ `settings-vehicles-row-${ vehicle.id }-set-active` }
                                onClick={ () => dispatch(setActiveVehicleId(vehicle.id)) }
                                type="button"
                              >
                                Set active
                              </button>
                            ) }
                            <button
                              aria-label="Edit"
                              className="btn ghost icon sm"
                              data-testid={ `settings-vehicles-row-${ vehicle.id }-edit` }
                              type="button"
                            >
                              { Icons.settings }
                            </button>
                            <button
                              aria-label="Delete"
                              className="btn ghost icon sm"
                              data-testid={ `settings-vehicles-row-${ vehicle.id }-delete` }
                              onClick={ () => dispatch(removeSavedVehicle(vehicle.id)) }
                              style={ { color: 'var(--danger)' } }
                              type="button"
                            >
                              { Icons.cross }
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) }
                </tbody>
              </table>
            ) }
        </div>
      </div>

      {/* ── Data ── */}
      <div className="section-title">Data</div>
      <div className="card" data-testid="settings-data">
        <div className="card-h">
          <div className="title">Library storage <small>local, on-device</small></div>
        </div>
        <div className="card-body">
          <SettingRow
            detail="Path is OS-managed; relocating requires app restart."
            label="Storage location"
          >
            <div className="row" style={ { gap: 6 } }>
              <code
                className="mono"
                style={ {
                  background:   'var(--bg-2)',
                  border:       '1px solid var(--border)',
                  borderRadius: 6,
                  color:        'var(--text-1)',
                  fontSize:     11,
                  padding:      '5px 10px'
                } }
              >
                ~/Library/Application Support/TorquePro/library.db
              </code>
            </div>
          </SettingRow>
          <SettingRow
            detail={ `${ totalRows.toLocaleString() } rows across ${ sessions.length } session${ sessions.length === 1 ? '' : 's' }.` }
            label="Sessions on disk"
          >
            <span className="pill mono" data-testid="settings-data-size-pill">
              <i className="dot ok" />
              { formatFileSize(totalSize) }
            </span>
          </SettingRow>
          <SettingRow
            detail="Bundle every session + metadata into a single .tplog archive."
            label="Export library"
          >
            <button className="btn" type="button">
              <span>Export .tplog</span>
            </button>
          </SettingRow>
          <SettingRow
            detail="Permanently delete every imported session. Vehicles and preferences are kept. This cannot be undone."
            label="Clear all sessions"
            last
          >
            <button
              className="btn"
              data-testid="settings-data-clear-button"
              style={ {
                background:  'rgba(255,90,90,.1)',
                borderColor: 'rgba(255,90,90,.4)',
                color:       'var(--danger)'
              } }
              type="button"
            >
              <span>Clear sessions…</span>
            </button>
          </SettingRow>
        </div>
      </div>

      {/* ── Network ── */}
      <div className="section-title">Network</div>
      <div className="card" data-testid="settings-network">
        <div className="card-h">
          <div className="title">Live-capture endpoint <small>Phase J · experimental</small></div>
          <div className="actions">
            <span className="pill amber"><i className="dot" />preview</span>
          </div>
        </div>
        <div className="card-body">
          <SettingRow
            detail="The local Flask service that receives live PID frames from your phone. Assigned dynamically at startup."
            label="Backend port"
          >
            <div className="row" style={ { gap: 6 } }>
              <code
                className="mono"
                data-testid="settings-network-port"
                style={ {
                  background:   'var(--bg-2)',
                  border:       '1px solid var(--border)',
                  borderRadius: 6,
                  color:        'var(--text-0)',
                  fontSize:     12,
                  minWidth:     64,
                  padding:      '5px 10px',
                  textAlign:    'center'
                } }
              >
                :{ port }
              </code>
              <span className="pill ok mono"><i className="dot" />listening</span>
            </div>
          </SettingRow>
          <SettingRow
            detail={
              BIND_ADDRESS_OPTIONS.find((option) => option.value === preferences.bindAddress)?.detail
              ?? ''
            }
            label="Bind address"
          >
            <select
              className="select"
              data-testid="settings-network-bind"
              onChange={ (event) => dispatch(setBindAddress(event.currentTarget.value as BindAddressPreference)) }
              style={ { width: 220 } }
              value={ preferences.bindAddress }
            >
              { BIND_ADDRESS_OPTIONS.map((option) => (
                <option key={ option.value } value={ option.value }>{ option.label }</option>
              )) }
            </select>
          </SettingRow>
          <SettingRow
            detail="One-time Bluetooth pairing. Separate from per-car vehicle profiles — pair once, talk to any vehicle you plug this adapter into."
            label="OBD-II adapter"
          >
            <button
              className="btn"
              data-testid="settings-network-connect-adapter"
              onClick={ () => adapterPairing() }
              type="button"
            >
              { Icons.vehicle }<span>Connect adapter…</span>
            </button>
          </SettingRow>
          <SettingRow
            detail="Paste this into Torque Pro → Settings → Data Logging & Upload → Webserver URL on your phone."
            label="Torque Pro upload URL"
            last
          >
            <div className="row" style={ { gap: 6, width: '100%' } }>
              <input
                className="input mono"
                data-testid="settings-network-upload-url"
                onFocus={ (event) => event.currentTarget.select() }
                readOnly
                style={ { color: 'var(--text-0)', flex: 1, fontSize: 11 } }
                value={ uploadUrl }
              />
              <button
                className={ `btn${ copied ? ' primary' : '' }` }
                data-testid="settings-network-copy-button"
                onClick={ copyUploadUrl }
                style={ { minWidth: 88 } }
                type="button"
              >
                <span>{ copied ? 'Copied' : 'Copy' }</span>
              </button>
            </div>
          </SettingRow>
        </div>
      </div>

      {/* ── About ── */}
      <div className="section-title">About</div>
      <div className="card" data-testid="settings-about">
        <div className="card-body">
          <div
            style={ {
              alignItems:          'center',
              display:             'grid',
              gap:                 16,
              gridTemplateColumns: 'auto 1fr auto'
            } }
          >
            <div
              style={ {
                background:   'var(--accent-soft)',
                border:       '1px solid var(--accent-line)',
                borderRadius: 12,
                color:        'var(--accent)',
                display:      'inline-flex',
                padding:      14
              } }
            >
              <svg
                fill="none"
                height="28"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.6"
                viewBox="0 0 24 24"
                width="28"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3.5 2" />
                <path d="M19.5 8.5 18 9.5M4.5 8.5 6 9.5M19.5 15.5 18 14.5M4.5 15.5 6 14.5" />
              </svg>
            </div>
            <div>
              <div style={ { fontSize: 15, fontWeight: 600 } }>TorquePro Assistant</div>
              <div className="dim mono" style={ { fontSize: 11, marginTop: 3 } }>
                v0.4.2 · build 20260509.1 · { window.electronAPI.platform }
              </div>
              <div className="dim" style={ { fontSize: 11, marginTop: 6 } }>
                Released under the MIT License. Not affiliated with Torque Pro or Ian Hawkins.
              </div>
            </div>
            <div className="row" style={ { gap: 6 } }>
              <button
                className="btn ghost sm"
                data-testid="settings-about-check-updates"
                onClick={ () => openExternal(ABOUT_LINKS.releases) }
                type="button"
              >
                Check for updates
              </button>
            </div>
          </div>
          <div className="divider" />
          <div className="row" style={ { flexWrap: 'wrap', gap: 6 } }>
            <button
              className="btn ghost sm"
              data-testid="settings-about-docs"
              onClick={ () => openExternal(ABOUT_LINKS.docs) }
              type="button"
            >
              Documentation
            </button>
            <button
              className="btn ghost sm"
              data-testid="settings-about-release-notes"
              onClick={ () => openExternal(ABOUT_LINKS.releaseLatest) }
              type="button"
            >
              Release notes
            </button>
            <button
              className="btn ghost sm"
              data-testid="settings-about-source"
              onClick={ () => openExternal(ABOUT_LINKS.repo) }
              type="button"
            >
              Source · GitHub
            </button>
            <button
              className="btn ghost sm"
              data-testid="settings-about-issues"
              onClick={ () => openExternal(ABOUT_LINKS.issues) }
              type="button"
            >
              Report a bug
            </button>
            <div className="right" />
            <span className="dim" style={ { fontSize: 11 } }>© 2026 TorquePro Assistant contributors</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
