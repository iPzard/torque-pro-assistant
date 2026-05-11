/* adapter-pairing.jsx — OBD-II Bluetooth adapter pairing modal

   Stages: scan → pair → probe → done
   Failures: no-adapters, failed, no-protocol

   Open via: window.openAdapterPairing(initialStage?)
*/

const { useState: useAP, useEffect: useAPEffect, useRef: useAPRef } = React;

const _apListeners = new Set();
let _apOpen = null;     // null | { stage: string, instance: number }
let _apInstance = 0;
function _apEmit() { _apListeners.forEach((fn) => fn(_apOpen)); }
window.openAdapterPairing = (stage = "scan") => { _apOpen = { stage, instance: ++_apInstance }; _apEmit(); };
window.closeAdapterPairing = () => { _apOpen = null; _apEmit(); };

const MOCK_DEVICES = [
  { name: "OBDII",            mac: "00:1D:A5:68:98:8B", rssi: -42, vendor: "Veepeak Mini",      kind: "elm327", v: "1.5" },
  { name: "BAFX Products 34t5",mac: "88:6B:0F:3C:1A:09", rssi: -61, vendor: "BAFX",              kind: "elm327", v: "1.5" },
  { name: "OBDLink MX+",      mac: "00:04:3E:7A:11:42", rssi: -55, vendor: "OBDLink",           kind: "stn1170", v: "4.5.3" },
  { name: "Carista",          mac: "30:14:08:14:8E:22", rssi: -73, vendor: "Carista",           kind: "elm327", v: "2.1" },
  { name: "iCar Pro",         mac: "A4:34:F1:09:55:7B", rssi: -82, vendor: "Vgate",             kind: "elm327", v: "2.2" },
];

function rssiBars(r) {
  if (r > -55) return 4;
  if (r > -65) return 3;
  if (r > -75) return 2;
  return 1;
}
function Bars({ n }) {
  return (
    <span className="rssi-bars" aria-label={`${n} of 4 bars`}>
      {[1,2,3,4].map((i) => (
        <i key={i} className={i <= n ? "on" : ""} style={{height: 4 + i*2}}/>
      ))}
    </span>
  );
}

function AdapterPairingModal({ onClose }) {
  const [stage, setStage] = useAP("scan");
  const [picked, setPicked] = useAP(null);     // device
  const [trust, setTrust] = useAP(true);
  const [scanFail, setScanFail] = useAP(false);
  const [pairFail, setPairFail] = useAP(false);
  const [noProto, setNoProto] = useAP(false);
  const [scanProgress, setScanProgress] = useAP(0);
  const [pairProgress, setPairProgress] = useAP(0);
  const [probeLines, setProbeLines] = useAP([]);

  // Allow caller to set initial stage. Seed `picked` for any stage past scan,
  // since the Pair/Probe/Done bodies are gated on a selected device.
  useAPEffect(() => {
    if (_apOpen && _apOpen.stage) {
      const s = _apOpen.stage;
      if (s === "no-adapters") { setStage("scan"); setScanFail(true); }
      else if (s === "failed") { setStage("pair"); setPicked(MOCK_DEVICES[0]); setPairFail(true); }
      else if (s === "no-protocol") { setStage("probe"); setPicked(MOCK_DEVICES[0]); setNoProto(true); }
      else if (s === "pair" || s === "probe" || s === "done") {
        setPicked(MOCK_DEVICES[0]);
        setStage(s);
      }
      else { setStage(s); }
    }
  }, []);

  // Scan progress
  useAPEffect(() => {
    if (stage !== "scan" || scanFail) return;
    setScanProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p = Math.min(100, p + 6 + Math.random() * 10);
      setScanProgress(p);
      if (p >= 100) clearInterval(t);
    }, 220);
    return () => clearInterval(t);
  }, [stage, scanFail]);

  // Pair progress
  useAPEffect(() => {
    if (stage !== "pair" || pairFail || !picked) return;
    let cancelled = false;
    setPairProgress(0);
    const start = Date.now();
    const tick = () => {
      if (cancelled) return;
      const t = Math.min(1, (Date.now() - start) / 1800);
      setPairProgress(t * 100);
      if (t < 1) requestAnimationFrame(tick);
      else setTimeout(() => !cancelled && setStage("probe"), 350);
    };
    // Only auto-progress after the user confirms — guarded by a separate trigger.
    return () => { cancelled = true; };
  }, [stage]);

  // Probe stream
  useAPEffect(() => {
    if (stage !== "probe") return;
    const lines = [
      { t: "ATZ", r: "ELM327 v1.5", kind: "ok" },
      { t: "ATE0", r: "OK", kind: "ok" },
      { t: "ATSP0", r: "OK", kind: "ok" },
      { t: "0100", r: noProto ? "NO DATA" : "41 00 BE 3F A8 13", kind: noProto ? "err" : "ok" },
      { t: "ATDP", r: noProto ? "AUTO" : "ISO 15765-4 (CAN 11/500)", kind: noProto ? "warn" : "ok" },
      { t: "0902", r: noProto ? "NO DATA" : "49 02 01 57 44 44 32 4A 36 42 42 30 4B 41", kind: noProto ? "err" : "ok" },
    ];
    setProbeLines([]);
    let i = 0;
    const t = setInterval(() => {
      if (i >= lines.length) { clearInterval(t); return; }
      setProbeLines((p) => [...p, lines[i++]]);
    }, 320);
    return () => clearInterval(t);
  }, [stage, noProto]);

  useAPEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const visibleDevices = scanProgress > 12 ? MOCK_DEVICES.slice(0, Math.min(MOCK_DEVICES.length, Math.floor(scanProgress / 18) + 1)) : [];

  function confirmPair() {
    setStage("pair-confirmed");
    setPairProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p = Math.min(100, p + 8 + Math.random() * 14);
      setPairProgress(p);
      if (p >= 100) {
        clearInterval(t);
        setTimeout(() => {
          if (pairFail) { /* stays on pair-confirmed which renders failed */ }
          else setStage("probe");
        }, 250);
      }
    }, 90);
  }

  function finish() {
    window.toast && window.toast.success("Adapter connected", {
      subtitle: `${picked.vendor} · ${picked.name} · ELM327 v${picked.v}`,
      action: { label: "Set up vehicle", onClick: () => {} },
    });
    onClose();
  }

  const stepIndex = (() => {
    if (stage === "scan") return 0;
    if (stage === "pair" || stage === "pair-confirmed") return 1;
    if (stage === "probe") return 2;
    return 3;
  })();

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal pairing-modal">
        <div className="pairing-h">
          <div className="row" style={{gap: 12}}>
            <span className="icon-circle">{I.vehicle}</span>
            <div>
              <div className="title">Pair OBD-II adapter</div>
              <div className="sub">A one-time setup. After pairing, TorquePro Assistant talks to any vehicle you plug this adapter into.</div>
            </div>
          </div>
          <button className="banner-close" onClick={onClose} aria-label="Close">{I.cross}</button>
        </div>

        <div className="pairing-stepper">
          {["Scan", "Pair", "Probe", "Done"].map((label, i) => (
            <div key={label} className={"step " + (i < stepIndex ? "done" : i === stepIndex ? "active" : "")}>
              <span className="step-dot">{i < stepIndex ? I.check : i + 1}</span>
              <span className="step-label">{label}</span>
              {i < 3 && <span className="step-line"/>}
            </div>
          ))}
        </div>

        <div className="pairing-body">
          {stage === "scan" && !scanFail && (
            <>
              <div className="scan-head">
                <span className="scan-spinner"/>
                <div>
                  <div className="title-sm">Searching for nearby adapters…</div>
                  <div className="dim mono" style={{fontSize:11, marginTop:2}}>
                    Bluetooth scan · {Math.round(scanProgress)}% · {visibleDevices.length} found
                  </div>
                </div>
                <div className="right"/>
                <button className="btn ghost sm" onClick={() => { setScanFail(true); }}>{I.cross}<span>Stop</span></button>
              </div>
              <div className="device-list">
                {visibleDevices.map((d, i) => (
                  <button key={d.mac} className={"device-row" + (picked && picked.mac === d.mac ? " sel" : "")}
                          onClick={() => setPicked(d)} onDoubleClick={() => { setPicked(d); setStage("pair"); }}>
                    <Bars n={rssiBars(d.rssi)} />
                    <div className="device-name">
                      <div>{d.name}</div>
                      <div className="device-meta mono">{d.mac} · {d.vendor}</div>
                    </div>
                    <span className="pill amber"><i className="dot"/>{d.kind === "stn1170" ? "STN1170" : "ELM327"} v{d.v}</span>
                    <span className="device-rssi mono">{d.rssi} dBm</span>
                  </button>
                ))}
                {scanProgress < 100 && (
                  <div className="device-row searching">
                    <span className="scan-spinner sm"/>
                    <span className="dim" style={{fontSize:12}}>Scanning channels 1-79…</span>
                  </div>
                )}
              </div>
              <div className="pairing-foot">
                <span className="dim" style={{fontSize:11, marginRight:"auto"}}>Make sure the adapter is plugged in and ignition is on accessory.</span>
                <button className="btn ghost" onClick={onClose}>Cancel</button>
                <button className="btn primary" disabled={!picked} onClick={() => setStage("pair")}>
                  {I.chevRight}<span>Continue with {picked ? picked.name : "selection"}</span>
                </button>
              </div>
            </>
          )}

          {stage === "scan" && scanFail && (
            <>
              <div className="alert warn" style={{marginBottom: 14}}>
                <span className="alert-icon">{I.warn}</span>
                <div className="alert-body">
                  <div className="alert-title">No adapters found</div>
                  <div className="alert-sub">
                    No ELM327-compatible devices responded in 12 seconds. Common fixes:
                  </div>
                  <ul style={{margin: "10px 0 0 16px", padding: 0, color: "var(--text-2)", fontSize: 12, lineHeight: 1.6}}>
                    <li>Turn the ignition to <span className="mono" style={{color:"var(--text-1)"}}>ACC</span> or <span className="mono" style={{color:"var(--text-1)"}}>ON</span> so the OBD port has power.</li>
                    <li>Re-seat the dongle in the OBD-II port — listen for the click.</li>
                    <li>Pair the adapter in macOS Bluetooth settings first if it requires a PIN (often <span className="mono">1234</span> or <span className="mono">0000</span>).</li>
                    <li>Move within 3 m of the vehicle; Bluetooth 2.0 dongles drop off fast.</li>
                  </ul>
                </div>
              </div>
              <div className="pairing-foot">
                <span className="dim" style={{fontSize:11, marginRight:"auto"}}>Still nothing? You can <button className="link-btn">enter a MAC address manually</button>.</span>
                <button className="btn ghost" onClick={onClose}>Cancel</button>
                <button className="btn primary" onClick={() => { setScanFail(false); }}>{I.reset}<span>Scan again</span></button>
              </div>
            </>
          )}

          {stage === "pair" && picked && (
            <>
              <div className="row" style={{alignItems:"flex-start", gap: 14, marginBottom: 14}}>
                <span className="icon-circle" style={{width:54, height:54, flex:"0 0 54px", borderRadius:14, fontSize:0}}>
                  <span style={{width:24, height:24}}>{I.vehicle}</span>
                </span>
                <div style={{flex: 1}}>
                  <div style={{fontSize:16, fontWeight:600, color:"var(--text-0)"}}>{picked.name}</div>
                  <div className="dim mono" style={{fontSize:11, marginTop:3}}>{picked.vendor} · {picked.mac}</div>
                </div>
                <span className="pill amber"><i className="dot"/>{picked.kind === "stn1170" ? "STN1170" : "ELM327"} v{picked.v}</span>
              </div>

              <div className="key-value-grid">
                <span className="dim">Bluetooth class</span>
                <span className="mono">Serial Port Profile (SPP)</span>
                <span className="dim">Signal</span>
                <span className="mono">{picked.rssi} dBm · <span style={{color:rssiBars(picked.rssi) >= 3 ? "var(--ok)" : "var(--warn)"}}>{rssiBars(picked.rssi) >= 3 ? "good" : "fair"}</span></span>
                <span className="dim">Encryption</span>
                <span className="mono">PIN authentication</span>
                <span className="dim">Last seen by macOS</span>
                <span className="mono">Never — new device</span>
              </div>

              <label className="trust-row">
                <span className={"checkbox" + (trust ? " on" : "")} onClick={() => setTrust(!trust)} />
                <div style={{flex:1}}>
                  <div style={{fontSize:13, color:"var(--text-0)"}}>Trust this adapter</div>
                  <div className="dim" style={{fontSize:11, marginTop:2}}>Auto-reconnect when in range. Skip the confirmation next time.</div>
                </div>
              </label>

              {stage === "pair" && pairFail && (
                <div className="alert danger" style={{marginTop: 12}}>
                  <span className="alert-icon">{I.warn}</span>
                  <div className="alert-body">
                    <div className="alert-title">Pairing failed</div>
                    <div className="alert-sub">
                      Adapter accepted the connection but refused the pairing key. The device may be paired to another phone or laptop — un-pair it there first.
                    </div>
                    <div className="alert-detail">
{`btle_pair_request → 0x0E (Pairing Not Allowed)
peer = ${picked.mac}  agent = io.bluetooth.pair  timeout = 8000ms`}
                    </div>
                  </div>
                </div>
              )}

              <div className="pairing-foot">
                <button className="btn ghost" onClick={() => setStage("scan")}>← Back to scan</button>
                <div className="right"/>
                <button className="btn ghost" onClick={onClose}>Cancel</button>
                {!pairFail
                  ? <button className="btn primary" onClick={confirmPair}>{I.check}<span>Pair adapter</span></button>
                  : <button className="btn primary" onClick={() => { setPairFail(false); confirmPair(); }}>{I.reset}<span>Try pairing again</span></button>}
              </div>
            </>
          )}

          {stage === "pair-confirmed" && (
            <div className="probe-pane">
              <div className="title-sm">Pairing with {picked.name}…</div>
              <div className="dim mono" style={{fontSize:11, marginTop:4, marginBottom:14}}>Exchanging keys · {Math.round(pairProgress)}%</div>
              <div className="progressbar"><div style={{width: pairProgress + "%"}}/></div>
            </div>
          )}

          {stage === "probe" && picked && (
            <>
              <div className="row" style={{alignItems:"center", gap: 10, marginBottom: 12}}>
                <span className="pill ok"><i className="dot"/>paired</span>
                <span className="dim" style={{fontSize:12}}>Now probing the vehicle — this asks the ECU what it supports.</span>
                <div className="right"/>
                <span className="dim mono" style={{fontSize:11}}>{probeLines.length}/6 commands</span>
              </div>

              <div className="probe-terminal">
                {probeLines.map((l, i) => (
                  <div key={i} className={"probe-line " + l.kind}>
                    <span className="dim mono">{">"}</span>
                    <span className="mono cmd">{l.t}</span>
                    <span className="mono resp">{l.r}</span>
                    <span className="status">
                      {l.kind === "ok"   && <span style={{color:"var(--ok)"}}>{I.check}</span>}
                      {l.kind === "warn" && <span style={{color:"var(--warn)"}}>{I.warn}</span>}
                      {l.kind === "err"  && <span style={{color:"var(--danger)"}}>{I.cross}</span>}
                    </span>
                  </div>
                ))}
                {probeLines.length < 6 && <div className="probe-line"><span className="cursor"/></div>}
              </div>

              {probeLines.length >= 6 && !noProto && (
                <div className="probe-summary">
                  <ProbeRow label="Adapter firmware" v="ELM327 v1.5" ok />
                  <ProbeRow label="Protocol" v="ISO 15765-4 · CAN 11-bit · 500 kbps" ok />
                  <ProbeRow label="Supported PIDs" v="34 of 99 detected · core set + manufacturer" ok />
                  <ProbeRow label="VIN" v="WDD2J6BB0KA000000" mono ok />
                  <ProbeRow label="ECU response time" v="42 ms avg · 110 ms max" ok last />
                </div>
              )}

              {probeLines.length >= 6 && noProto && (
                <div className="alert warn" style={{marginTop: 4}}>
                  <span className="alert-icon">{I.warn}</span>
                  <div className="alert-body">
                    <div className="alert-title">Connected, but the vehicle isn’t responding</div>
                    <div className="alert-sub">
                      The adapter paired fine and acknowledges <span className="mono" style={{color:"var(--text-1)"}}>ATZ</span>, but the ECU returned <span className="mono" style={{color:"var(--text-1)"}}>NO DATA</span> to <span className="mono" style={{color:"var(--text-1)"}}>0100</span>. Usually means the ignition is off, the OBD bus is in sleep mode, or this adapter doesn’t speak this vehicle’s protocol.
                    </div>
                    <div className="alert-actions">
                      <button className="btn primary sm" onClick={() => { setNoProto(false); }}>{I.reset}<span>Probe again</span></button>
                      <button className="btn sm">{I.settings}<span>Force protocol…</span></button>
                    </div>
                  </div>
                </div>
              )}

              <div className="pairing-foot">
                <button className="btn ghost" onClick={() => setStage("pair")}>← Back</button>
                <div className="right"/>
                <button className="btn ghost" onClick={onClose}>Skip for now</button>
                <button className="btn primary" disabled={probeLines.length < 6 || noProto} onClick={() => setStage("done")}>
                  {I.check}<span>Looks good — continue</span>
                </button>
              </div>
            </>
          )}

          {stage === "done" && picked && (
            <div className="done-pane">
              <div className="done-check">{I.check}</div>
              <div className="done-title">Adapter paired and probed</div>
              <div className="done-sub">
                {picked.vendor} · {picked.name} · ELM327 v{picked.v} · trusted for auto-reconnect.
              </div>

              <div className="key-value-grid" style={{marginTop: 18, marginBottom: 16}}>
                <span className="dim">Adapter</span>
                <span className="mono">{picked.name} ({picked.mac})</span>
                <span className="dim">Protocol</span>
                <span className="mono">ISO 15765-4 CAN · 500 kbps</span>
                <span className="dim">Reported VIN</span>
                <span className="mono" style={{color:"var(--accent)"}}>WDD2J6BB0KA000000</span>
                <span className="dim">Decoded</span>
                <span>2019 Mercedes-Benz AMG GT 53</span>
              </div>

              <div className="suggestion">
                <span className="icon-circle" style={{width:32, height:32, flex:"0 0 32px"}}>{I.vehicle}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13, fontWeight:600, color:"var(--text-0)"}}>Use this VIN for a new vehicle profile?</div>
                  <div className="dim" style={{fontSize:11, marginTop:2}}>Prefills year / make / model and unlocks calibrated PIDs.</div>
                </div>
                <button className="btn primary sm">{I.plus}<span>Set up vehicle</span></button>
              </div>

              <div className="pairing-foot">
                <button className="btn ghost" onClick={onClose}>Done</button>
                <div className="right"/>
                <button className="btn primary" onClick={finish}>{I.check}<span>Finish &amp; close</span></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProbeRow({ label, v, mono, ok, last }) {
  return (
    <div className="probe-summary-row" style={{borderBottom: last ? 0 : "1px solid var(--border)"}}>
      <span className="dim">{label}</span>
      <span className={mono ? "mono" : ""} style={{color: "var(--text-0)"}}>{v}</span>
      {ok && <span style={{color:"var(--ok)", width:14, height:14, display:"inline-flex"}}>{I.check}</span>}
    </div>
  );
}

function AdapterPairingHost() {
  const [open, setOpen] = useAP(null);
  useAPEffect(() => {
    _apListeners.add(setOpen);
    return () => _apListeners.delete(setOpen);
  }, []);
  if (!open) return null;
  // Key by instance so every open() forces a fresh mount — internal stage / picked
  // / progress / probe lines all reset cleanly without manual sync.
  return <AdapterPairingModal key={open.instance} onClose={() => window.closeAdapterPairing()} />;
}

Object.assign(window, { AdapterPairingHost });
