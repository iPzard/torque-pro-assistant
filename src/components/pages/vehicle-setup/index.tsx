import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icons } from 'components/app/icons';
import { useAppDispatch, useAppSelector } from 'state/hooks';
import {
  addSavedVehicle,
  selectPreferences,
  setActiveVehicleId,
  setVehicleDefaults
} from 'state/preferences';

/** Years offered in the year dropdown. Walks back 14 years from
 *  the current model year (matches the design's `2026 - i` loop). */
const YEAR_OPTIONS: readonly number[] = Array.from(
  { length: 14 },
  (_, index) => 2026 - index
);

/** Make options pulled from the design handoff's selects list. */
const MAKE_OPTIONS: readonly string[] = [
  'Acura', 'Audi', 'BMW', 'Chevrolet', 'Dodge', 'Ford', 'Honda',
  'Hyundai', 'Jeep', 'Lexus', 'Mazda', 'Mercedes-Benz', 'Mitsubishi',
  'Nissan', 'Porsche', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
];

interface BulletRowProps {
  readonly detail: string;
  readonly label: string;
}

/** Single bullet row in the "Why we need a vehicle" right-side card. */
function BulletRow({ detail, label }: BulletRowProps) {
  return (
    <div className="row" style={ { alignItems: 'flex-start', gap: 10 } }>
      <span style={ { color: 'var(--ok)', flex: '0 0 18px', marginTop: 1 } }>
        { Icons.check }
      </span>
      <div style={ { flex: 1 } }>
        <div style={ { color: 'var(--text-0)', fontSize: 12 } }>{ label }</div>
        <div className="dim" style={ { fontSize: 11, marginTop: 2 } }>{ detail }</div>
      </div>
    </div>
  );
}

/**
 * First-run vehicle setup page — matches handoff-2's `FirstRunNoVehicle`
 * (screens-onboarding.jsx). Trimmed-down variant of the design's
 * `NoVehicleScreen`: manual entry form (Year / Make / Model / optional
 * VIN), dashed-border explainer cards ("No saved vehicles yet" + "No
 * Bluetooth adapter detected"), and a sidebar with "Why we need a
 * vehicle" bullets + "What happens next" steps.
 *
 * Submitting "Add vehicle" dispatches `setVehicleDefaults` and routes
 * to `/import` so the user can drop their first CSV. The OBD-adapter
 * + saved-vehicle import paths are scaffolded with disabled controls
 * — wired once the Bluetooth + vprofile features land.
 *
 * @returns The vehicle-setup page React element.
 */
function VehicleSetup() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const preferences = useAppSelector((state) => selectPreferences(state.preferences));

  const [year, setYear] = useState<number>(preferences.vehicleDefaults.year);
  const [make, setMake] = useState<string>(preferences.vehicleDefaults.make);
  const [model, setModel] = useState<string>(preferences.vehicleDefaults.model);
  const [vin, setVin] = useState<string>('');

  const canSubmit = year !== 0 && make.trim() !== '' && model.trim() !== '';

  const handleSubmit = (): void => {
    if (!canSubmit) return;
    /** Three dispatches so both the legacy `vehicleDefaults` pointer
     *  and the new `savedVehicles` list stay in sync. The new vehicle
     *  becomes the active one immediately. */
    const id = `veh_${ Date.now() }`;
    dispatch(addSavedVehicle({
      addedAt: new Date().toISOString(),
      id,
      make,
      model,
      vin,
      year
    }));
    dispatch(setActiveVehicleId(id));
    dispatch(setVehicleDefaults({ make, model, year }));
    navigate('/import');
  };

  return (
    <div className="page" data-testid="vehicle-setup-page">
      <div className="page-h">
        <div>
          <div className="row" style={ { gap: 8, marginBottom: 6 } }>
            <button
              className="btn ghost sm"
              data-testid="vehicle-setup-back-button"
              onClick={ () => navigate('/library') }
              type="button"
            >
              <span style={ { display: 'inline-flex', transform: 'rotate(180deg)' } }>
                { Icons.chevDown }
              </span>
              <span>Back</span>
            </button>
            <span className="dim mono" style={ { fontSize: 11 } }>Step 1 of 2 · Add a vehicle</span>
          </div>
          <h1 data-testid="vehicle-setup-title">Tell us about your car</h1>
          <div className="sub" data-testid="vehicle-setup-description">
            This unlocks calibrated PIDs and unit decoding. You can change or add more vehicles later.
          </div>
        </div>
      </div>

      <div style={ { display: 'grid', gap: 14, gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)' } }>
        <div className="col" style={ { gap: 14 } }>
          <div className="card" data-testid="vehicle-setup-form-card">
            <div className="card-h">
              <div className="title">
                Add a vehicle <small>manual entry</small>
              </div>
            </div>
            <div className="card-body">
              <div style={ { display: 'grid', gap: 10, gridTemplateColumns: 'repeat(3, 1fr)' } }>
                <div>
                  <div className="dim" style={ { fontSize: 10, letterSpacing: '.08em', marginBottom: 4, textTransform: 'uppercase' } }>Year</div>
                  <select
                    className="select"
                    data-testid="vehicle-setup-year"
                    onChange={ (event) => setYear(Number(event.currentTarget.value) || 0) }
                    style={ { width: '100%' } }
                    value={ year === 0 ? '' : year }
                  >
                    <option value="">Year…</option>
                    { YEAR_OPTIONS.map((option) => <option key={ option } value={ option }>{ option }</option>) }
                  </select>
                </div>
                <div>
                  <div className="dim" style={ { fontSize: 10, letterSpacing: '.08em', marginBottom: 4, textTransform: 'uppercase' } }>Make</div>
                  <select
                    className="select"
                    data-testid="vehicle-setup-make"
                    onChange={ (event) => {
                      setMake(event.currentTarget.value);
                      setModel('');
                    } }
                    style={ { width: '100%' } }
                    value={ make }
                  >
                    <option value="">Make…</option>
                    { MAKE_OPTIONS.map((option) => <option key={ option } value={ option }>{ option }</option>) }
                  </select>
                </div>
                <div>
                  <div className="dim" style={ { fontSize: 10, letterSpacing: '.08em', marginBottom: 4, textTransform: 'uppercase' } }>Model</div>
                  <input
                    className="input"
                    data-testid="vehicle-setup-model"
                    disabled={ make === '' }
                    onChange={ (event) => setModel(event.currentTarget.value) }
                    placeholder={ make === '' ? 'Select make first…' : 'e.g. AMG GT 53' }
                    style={ { width: '100%' } }
                    value={ model }
                  />
                </div>
              </div>
              <div className="divider" />
              <div className="dim" style={ { fontSize: 10, letterSpacing: '.08em', marginBottom: 4, textTransform: 'uppercase' } }>
                VIN
                <span style={ { color: 'var(--text-3)', letterSpacing: 0, marginLeft: 6, textTransform: 'none' } }>
                  optional · enables auto-decode
                </span>
              </div>
              <input
                className="input mono"
                data-testid="vehicle-setup-vin"
                onChange={ (event) => setVin(event.currentTarget.value) }
                placeholder="17-character VIN"
                style={ { letterSpacing: '.05em', width: '100%' } }
                value={ vin }
              />
              <div className="row" style={ { gap: 8, marginTop: 14 } }>
                <button
                  className="btn primary"
                  data-testid="vehicle-setup-submit-button"
                  disabled={ !canSubmit }
                  onClick={ handleSubmit }
                  style={ canSubmit ? undefined : { opacity: 0.5 } }
                  type="button"
                >
                  { Icons.check }
                  <span>Add vehicle</span>
                </button>
                <button className="btn ghost" disabled type="button">
                  Import from OBD adapter
                </button>
              </div>
            </div>
          </div>

          <div
            className="card"
            data-testid="vehicle-setup-saved-empty"
            style={ { background: 'var(--bg-2)', borderStyle: 'dashed', padding: 14 } }
          >
            <div className="row" style={ { gap: 10 } }>
              <span style={ { background: 'var(--bg-3)', borderRadius: 8, color: 'var(--text-2)', display: 'inline-flex', padding: 8 } }>
                { Icons.vehicle }
              </span>
              <div style={ { flex: 1 } }>
                <div style={ { fontSize: 12, fontWeight: 500 } }>No saved vehicles yet</div>
                <div className="dim" style={ { fontSize: 11, lineHeight: 1.5, marginTop: 2 } }>
                  Once you add your first car, it&rsquo;ll show up here for one-click re-selection.
                </div>
              </div>
            </div>
          </div>

          <div
            className="card"
            data-testid="vehicle-setup-bluetooth-empty"
            style={ { background: 'var(--bg-2)', borderStyle: 'dashed', padding: 14 } }
          >
            <div className="row" style={ { gap: 10 } }>
              <span style={ { background: 'var(--bg-3)', borderRadius: 8, color: 'var(--text-3)', display: 'inline-flex', padding: 8 } }>
                <svg
                  fill="none"
                  height="16"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                  viewBox="0 0 24 24"
                  width="16"
                >
                  <path d="M2 12 a 10 10 0 1 1 20 0" />
                  <path d="M6 12 a 6 6 0 1 1 12 0" />
                  <circle cx="12" cy="12" r="1.5" />
                </svg>
              </span>
              <div style={ { flex: 1 } }>
                <div style={ { fontSize: 12, fontWeight: 500 } }>No Bluetooth adapter detected</div>
                <div className="dim" style={ { fontSize: 11, lineHeight: 1.5, marginTop: 2 } }>
                  Plug in an ELM327-compatible OBD-II adapter to auto-detect your VIN. Optional — you can also enter everything manually above.
                </div>
              </div>
              <button className="btn ghost sm" disabled type="button">Scan again</button>
            </div>
          </div>
        </div>

        <div className="col" style={ { gap: 14 } }>
          <div className="card">
            <div className="card-body">
              <div className="row" style={ { gap: 12, marginBottom: 10 } }>
                <span style={ { background: 'var(--accent-soft)', borderRadius: 10, color: 'var(--accent)', display: 'inline-flex', padding: 10 } }>
                  { Icons.vehicle }
                </span>
                <div>
                  <div style={ { fontSize: 14, fontWeight: 600 } }>Why we need a vehicle</div>
                  <div className="dim" style={ { fontSize: 11, marginTop: 2 } }>
                    Unlocks calibrated PIDs, units, and 0-60 detection.
                  </div>
                </div>
              </div>
              <div className="col" style={ { gap: 10, marginTop: 4 } }>
                <BulletRow detail="Boost, AFR, oil temp, transmission temp" label="Decode manufacturer-specific PIDs" />
                <BulletRow detail="Weight, drivetrain losses, redline" label="Calibrate torque & horsepower" />
                <BulletRow detail="Sessions stay grouped per car" label="Filter library by vehicle" />
                <BulletRow detail="Needs gear ratios + curb weight" label="Detect 0-60, ¼-mile, braking g" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <div className="title">What happens next</div>
            </div>
            <div className="card-body">
              <ol style={ { color: 'var(--text-1)', fontSize: 12, lineHeight: 1.7, margin: 0, paddingLeft: 18 } }>
                <li>Add your vehicle (this step)</li>
                <li>Import your first Torque Pro CSV</li>
                <li>Browse charts, GPS, compare sessions</li>
              </ol>
              <div className="dim" style={ { fontSize: 11, marginTop: 10 } }>
                Or skip ahead and play with a 12-minute sample log — the vehicle prompt will come back when you import real data.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VehicleSetup;
