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

### handoff-3 — Settings page (`iKMoEMXvJ4UjUKTcQrSu9w`)

Six-section Settings layout: Appearance / Units / Vehicles / Data / Network / About.

Covers:

- **Appearance** — Theme (dark / light) + Density (compact / regular / comfy) segmented controls + 5-swatch accent color picker (amber default, orange, cyan, green, violet).
- **Units** — Imperial vs Metric wide segmented control; subtitle updates live.
- **Vehicles** — Saved vehicles table with active-dot column, ACTIVE PROFILE label, per-row Set active / Edit / Delete actions; header buttons for Import .vprofile / Export all / Add vehicle. Empty state when no vehicles. Routes "Add vehicle" to the FirstRunNoVehicle screen.
- **Data** — Read-only storage path code chip + reveal button, sessions-on-disk pill, Export .tplog button, destructive Clear sessions button (red border + red text).
- **Network** — Phase J live-capture endpoint preview: backend port chip + listening pill, bind-address dropdown with contextual safety detail, read-only upload URL input + Copy → Copied confirmation button.
- **About** — Logo + version/build/platform line, MIT license note, doc / repo / bug / log buttons, copyright line.

Inline custom `SegBtn` + `SettingRow` primitives — design uses these per-page rather than reaching into Mantine, so the visual matches without the framework's defaults overriding.

Bug fix captured in the chat: original Settings render was being intercepted by the first-run / no-vehicle gates. Final build opens Settings from any state — keep this in mind when reordering route gates.

Files: `screens-settings.jsx` (new), `app.jsx` (revised — Settings route hoisted above the first-run / no-vehicle gates), plus the handoff-2 set unchanged.

### handoff-4 — Library row action menu (`fS5Elq996gIi43Zfdzzh2w`)

Per-row `…` (more) button on the Library sessions table becomes a popover menu + two confirmation modals + a toast.

Covers:

- **RowMenu popover** — fixed-position with smart placement (flips above the anchor when overflowing the viewport bottom). Items: Open · Rename… · Duplicate (with `⌘D` kbd hint) · ─ · Export CSV · Show in folder (`⌥⌘R`) · ─ · Delete… (danger red). Header line shows the session name. Mouse-outside + Escape close.
- **RenameDialog** — centered modal w/ pencil icon-circle, single text input pre-selected with the current name, max 80 chars + counter, Save / Cancel. Save disabled while empty or unchanged.
- **ConfirmDeleteDialog** — destructive variant with red icon-circle + headline, read-only summary grid (File / Recorded / Duration / Size), Cancel + Delete buttons. Enter confirms.
- **Row toast** — bottom-center pill that auto-dismisses after 3.2 s. Two kinds: ok (green check) + err (red trash). Fires after every action.

CSS additions: `.menu-pop` + `.menu-item` + `.menu-sep` + `.menu-label`, `.modal-backdrop` + `.modal` + `.modal-h` + `.modal-body` + `.modal-foot` + `.icon-circle`, `.btn.danger`, `.row-toast` + `.row-toast.err`. Animations: `menuIn`, `mIn`, `bdIn`, `toastIn`.

Files: `screens-lib.jsx` (revised — new `RowMenu` / `RenameDialog` / `ConfirmDeleteDialog` exports + new icons), `styles.css` (revised — popover / modal / toast / `.btn.danger` rules), plus rest unchanged.

### handoff-5 — Notifications / Toasts (`vRKm5E2VLhSMOuEq_YzuZg`)

Global toast notification system replacing handoff-4's local row-toast. App-wide stack anchored bottom-right that any module can call into imperatively.

Covers:

- **Imperative API** — `toast({ title, ... })` plus `toast.success` / `.info` / `.warning` / `.error` shortcuts. Also `toast.dismiss(id)` + `toast.clear()`. Returns an `id` per push. Module-level queue + subscribers Set — callable from any non-component code (event handlers, async callbacks, slices).
- **ToastHost** — fixed-position stack at `right: 20px; bottom: 40px`, 360px wide. Renders the 3 newest entries with slide-in + slide-out keyframes. Auto-dismiss timer paused on hover. Manual close X. Optional action button (`{ label, onClick }`) with kind-tinted styling. Animated progress bar countdown.
- **Four kinds** — `success` (green dot/progress), `info` (cyan), `warning` (amber), `error` (red). Each kind drives the dot color, progress bar color, and action button tint.
- **Migration** — sessions-table's local `row-toast` sub-component is removed; rename / duplicate / export / show-in-folder / delete actions now fire global `toast.success` / `toast.error` instead. Mantine's `<Notifications />` mount + CSS import are dropped from `src/index.tsx` — replaced by the bespoke ToastHost.

Files: `toasts.jsx` (new — `ToastsHost` + `useToasts` hook + the imperative `toast` facade), `styles.css` (revised — `.toast-host` + `.toast` + `.toast-dot` + `.toast-progress` + `.toast-action` + `.toast-close` rules; keyframes `toast-in` / `toast-out` / `toast-prog`), plus rest unchanged.

### handoff-6 — Error / failure states (`0NYzcWUP6SDy1wF_i_FGaA`)

Six error states across the app, all severity-coded (amber = warn / recoverable, red = error / blocking).

Covers:

- **CSV parse failure** — `.alert.danger` card in the Import flow replacing the parsing card when `parseFile` throws. Title + monospace filename + raw-line `detail` block + `Try again` / `Cancel` actions. Driven by the existing `error` state in `ImportLogs`; the file reference now sticks so retry doesn't need a re-pick.
- **Malformed-row inline indicator** — preview-stage validation panel grows a secondary `detail` line beneath the message, e.g. "23 rows jump backwards in time — likely a clock drift during recording…". Backed by a new `detail?: string` field on `ValidationFlag`.
- **Backend offline banner** — 28-px amber-tinted top strip above the titlebar. Pulsing dot + "Backend unreachable" headline + mono "(N/10)" retry counter + `Retry now` button + close. Polling lives in `useBackendStatus`; the App shell switches its grid template (`app-shell-with-banner`) to grow the extra row.
- **No-GPS empty state** — replaces the BigMap one-line "No GPS data" placeholder with a dashed-icon card, headline, soft copy, and a 2-column mono checklist showing which signals ARE present (RPM / speed / throttle / boost / AFR / temps + the row count). MiniMap keeps its compact placeholder.
- **Session not found** — full-page 404 takeover for the `/sessions/:id` route when the id doesn't resolve. Gradient "404" numeral + uppercase mono tag + headline + copy + a mono pseudo-stack-trace card showing the missing path + 404 status, plus `Back to Library` and `Import a CSV` actions.
- **Permission denied** — `.alert.warn` compact variant lives in the new shared `<Alert>` primitive for future wiring once Electron's file-picker permission errors are exposed over the contextBridge. No live trigger yet.

CSS / structure additions: shared `<Alert>` primitive at `components/primitives/alert/` (variants `danger` / `warn` / `info`; optional `compact` density; optional `detail` block + `onClose` dismiss). `not-found/` sub-component under `session-detail/`. `no-gps-empty/` sub-component under `session-detail/map/big-map/`. `offline-banner/` sub-component + `use-backend-status/` hook under `app/`. `pingFlask` refactored to return `Promise<boolean>` so the banner can observe reachability.

Files: `styles.css` (revised — `.alert` + `.alert.danger` / `.warn` / `.info` + `.alert.compact`; `.top-banner` + `pulse` / `bannerIn` keyframes; `.notfound` + `.nf-code` / `.nf-tag` / `.nf-trace` / `.nf-actions`; `.map-empty` + `.me-icon` / `.me-checks`; `.link-btn`), `app.jsx` (revised — banner + `NotFoundScreen` + error tweaks plumbing), `screens-lib.jsx` (revised — parse-failure card + permission alert + malformed-row val row), `screens-dash.jsx` (revised — MiniMap empty state grows the rich checklist), plus rest unchanged.

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
