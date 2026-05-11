/* screens-onboarding.jsx — brand-new app: welcome / first-run / empty states */

const { useState: useStateOB } = React;

function WelcomeScreen({ onStart, onSkip }) {
  return (
    <div className="page" data-screen-label="Welcome" style={{padding: "40px 28px"}}>
      <div style={{maxWidth: 880, margin: "0 auto"}}>

        <div style={{textAlign: "center", marginBottom: 36}}>
          <div style={{display:"inline-flex", padding:18, borderRadius: 18,
                       background:"var(--accent-soft)", color:"var(--accent)",
                       border:"1px solid var(--accent-line)"}}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 7v5l3.5 2"/>
              <path d="M19.5 8.5 18 9.5M4.5 8.5 6 9.5M19.5 15.5 18 14.5M4.5 15.5 6 14.5"/>
            </svg>
          </div>
          <h1 style={{fontSize: 28, fontWeight: 600, letterSpacing:"-.01em", margin: "20px 0 8px"}}>
            Welcome to <span style={{color:"var(--accent)"}}>TorquePro Assistant</span>
          </h1>
          <p className="muted" style={{fontSize: 14, margin: 0, lineHeight: 1.55}}>
            A desktop companion for your Torque Pro CSV logs.<br/>
            Fast, local-first, built for tinkerers. Let's set things up.
          </p>
        </div>

        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap: 12, marginBottom: 28}}>
          <Step n={1} label="Add a vehicle" detail="So we can decode logs and calibrate units." />
          <Step n={2} label="Import your first log" detail="Drop a Torque Pro CSV export. Parsing stays on-device." />
          <Step n={3} label="Explore the session" detail="Charts, GPS, hot spots — and side-by-side compare." />
        </div>

        <div className="row" style={{justifyContent:"center", gap: 10, marginBottom: 24}}>
          <button className="btn primary" onClick={onStart}>
            {I.plus}<span>Add a vehicle to get started</span>
          </button>
          <button className="btn ghost" onClick={onSkip}>I'll do this later</button>
        </div>

        <div className="dim" style={{textAlign:"center", fontSize: 11, marginBottom: 18}}>
          v0.4.2 · No account required · Logs never leave your machine ·
          <a href="#" style={{color:"var(--text-1)", marginLeft: 6}}>Read the docs</a>
        </div>

        <div className="card" style={{padding: 16, background:"var(--bg-2)"}}>
          <div className="row" style={{justifyContent:"space-between", marginBottom: 10}}>
            <div style={{fontSize: 12, fontWeight: 500}}>Looking for a sample to play with?</div>
            <button className="btn ghost sm">{I.download}<span>Download sample.csv</span></button>
          </div>
          <div className="dim" style={{fontSize: 11, lineHeight: 1.55}}>
            We can load a 12-minute demo session (city + highway, ~720 rows). It works without
            adding a vehicle and gives you a tour of every chart, the GPS map, and the compare view.
          </div>
        </div>

      </div>
    </div>
  );
}

function Step({ n, label, detail }) {
  return (
    <div className="card" style={{padding: "14px 14px 16px"}}>
      <div className="row" style={{gap: 10, marginBottom: 8}}>
        <span className="mono" style={{
          width: 22, height: 22, borderRadius: 5, fontSize: 11,
          display:"inline-flex", alignItems:"center", justifyContent:"center",
          background:"var(--bg-3)", border:"1px solid var(--border)", color:"var(--accent)"}}>{n}</span>
        <div style={{fontSize: 13, fontWeight: 600}}>{label}</div>
      </div>
      <div className="dim" style={{fontSize: 11, lineHeight: 1.5}}>{detail}</div>
    </div>
  );
}

// First-run version of NoVehicleScreen: no past-import suggestions, no live BT
function FirstRunNoVehicle({ onSkipToWelcome }) {
  const [picked, setPicked] = useStateOB(null);
  const makes = ["Acura","Audi","BMW","Chevrolet","Dodge","Ford","Honda","Hyundai","Jeep","Lexus","Mazda","Mercedes-Benz","Mitsubishi","Nissan","Porsche","Subaru","Tesla","Toyota","Volkswagen","Volvo"];
  return (
    <div className="page" data-screen-label="First-run · vehicle">
      <div className="page-h">
        <div>
          <div className="row" style={{gap:8, marginBottom:6}}>
            <button className="btn ghost sm" onClick={onSkipToWelcome}>
              <span style={{transform:"rotate(180deg)", display:"inline-flex"}}>{I.chevRight}</span>
              <span>Back</span>
            </button>
            <span className="dim mono" style={{fontSize:11}}>Step 1 of 2 · Add a vehicle</span>
          </div>
          <h1>Tell us about your car</h1>
          <div className="sub">This unlocks calibrated PIDs and unit decoding. You can change or add more vehicles later.</div>
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"minmax(0, 1.4fr) minmax(0, 1fr)", gap:14}}>
        <div className="col" style={{gap: 14}}>
          <Card title="Add a vehicle" subtitle="manual entry">
            <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap: 10}}>
              <div>
                <div className="dim" style={{fontSize:10, letterSpacing:".08em", textTransform:"uppercase", marginBottom:4}}>Year</div>
                <select className="select" style={{width:"100%"}}>
                  <option>Year…</option>
                  {Array.from({length: 14}, (_, i) => 2026 - i).map((y) => <option key={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <div className="dim" style={{fontSize:10, letterSpacing:".08em", textTransform:"uppercase", marginBottom:4}}>Make</div>
                <select className="select" style={{width:"100%"}}>
                  <option>Make…</option>
                  {makes.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <div className="dim" style={{fontSize:10, letterSpacing:".08em", textTransform:"uppercase", marginBottom:4}}>Model</div>
                <select className="select" style={{width:"100%"}} disabled>
                  <option>Select make first…</option>
                </select>
              </div>
            </div>
            <div className="divider"/>
            <div className="dim" style={{fontSize:10, letterSpacing:".08em", textTransform:"uppercase", marginBottom:4}}>VIN <span style={{textTransform:"none", letterSpacing:0, color:"var(--text-3)", marginLeft:6}}>optional · enables auto-decode</span></div>
            <input className="input mono" placeholder="17-character VIN" style={{width:"100%", letterSpacing:".05em"}} />
            <div className="row" style={{marginTop:14, gap:8}}>
              <button className="btn primary" disabled style={{opacity:.5}}>{I.check}<span>Add vehicle</span></button>
              <button className="btn ghost">Import from OBD adapter</button>
            </div>
          </Card>

          <div className="card" style={{padding: 14, background:"var(--bg-2)", borderStyle:"dashed"}}>
            <div className="row" style={{gap: 10}}>
              <span style={{display:"inline-flex", padding:8, borderRadius:8, background:"var(--bg-3)", color:"var(--text-2)"}}>{I.vehicle}</span>
              <div style={{flex:1}}>
                <div style={{fontSize: 12, fontWeight: 500}}>No saved vehicles yet</div>
                <div className="dim" style={{fontSize: 11, marginTop: 2, lineHeight: 1.5}}>
                  Once you add your first car, it'll show up here for one-click re-selection. Have a profile from another machine? <a href="#" style={{color:"var(--text-1)"}}>Import a .vprofile file</a>.
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{padding: 14, background:"var(--bg-2)", borderStyle:"dashed"}}>
            <div className="row" style={{gap: 10}}>
              <span style={{display:"inline-flex", padding:8, borderRadius:8, background:"var(--bg-3)", color:"var(--text-3)"}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12 a 10 10 0 1 1 20 0"/><path d="M6 12 a 6 6 0 1 1 12 0"/><circle cx="12" cy="12" r="1.5"/></svg>
              </span>
              <div style={{flex:1}}>
                <div style={{fontSize: 12, fontWeight: 500}}>No Bluetooth adapter detected</div>
                <div className="dim" style={{fontSize: 11, marginTop: 2, lineHeight: 1.5}}>
                  Plug in an ELM327-compatible OBD-II adapter to auto-detect your VIN. Optional — you can also enter everything manually above.
                </div>
              </div>
              <button className="btn ghost sm">Scan again</button>
            </div>
          </div>
        </div>

        <div className="col" style={{gap: 14}}>
          <Card>
            <div className="row" style={{gap:12, marginBottom:10}}>
              <span style={{display:"inline-flex", padding:10, borderRadius:10, background:"var(--accent-soft)", color:"var(--accent)"}}>{I.vehicle}</span>
              <div>
                <div style={{fontWeight:600, fontSize:14}}>Why we need a vehicle</div>
                <div className="dim" style={{fontSize:11, marginTop:2}}>Unlocks calibrated PIDs, units, and 0-60 detection.</div>
              </div>
            </div>
            <div className="col" style={{gap: 10, marginTop: 4}}>
              <BulletRowOB label="Decode manufacturer-specific PIDs" detail="Boost, AFR, oil temp, transmission temp" />
              <BulletRowOB label="Calibrate torque & horsepower" detail="Weight, drivetrain losses, redline" />
              <BulletRowOB label="Filter library by vehicle" detail="Sessions stay grouped per car" />
              <BulletRowOB label="Detect 0–60, ¼-mile, braking g" detail="Needs gear ratios + curb weight" />
            </div>
          </Card>

          <Card title="What happens next">
            <ol style={{margin: 0, paddingLeft: 18, color:"var(--text-1)", fontSize:12, lineHeight:1.7}}>
              <li>Add your vehicle (this step)</li>
              <li>Import your first Torque Pro CSV</li>
              <li>Browse charts, GPS, compare sessions</li>
            </ol>
            <div className="dim" style={{fontSize:11, marginTop:10}}>
              Or skip ahead and play with a 12-minute sample log. The vehicle prompt will come back when you want to import real data.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BulletRowOB({ label, detail }) {
  return (
    <div className="row" style={{gap:10, alignItems:"flex-start"}}>
      <span style={{flex:"0 0 18px", color:"var(--ok)", marginTop:1}}>{I.check}</span>
      <div style={{flex:1}}>
        <div style={{fontSize:12, color:"var(--text-0)"}}>{label}</div>
        <div className="dim" style={{fontSize:11, marginTop:2}}>{detail}</div>
      </div>
    </div>
  );
}

Object.assign(window, { WelcomeScreen, FirstRunNoVehicle });
