# Design states

Source-of-truth design handoffs from [Claude Design](https://claude.ai/design). Each handoff is a self-contained HTML/CSS/JSX prototype; agents pull visual + interaction reference from here when building the matching screens.

**Do not modify** the handoff directories. Treat them as immutable reference. Each carries its own `README.md` from the design tool with consumption instructions.

## Index

### handoff-1 — populated app (`CTvk5QDw93R0VmG_q3MrcQ`)

Imagined steady-state: user has a vehicle configured (2019 AMG GT 53), four sessions imported.

Covers:

- **Library populated** — 12-column sessions table w/ sparkline profile column, selection checkboxes, more menu, sort, Recently driven card strip
- **Session Dashboard** — header KV strip, four tabs (Overview / Charts / Map / Raw Data)
  - Overview: 8-cell Metric grid + Speed/RPM dual-axis w/ Brush + Throttle/Load + AFR cmd vs measured + Boost + Engine Vitals + Power & Torque + MiniMap
  - Charts: filmstrip stacked charts driven by selected PIDs + PID picker drawer
  - Map: BigMap polyline color-coded by speed + Hotspots + Trip Stats
  - Raw Data: paginated row table
- **Compare overlay** — 2–4 sessions, Speed+RPM / Throttle / Boost overlays, alignment toggle (trip start / GPS), Δ summary table
- **Import flow** — three stages: drop, parsing progress (rows/cols/decoder/memory), preview + detected columns + validation panel + session details form
- **Empty state (legacy)** — dashed-border placeholder, since superseded by handoff-2's Welcome screen

Files: `app.jsx`, `screens-dash.jsx`, `screens-lib.jsx`, `data.jsx`, `ui.jsx`, `styles.css`, `tweaks-panel.jsx`, `TorquePro Assistant.html`.

### handoff-2 — first-run + no-vehicle (`U3gbN3zFBefCuZZtBZhdjw`)

Brand-new install + the "no vehicle selected" / "no Bluetooth adapter detected" flows. Diff against handoff-1: adds the `firstRun` + `vehicleConnected` tweaks and the screens they gate.

Covers:

- **Welcome screen** — logo + amber heading, three numbered Step cards, primary + ghost CTAs, sample.csv download card
- **FirstRunNoVehicle** — Year/Make/Model selects + VIN input, dashed "No saved vehicles yet" + "No Bluetooth adapter detected" cards, "Why we need a vehicle" + "What happens next" sidebar
- **NoVehicleScreen** (non-first-run variant, in `app.jsx`) — vehicle picker with live Bluetooth detection + previously-imported suggestions + status panel (BT adapter / VIN broadcast / active profile / pending sessions)
- **Sidebar first-run adaptations** — Library badge 0, Compare disabled with `—` badge, italic "No sessions yet — Import one" under Recent sessions, dashed plus-icon "Select vehicle…" entry
- **Titlebar first-run adaptations** — warn pill "No vehicle selected", rows-indexed shows "0 rows" instead of hiding

Files: `app.jsx` (replaces handoff-1's), `screens-onboarding.jsx` (new), `screens-dash.jsx`, `screens-lib.jsx`, `data.jsx`, `ui.jsx`, `styles.css`, `tweaks-panel.jsx`, `TorquePro Assistant.html`.

## How to consume

1. Read the handoff's own `README.md` first — Claude Design ships consumption instructions.
2. **Always read the chat transcript** at `chats/chat1.md` — it captures the user's intent + design iteration. The HTML files are the output; the chat is where the brief lives.
3. Open the relevant `*.jsx` files top-to-bottom. The design medium is prototype JSX, not production code — recreate visuals pixel-perfectly in the project's stack (React + Mantine + design CSS vars), not the prototype's babel-in-browser internals.
4. **Don't render the HTML in a browser unless explicitly asked.** Everything needed (dimensions / colors / layout rules) is in the source. Read the HTML / CSS / JSX directly.

## Adding a new handoff

When the user provides a new design handoff:

1. Fetch via the `https://api.anthropic.com/v1/design/h/<id>` URL (returns gzip tarball).
2. Decompress to `docs/design/handoff-<N>/` (incrementing `N`).
3. Add an entry to the index above — what states it covers, which files are new vs. revised.
4. Cross-reference any superseded handoff (e.g. handoff-2's Welcome supersedes handoff-1's `EmptyState`).

Handoff IDs are opaque — keep them in the index so we can re-fetch / verify provenance.
