import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { Icons } from 'components/app/icons';
import Alert from 'components/primitives/alert';
import {
  adapterPairing,
  type PairingStage,
  type PairingState,
  subscribeToAdapterPairing,
  toast
} from 'utils';

import {
  HEALTHY_PROBE,
  MOCK_DEVICES,
  type MockDevice,
  NO_PROTOCOL_PROBE,
  type ProbeLine,
  rssiBars
} from './utils';

import styles from './index.module.scss';

/** Stage labels in display order. Index drives the stepper highlight. */
const STEP_LABELS: readonly string[] = ['Scan', 'Pair', 'Probe', 'Done'];

const stageIndex = (stage: ModalStage): number => {
  if (stage === 'scan') return 0;
  if (stage === 'pair' || stage === 'pair-confirmed') return 1;
  if (stage === 'probe') return 2;
  return 3;
};

/** Internal stage machine — superset of the controller's `PairingStage`
 *  with `pair-confirmed` as an intermediate state shown between user
 *  confirmation and the probe terminal lighting up. */
type ModalStage =
  | 'done'
  | 'pair'
  | 'pair-confirmed'
  | 'probe'
  | 'scan';

interface Props {
  readonly testId?: string;
}

interface Bars {
  readonly count: number;
  readonly testId?: string;
}

/** Tiny 4-slot RSSI bar indicator. Slots fill from the bottom; signal
 *  strength buckets defined in `rssiBars`. */
function RssiBars({ count, testId }: Bars) {
  return (
    <span className={ styles['rssi-bars'] } data-testid={ testId }>
      { [1, 2, 3, 4].map((slot) => (
        <i
          key={ slot }
          className={ slot <= count ? 'on' : undefined }
          style={ { height: 4 + slot * 2 } }
        />
      )) }
    </span>
  );
}

/**
 * OBD-II Bluetooth adapter pairing modal — opened imperatively via the
 * `adapterPairing()` controller. Four-stage flow (Scan → Pair → Probe
 * → Done) with three failure variants (no adapters / pair failed /
 * connected-but-no-protocol), all surfaced via the shared `<Alert>`
 * primitive.
 *
 * Real Bluetooth discovery isn't wired yet — the scan + probe stages
 * stream through fixed mock data + scripted AT-command lines on
 * timers. Once an Electron bridge for `noble` / native BT lands, the
 * timers swap for IPC subscriptions.
 *
 * Lives as the App-shell host: subscribes to the controller's
 * `subscribeToAdapterPairing`, keys its modal node off the `instance`
 * counter so every open is a fresh React mount (no stage / picked /
 * progress bleed-over).
 *
 * @returns A portal-rendered modal element, or `null` when closed.
 */
function AdapterPairing({ testId }: Props) {
  const [state, setState] = useState<PairingState>(null);

  useEffect(() => subscribeToAdapterPairing(setState), []);

  if (state === null) return null;

  /** Fragment-wrap so the returned `ReactPortal` lines up with the
   *  ambient `ReactNode` type. (react-dom and react ship slightly
   *  different `ReactPortal` definitions in this dep graph.) */
  return (
    <>
      { createPortal(
        <PairingModal
          key={ state.instance }
          initialStage={ state.stage }
          onClose={ adapterPairing.close }
          testId={ testId }
        />,
        document.body
      ) }
    </>
  );
}

interface ModalProps {
  readonly initialStage: PairingStage;
  readonly onClose: () => void;
  readonly testId?: string;
}

function PairingModal({ initialStage, onClose, testId }: ModalProps) {
  const seeded = initialStage === 'scan' || initialStage === 'no-adapters' ? null : MOCK_DEVICES[0];

  const [stage, setStage] = useState<ModalStage>(() => {
    if (initialStage === 'no-adapters') return 'scan';
    if (initialStage === 'failed') return 'pair';
    if (initialStage === 'no-protocol') return 'probe';
    return initialStage;
  });
  const [picked, setPicked] = useState<MockDevice | null>(seeded);
  const [trust, setTrust] = useState(true);
  const [scanFail, setScanFail] = useState(initialStage === 'no-adapters');
  const [pairFail, setPairFail] = useState(initialStage === 'failed');
  const [noProtocol, setNoProtocol] = useState(initialStage === 'no-protocol');
  const [scanProgress, setScanProgress] = useState(initialStage === 'scan' ? 0 : 100);
  const [probeLines, setProbeLines] = useState<readonly ProbeLine[]>([]);

  /** Esc anywhere closes the modal — matches the design's behavior. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  /**
   * Scan stage — tick a fake progress bar.
   *
   * The progress state stays a controlled counter inside the interval
   * callback. The functional updater means React batches each tick
   * naturally, and the interval clears itself once we hit 100. We never
   * reset the counter inside the effect body because the modal mounts
   * fresh on each open (the host keys off the controller's `instance`),
   * so initial state is always 0 / 100 per `useState`'s lazy initializer.
   */
  useEffect(() => {
    if (stage !== 'scan' || scanFail) return undefined;
    const handle = window.setInterval(() => {
      setScanProgress((value) => {
        const next = Math.min(100, value + 6 + Math.random() * 10);
        if (next >= 100) window.clearInterval(handle);
        return next;
      });
    }, 220);
    return () => window.clearInterval(handle);
  }, [stage, scanFail]);

  /** Probe stage — stream the scripted AT-command lines into the
   *  terminal, picking the healthy or no-protocol script based on the
   *  failure flag. */
  useEffect(() => {
    if (stage !== 'probe') return undefined;
    const script = noProtocol ? NO_PROTOCOL_PROBE : HEALTHY_PROBE;
    let index = 0;
    const handle = window.setInterval(() => {
      if (index >= script.length) {
        window.clearInterval(handle);
        return;
      }
      const nextLine = script[index];
      index += 1;
      setProbeLines((previous) => [...previous, nextLine]);
    }, 320);
    return () => window.clearInterval(handle);
  }, [stage, noProtocol]);

  const visibleDevices = scanProgress > 12
    ? MOCK_DEVICES.slice(0, Math.min(MOCK_DEVICES.length, Math.floor(scanProgress / 18) + 1))
    : [];

  const handleConfirmPair = (): void => {
    setStage('pair-confirmed');
    /** Real pairing would await a Bluetooth bond; fake the wait with a
     *  short timeout, then either fail or proceed to probe. */
    window.setTimeout(() => {
      if (pairFail) return;
      setStage('probe');
    }, 600);
  };

  const handleFinish = (): void => {
    if (picked !== null) {
      toast.success('Adapter connected', {
        subtitle: `${ picked.vendor } · ${ picked.name } · ${ picked.chip === 'stn1170' ? 'STN1170' : 'ELM327' } v${ picked.firmware }`
      });
    }
    onClose();
  };

  const currentStep = stageIndex(stage);

  return (
    <div
      aria-modal="true"
      className={ styles.backdrop }
      data-testid={ testId }
      onMouseDown={ (event) => {
        if (event.target === event.currentTarget) onClose();
      } }
      role="dialog"
    >
      <div className={ styles.modal } data-testid={ testId === undefined ? undefined : `${ testId }-modal` }>
        {/* ── Header ── */}
        <div className={ styles.header }>
          <span className={ styles['header-icon'] }>{ Icons.vehicle }</span>
          <div style={ { flex: 1 } }>
            <div className={ styles['header-title'] }>Pair OBD-II adapter</div>
            <div className={ styles['header-sub'] }>
              A one-time setup. After pairing, TorquePro Assistant talks to any vehicle you plug this adapter into.
            </div>
          </div>
          <button
            aria-label="Close"
            className={ styles['close-button'] }
            data-testid={ testId === undefined ? undefined : `${ testId }-close` }
            onClick={ onClose }
            type="button"
          >
            { Icons.cross }
          </button>
        </div>

        {/* ── Stepper ── */}
        <div className={ styles.stepper } data-testid={ testId === undefined ? undefined : `${ testId }-stepper` }>
          { STEP_LABELS.map((label, index) => {
            const status = index < currentStep ? 'done' : index === currentStep ? 'active' : 'pending';
            const stepClass = status === 'active' ? `${ styles.step } ${ styles['step-active'] }` : status === 'done' ? `${ styles.step } ${ styles['step-done'] }` : styles.step;
            return (
              <div
                key={ label }
                className={ stepClass }
                data-testid={ testId === undefined ? undefined : `${ testId }-step-${ label.toLowerCase() }` }
              >
                <span className={ styles['step-dot'] }>{ status === 'done' ? Icons.check : index + 1 }</span>
                <span className={ styles['step-label'] }>{ label }</span>
                { index < 3 && <span className={ styles['step-line'] } /> }
              </div>
            );
          }) }
        </div>

        {/* ── Body ── */}
        <div className={ styles.body }>
          { stage === 'scan' && !scanFail && (
            <ScanStage
              onCancel={ onClose }
              onContinue={ () => setStage('pair') }
              onPick={ setPicked }
              onStop={ () => setScanFail(true) }
              picked={ picked }
              progress={ scanProgress }
              testId={ testId }
              visibleDevices={ visibleDevices }
            />
          ) }

          { stage === 'scan' && scanFail && (
            <ScanFailStage
              onCancel={ onClose }
              onRetry={ () => setScanFail(false) }
              testId={ testId }
            />
          ) }

          { stage === 'pair' && picked !== null && (
            <PairStage
              failed={ pairFail }
              onBack={ () => setStage('scan') }
              onCancel={ onClose }
              onConfirm={ handleConfirmPair }
              onRetry={ () => { setPairFail(false); handleConfirmPair(); } }
              onToggleTrust={ () => setTrust(!trust) }
              picked={ picked }
              testId={ testId }
              trust={ trust }
            />
          ) }

          { stage === 'pair-confirmed' && picked !== null && (
            <div data-testid={ testId === undefined ? undefined : `${ testId }-pair-confirmed` } style={ { padding: '32px 0', textAlign: 'center' } }>
              <div className={ styles['title-sm'] }>Pairing with { picked.name }…</div>
              <div className="dim mono" style={ { fontSize: 11, marginTop: 4 } }>Exchanging keys</div>
            </div>
          ) }

          { stage === 'probe' && picked !== null && (
            <ProbeStage
              noProtocol={ noProtocol }
              onBack={ () => setStage('pair') }
              onCancel={ onClose }
              onContinue={ () => setStage('done') }
              onRetry={ () => setNoProtocol(false) }
              probeLines={ probeLines }
              testId={ testId }
            />
          ) }

          { stage === 'done' && picked !== null && (
            <DoneStage
              onClose={ onClose }
              onFinish={ handleFinish }
              picked={ picked }
              testId={ testId }
            />
          ) }
        </div>
      </div>
    </div>
  );
}

interface ScanStageProps {
  readonly onCancel: () => void;
  readonly onContinue: () => void;
  readonly onPick: (device: MockDevice) => void;
  readonly onStop: () => void;
  readonly picked: MockDevice | null;
  readonly progress: number;
  readonly testId?: string;
  readonly visibleDevices: readonly MockDevice[];
}

function ScanStage({ onCancel, onContinue, onPick, onStop, picked, progress, testId, visibleDevices }: ScanStageProps) {
  return (
    <>
      <div className={ styles['scan-head'] }>
        <span className={ styles.spinner } />
        <div>
          <div className={ styles['title-sm'] }>Searching for nearby adapters…</div>
          <div
            className="dim mono"
            data-testid={ testId === undefined ? undefined : `${ testId }-scan-progress` }
            style={ { fontSize: 11, marginTop: 2 } }
          >
            Bluetooth scan · { Math.round(progress) }% · { visibleDevices.length } found
          </div>
        </div>
        <div style={ { flex: 1 } } />
        <button
          className="btn ghost sm"
          data-testid={ testId === undefined ? undefined : `${ testId }-scan-stop` }
          onClick={ onStop }
          type="button"
        >
          { Icons.cross }<span>Stop</span>
        </button>
      </div>
      <div className={ styles['device-list'] } data-testid={ testId === undefined ? undefined : `${ testId }-device-list` }>
        { visibleDevices.map((device) => {
          const selected = picked?.mac === device.mac;
          return (
            <button
              key={ device.mac }
              className={ selected ? styles['device-row-selected'] : styles['device-row'] }
              data-testid={ testId === undefined ? undefined : `${ testId }-device-${ device.mac }` }
              onClick={ () => onPick(device) }
              type="button"
            >
              <RssiBars count={ rssiBars(device.rssi) } />
              <div className={ styles['device-name'] }>
                <div>{ device.name }</div>
                <div className={ styles['device-meta'] }>{ device.mac } · { device.vendor }</div>
              </div>
              <span className="pill amber"><i className="dot" />{ device.chip === 'stn1170' ? 'STN1170' : 'ELM327' } v{ device.firmware }</span>
              <span className={ styles['device-rssi'] }>{ device.rssi } dBm</span>
            </button>
          );
        }) }
        { progress < 100 && (
          <div className={ styles['searching-row'] }>
            <span className={ styles['spinner-sm'] } />
            <span className="dim" style={ { fontSize: 12 } }>Scanning channels 1-79…</span>
          </div>
        ) }
      </div>
      <div className={ styles.foot }>
        <span className="dim" style={ { fontSize: 11, marginRight: 'auto' } }>
          Make sure the adapter is plugged in and ignition is on accessory.
        </span>
        <button className="btn ghost" onClick={ onCancel } type="button">Cancel</button>
        <button
          className="btn primary"
          data-testid={ testId === undefined ? undefined : `${ testId }-scan-continue` }
          disabled={ picked === null }
          onClick={ onContinue }
          type="button"
        >
          { Icons.chevRight }<span>Continue{ picked !== null ? ` with ${ picked.name }` : '' }</span>
        </button>
      </div>
    </>
  );
}

interface ScanFailProps {
  readonly onCancel: () => void;
  readonly onRetry: () => void;
  readonly testId?: string;
}

function ScanFailStage({ onCancel, onRetry, testId }: ScanFailProps) {
  return (
    <>
      <Alert
        subtitle={
          <>
            No ELM327-compatible devices responded in 12 seconds. Common fixes:
            <ul style={ { color: 'var(--text-2)', fontSize: 12, lineHeight: 1.6, margin: '10px 0 0 16px', padding: 0 } }>
              <li>Turn the ignition to <span className="mono" style={ { color: 'var(--text-1)' } }>ACC</span> or <span className="mono" style={ { color: 'var(--text-1)' } }>ON</span> so the OBD port has power.</li>
              <li>Re-seat the dongle in the OBD-II port — listen for the click.</li>
              <li>Pair the adapter in the OS Bluetooth settings if it needs a PIN (often <span className="mono">1234</span> or <span className="mono">0000</span>).</li>
              <li>Move within 3 m of the vehicle; Bluetooth 2.0 dongles drop off fast.</li>
            </ul>
          </>
        }
        testId={ testId === undefined ? undefined : `${ testId }-no-adapters` }
        title="No adapters found"
        variant="warn"
      />
      <div className={ styles.foot }>
        <span style={ { flex: 1 } } />
        <button className="btn ghost" onClick={ onCancel } type="button">Cancel</button>
        <button
          className="btn primary"
          data-testid={ testId === undefined ? undefined : `${ testId }-scan-retry` }
          onClick={ onRetry }
          type="button"
        >
          { Icons.reset }<span>Scan again</span>
        </button>
      </div>
    </>
  );
}

interface PairStageProps {
  readonly failed: boolean;
  readonly onBack: () => void;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly onRetry: () => void;
  readonly onToggleTrust: () => void;
  readonly picked: MockDevice;
  readonly testId?: string;
  readonly trust: boolean;
}

function PairStage({ failed, onBack, onCancel, onConfirm, onRetry, onToggleTrust, picked, testId, trust }: PairStageProps) {
  return (
    <>
      <div className="row" style={ { alignItems: 'flex-start', gap: 14, marginBottom: 14 } }>
        <span className={ styles['header-icon'] } style={ { borderRadius: 14, flex: '0 0 54px', height: 54, width: 54 } }>{ Icons.vehicle }</span>
        <div style={ { flex: 1 } }>
          <div style={ { color: 'var(--text-0)', fontSize: 16, fontWeight: 600 } }>{ picked.name }</div>
          <div className="dim mono" style={ { fontSize: 11, marginTop: 3 } }>{ picked.vendor } · { picked.mac }</div>
        </div>
        <span className="pill amber"><i className="dot" />{ picked.chip === 'stn1170' ? 'STN1170' : 'ELM327' } v{ picked.firmware }</span>
      </div>

      <div className={ styles['kv-grid'] }>
        <span className={ styles['kv-key'] }>Bluetooth class</span>
        <span className={ styles['kv-value'] }>Serial Port Profile (SPP)</span>
        <span className={ styles['kv-key'] }>Signal</span>
        <span className={ styles['kv-value'] }>
          { picked.rssi } dBm ·{ ' ' }
          <span style={ { color: rssiBars(picked.rssi) >= 3 ? 'var(--ok)' : 'var(--warn)' } }>
            { rssiBars(picked.rssi) >= 3 ? 'good' : 'fair' }
          </span>
        </span>
        <span className={ styles['kv-key'] }>Encryption</span>
        <span className={ styles['kv-value'] }>PIN authentication</span>
        <span className={ styles['kv-key'] }>Last seen by OS</span>
        <span className={ styles['kv-value'] }>Never — new device</span>
      </div>

      <button
        className={ styles['trust-row'] }
        data-testid={ testId === undefined ? undefined : `${ testId }-trust-row` }
        onClick={ onToggleTrust }
        style={ { textAlign: 'left', width: '100%' } }
        type="button"
      >
        <span
          className={ trust ? styles['checkbox-on'] : styles.checkbox }
          data-testid={ testId === undefined ? undefined : `${ testId }-trust-checkbox` }
        />
        <div style={ { flex: 1 } }>
          <div style={ { color: 'var(--text-0)', fontSize: 13 } }>Trust this adapter</div>
          <div className="dim" style={ { fontSize: 11, marginTop: 2 } }>
            Auto-reconnect when in range. Skip the confirmation next time.
          </div>
        </div>
      </button>

      { failed && (
        <div style={ { marginTop: 12 } }>
          <Alert
            detail={ `btle_pair_request → 0x0E (Pairing Not Allowed)\npeer = ${ picked.mac }  agent = io.bluetooth.pair  timeout = 8000ms` }
            subtitle="Adapter accepted the connection but refused the pairing key. The device may be paired to another phone or laptop — un-pair it there first."
            testId={ testId === undefined ? undefined : `${ testId }-pair-failed` }
            title="Pairing failed"
            variant="danger"
          />
        </div>
      ) }

      <div className={ styles.foot }>
        <button
          className="btn ghost"
          data-testid={ testId === undefined ? undefined : `${ testId }-pair-back` }
          onClick={ onBack }
          type="button"
        >
          ← Back to scan
        </button>
        <span style={ { flex: 1 } } />
        <button className="btn ghost" onClick={ onCancel } type="button">Cancel</button>
        { failed
          ? (
            <button
              className="btn primary"
              data-testid={ testId === undefined ? undefined : `${ testId }-pair-retry` }
              onClick={ onRetry }
              type="button"
            >
              { Icons.reset }<span>Try pairing again</span>
            </button>
          )
          : (
            <button
              className="btn primary"
              data-testid={ testId === undefined ? undefined : `${ testId }-pair-confirm` }
              onClick={ onConfirm }
              type="button"
            >
              { Icons.check }<span>Pair adapter</span>
            </button>
          ) }
      </div>
    </>
  );
}

interface ProbeStageProps {
  readonly noProtocol: boolean;
  readonly onBack: () => void;
  readonly onCancel: () => void;
  readonly onContinue: () => void;
  readonly onRetry: () => void;
  readonly probeLines: readonly ProbeLine[];
  readonly testId?: string;
}

function KIND_ICON(kind: ProbeLine['kind']): React.ReactNode {
  if (kind === 'ok')   return <span style={ { color: 'var(--ok)' } }>{ Icons.check }</span>;
  if (kind === 'warn') return <span style={ { color: 'var(--warn)' } }>{ Icons.warn }</span>;
  return <span style={ { color: 'var(--danger)' } }>{ Icons.cross }</span>;
}

function ProbeStage({ noProtocol, onBack, onCancel, onContinue, onRetry, probeLines, testId }: ProbeStageProps) {
  const totalLines = noProtocol ? NO_PROTOCOL_PROBE.length : HEALTHY_PROBE.length;
  const complete = probeLines.length >= totalLines;
  return (
    <>
      <div className="row" style={ { alignItems: 'center', gap: 10, marginBottom: 12 } }>
        <span className="pill ok"><i className="dot" />paired</span>
        <span className="dim" style={ { fontSize: 12 } }>
          Now probing the vehicle — this asks the ECU what it supports.
        </span>
        <div style={ { flex: 1 } } />
        <span
          className="dim mono"
          data-testid={ testId === undefined ? undefined : `${ testId }-probe-progress` }
          style={ { fontSize: 11 } }
        >
          { probeLines.length }/{ totalLines } commands
        </span>
      </div>

      <div className={ styles.terminal } data-testid={ testId === undefined ? undefined : `${ testId }-probe-terminal` }>
        { probeLines.map((line, index) => {
          const kindClass = line.kind === 'err' ? styles['probe-line-err'] : line.kind === 'warn' ? styles['probe-line-warn'] : '';
          return (
            <div key={ index } className={ `${ styles['probe-line'] } ${ kindClass }` }>
              <span className="dim mono">{ '>' }</span>
              <span className={ styles['probe-line-cmd'] }>{ line.tx }</span>
              <span className={ styles['probe-line-resp'] }>{ line.response }</span>
              <span className={ styles['probe-line-status'] }>{ KIND_ICON(line.kind) }</span>
            </div>
          );
        }) }
        { !complete && (
          <div className={ styles['probe-line'] }>
            <span className={ styles['cursor-block'] } />
          </div>
        ) }
      </div>

      { complete && !noProtocol && (
        <div className={ styles['probe-summary'] }>
          <ProbeSummaryRow label="Adapter firmware" value="ELM327 v1.5" />
          <ProbeSummaryRow label="Protocol" value="ISO 15765-4 · CAN 11-bit · 500 kbps" />
          <ProbeSummaryRow label="Supported PIDs" value="34 of 99 detected · core set + manufacturer" />
          <ProbeSummaryRow label="VIN" mono value="WDD2J6BB0KA000000" />
          <ProbeSummaryRow label="ECU response time" value="42 ms avg · 110 ms max" />
        </div>
      ) }

      { complete && noProtocol && (
        <Alert
          actions={
            <>
              <button
                className="btn primary sm"
                data-testid={ testId === undefined ? undefined : `${ testId }-probe-retry` }
                onClick={ onRetry }
                type="button"
              >
                { Icons.reset }<span>Probe again</span>
              </button>
              <button className="btn sm" type="button">
                { Icons.settings }<span>Force protocol…</span>
              </button>
            </>
          }
          subtitle={
            <>
              The adapter paired fine and acknowledges <span className="mono" style={ { color: 'var(--text-1)' } }>ATZ</span>, but the ECU returned <span className="mono" style={ { color: 'var(--text-1)' } }>NO DATA</span> to <span className="mono" style={ { color: 'var(--text-1)' } }>0100</span>. Usually means the ignition is off, the OBD bus is in sleep mode, or this adapter doesn&apos;t speak this vehicle&apos;s protocol.
            </>
          }
          testId={ testId === undefined ? undefined : `${ testId }-no-protocol` }
          title="Connected, but the vehicle isn't responding"
          variant="warn"
        />
      ) }

      <div className={ styles.foot }>
        <button className="btn ghost" onClick={ onBack } type="button">← Back</button>
        <span style={ { flex: 1 } } />
        <button className="btn ghost" onClick={ onCancel } type="button">Skip for now</button>
        <button
          className="btn primary"
          data-testid={ testId === undefined ? undefined : `${ testId }-probe-continue` }
          disabled={ !complete || noProtocol }
          onClick={ onContinue }
          type="button"
        >
          { Icons.check }<span>Looks good — continue</span>
        </button>
      </div>
    </>
  );
}

interface ProbeSummaryRowProps {
  readonly label: string;
  readonly mono?: boolean;
  readonly value: string;
}

function ProbeSummaryRow({ label, mono = false, value }: ProbeSummaryRowProps) {
  return (
    <div className={ styles['probe-summary-row'] }>
      <span className="dim">{ label }</span>
      <span className={ mono ? 'mono' : undefined } style={ { color: 'var(--text-0)' } }>{ value }</span>
      <span style={ { color: 'var(--ok)', display: 'inline-flex', height: 14, width: 14 } }>{ Icons.check }</span>
    </div>
  );
}

interface DoneStageProps {
  readonly onClose: () => void;
  readonly onFinish: () => void;
  readonly picked: MockDevice;
  readonly testId?: string;
}

function DoneStage({ onClose, onFinish, picked, testId }: DoneStageProps) {
  return (
    <div className={ styles['done-pane'] } data-testid={ testId === undefined ? undefined : `${ testId }-done` }>
      <div className={ styles['done-check'] }>{ Icons.check }</div>
      <div className={ styles['done-title'] }>Adapter paired and probed</div>
      <div className={ styles['done-sub'] }>
        { picked.vendor } · { picked.name } · { picked.chip === 'stn1170' ? 'STN1170' : 'ELM327' } v{ picked.firmware } · trusted for auto-reconnect.
      </div>

      <div className={ styles['kv-grid'] } style={ { marginBottom: 16, marginTop: 18 } }>
        <span className={ styles['kv-key'] }>Adapter</span>
        <span className={ styles['kv-value'] }>{ picked.name } ({ picked.mac })</span>
        <span className={ styles['kv-key'] }>Protocol</span>
        <span className={ styles['kv-value'] }>ISO 15765-4 CAN · 500 kbps</span>
        <span className={ styles['kv-key'] }>Reported VIN</span>
        <span className={ styles['kv-value'] } style={ { color: 'var(--accent)' } }>WDD2J6BB0KA000000</span>
        <span className={ styles['kv-key'] }>Decoded</span>
        <span style={ { color: 'var(--text-0)' } }>2019 Mercedes-Benz AMG GT 53</span>
      </div>

      <div className={ styles.suggestion }>
        <span className={ styles['suggestion-icon'] }>{ Icons.vehicle }</span>
        <div style={ { flex: 1, textAlign: 'left' } }>
          <div style={ { color: 'var(--text-0)', fontSize: 13, fontWeight: 600 } }>Use this VIN for a new vehicle profile?</div>
          <div className="dim" style={ { fontSize: 11, marginTop: 2 } }>Prefills year / make / model and unlocks calibrated PIDs.</div>
        </div>
        <button className="btn primary sm" type="button">{ Icons.plus }<span>Set up vehicle</span></button>
      </div>

      <div className={ styles.foot }>
        <button className="btn ghost" onClick={ onClose } type="button">Done</button>
        <span style={ { flex: 1 } } />
        <button
          className="btn primary"
          data-testid={ testId === undefined ? undefined : `${ testId }-done-finish` }
          onClick={ onFinish }
          type="button"
        >
          { Icons.check }<span>Finish &amp; close</span>
        </button>
      </div>
    </div>
  );
}

export default AdapterPairing;
