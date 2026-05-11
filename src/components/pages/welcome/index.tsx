import { useNavigate } from 'react-router-dom';

import { Icons } from 'components/app/icons';

export interface StepProps {
  readonly detail: string;
  readonly label: string;
  readonly n: number;
}

/** Single step card on the Welcome screen. Numbered badge + label +
 *  one-line detail. Triple repeat on the Welcome layout. */
function Step({ detail, label, n }: StepProps) {
  return (
    <div className="card" style={ { padding: '14px 14px 16px' } }>
      <div className="row" style={ { gap: 10, marginBottom: 8 } }>
        <span
          className="mono"
          style={ {
            alignItems:      'center',
            background:      'var(--bg-3)',
            border:          '1px solid var(--border)',
            borderRadius:    5,
            color:           'var(--accent)',
            display:         'inline-flex',
            fontSize:        11,
            height:          22,
            justifyContent:  'center',
            width:           22
          } }
        >
          { n }
        </span>
        <div style={ { fontSize: 13, fontWeight: 600 } }>{ label }</div>
      </div>
      <div className="dim" style={ { fontSize: 11, lineHeight: 1.5 } }>{ detail }</div>
    </div>
  );
}

/**
 * Welcome / first-run screen for brand-new installs. Mirrors the
 * design handoff's `WelcomeScreen` (screens-onboarding.jsx): logo +
 * amber heading, three numbered step cards (Add vehicle / Import log
 * / Explore), primary + ghost CTAs, footer line, and a sample.csv
 * download card.
 *
 * Renders inside the Library page when the sessions slice is empty —
 * takes over the entire main pane until the user imports their first
 * CSV.
 *
 * Primary CTA routes to `/settings` where the vehicle defaults form
 * lives; the FirstRunNoVehicle full-page picker from the design
 * lands later (CLAUDE.md TODO §C polish).
 *
 * @returns The Welcome screen React element.
 */
function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="page" data-testid="welcome-page" style={ { padding: '40px 28px' } }>
      <div style={ { margin: '0 auto', maxWidth: 880 } }>
        <div style={ { marginBottom: 36, textAlign: 'center' } }>
          <div
            data-testid="welcome-logo"
            style={ {
              background:   'var(--accent-soft)',
              border:       '1px solid var(--accent-line)',
              borderRadius: 18,
              color:        'var(--accent)',
              display:      'inline-flex',
              padding:      18
            } }
          >
            <svg
              fill="none"
              height="40"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.6"
              viewBox="0 0 24 24"
              width="40"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3.5 2" />
              <path d="M19.5 8.5 18 9.5M4.5 8.5 6 9.5M19.5 15.5 18 14.5M4.5 15.5 6 14.5" />
            </svg>
          </div>
          <h1
            data-testid="welcome-title"
            style={ { fontSize: 28, fontWeight: 600, letterSpacing: '-.01em', margin: '20px 0 8px' } }
          >
            Welcome to <span style={ { color: 'var(--accent)' } }>TorquePro Assistant</span>
          </h1>
          <p className="muted" style={ { fontSize: 14, lineHeight: 1.55, margin: 0 } }>
            A desktop companion for your Torque Pro CSV logs.
            <br />
            Fast, local-first, built for tinkerers. Let&rsquo;s set things up.
          </p>
        </div>

        <div
          data-testid="welcome-steps"
          style={ {
            display:             'grid',
            gap:                 12,
            gridTemplateColumns: '1fr 1fr 1fr',
            marginBottom:        28
          } }
        >
          <Step
            detail="So we can decode logs and calibrate units."
            label="Add a vehicle"
            n={ 1 }
          />
          <Step
            detail="Drop a Torque Pro CSV export. Parsing stays on-device."
            label="Import your first log"
            n={ 2 }
          />
          <Step
            detail="Charts, GPS, hot spots — and side-by-side compare."
            label="Explore the session"
            n={ 3 }
          />
        </div>

        <div className="row" style={ { gap: 10, justifyContent: 'center', marginBottom: 24 } }>
          <button
            className="btn primary"
            data-testid="welcome-add-vehicle-button"
            onClick={ () => navigate('/vehicle/setup') }
            type="button"
          >
            { Icons.plus }
            <span>Add a vehicle to get started</span>
          </button>
          <button
            className="btn ghost"
            data-testid="welcome-skip-button"
            onClick={ () => navigate('/import') }
            type="button"
          >
            I&rsquo;ll do this later
          </button>
        </div>

        <div
          className="dim"
          data-testid="welcome-footer-meta"
          style={ { fontSize: 11, marginBottom: 18, textAlign: 'center' } }
        >
          v0.4.2 · No account required · Logs never leave your machine
        </div>

        <div
          className="card"
          data-testid="welcome-sample-card"
          style={ { background: 'var(--bg-2)', padding: 16 } }
        >
          <div className="row" style={ { justifyContent: 'space-between', marginBottom: 10 } }>
            <div style={ { fontSize: 12, fontWeight: 500 } }>Looking for a sample to play with?</div>
            <a
              className="btn ghost sm"
              data-testid="welcome-sample-download-button"
              download="sample-torque-export.csv"
              href="./sample-torque-export.csv"
              style={ { textDecoration: 'none' } }
            >
              <span>Download sample.csv</span>
            </a>
          </div>
          <div className="dim" style={ { fontSize: 11, lineHeight: 1.55 } }>
            We can load a 12-minute demo session (city + highway, ~720 rows). It works without
            adding a vehicle and gives you a tour of every chart, the GPS map, and the compare view.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
