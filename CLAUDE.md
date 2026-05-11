# Torque Pro Assistant

Desktop log viewer for [Torque Pro](https://torque-bhp.com/) OBD-II driving sessions. Drop in a CSV export, explore the data through charts, and compare historic trips side-by-side. Built on the [iPzard/electron-react-python-template](https://github.com/iPzard/electron-react-python-template) scaffold.

## Project rules — read these before editing

Hard rules live in `.claude/rules/`. They apply unconditionally to every line of code:

- **[.claude/rules/architecture.md](.claude/rules/architecture.md)** — file layout (kebab-case, folder-per-thing, colocated tests, barrels only at `utils/`), test conventions (`data-testid` only, `it()` not `test()`), JSDoc on every export, multi-line `/** */` blocks, American English, sub-component nesting.
- **[.claude/rules/eslint.md](.claude/rules/eslint.md)** — sort everything (imports / object keys / JSX props / TS members), absolute imports under `src/`, no `any`, commit subjects always start with a gitmoji.

When starting a non-trivial change in this project, read both files first.

## Review agents

Two read-only agents under `.claude/agents/`. Invoke via the Agent tool with `subagent_type`. Use them **throughout the work**, not just pre-commit — catching drift mid-feature is cheaper than catching it at the end.

- **`code-reviewer`** — real-bug / security / logic / suspect-TS / perf / dead-code review of a diff or file. Invoke when finishing a chunk of feature work, when a change touches something subtle (IPC, async, types), or when something feels off. Does NOT comment on conventions.
- **`convention-reviewer`** — rule validator. Cross-checks a diff or file against `.claude/rules/`. Invoke after any non-trivial structural change (new component / page / util / hook, renamed thing, new tests), or whenever you're unsure whether something matches the project's documented norms. Does NOT comment on bugs or logic.

Both agents are read-only and scoped not to overlap — safe to run in parallel. Pre-commit on substantial changes, run both as a final pass.

The agents are a check, not a substitute for knowing the rules. Read `.claude/rules/architecture.md` and `.claude/rules/eslint.md` at the start of any non-trivial work so the rules apply to the first draft, not just the review.

## Stack

- Electron 30 — frameless on Windows / Linux (`frame: false`), `titleBarStyle: 'hiddenInset'` on macOS so the OS keeps drawing the real traffic lights.
- React 18.3 + TypeScript 5.6, served by CRA 5 (`react-scripts@5.0.1`).
- Mantine 7.17 — `@mantine/{core,hooks,dates,notifications,dropzone}` + `dayjs`.
- Redux Toolkit 2.11 with typed hooks via `src/state/hooks/`.
- `react-router-dom@6` — `HashRouter` (file:// safe in packaged builds). Pinned at v6 because v7 is ESM-only and jest under CRA 5 can't resolve it.
- Recharts 3 + Papa Parse 5 — installed; not yet wired into features.
- Python 3.10–3.12 + Flask backend, bundled by PyInstaller for prod.
- ESLint 9 flat config (`eslint.config.ts`), Jest via CRA, pytest.

## Codebase map

Top-level:

- `main.ts`, `preload.ts` — Electron main + contextBridge. Compile to `dist-electron/`.
- `app.py` — Flask service. Currently `/ping` (proof of life) and `/quit`.
- `scripts/{start,build,clean,package,dispatch}.ts` — dev/build orchestration.
- `tests/test_app.py` — pytest for Flask routes.
- `utilities/{deb,dmg,msi}/images/` — installer art (placeholder).
- `utilities/loaders/redux/` — dev-mode loading screen HTML.

Renderer (`src/`):

- `index.tsx` — renderer entry. `MantineProvider` (amber palette, dark default), `Notifications`, Redux `Provider`, `HashRouter`.
- `components/app/index.tsx` — AppShell skeleton, sidebar nav (Workspace group + pinned Settings), route switch. Uses `components/app/utils/{is-active,ping-flask}` for the inline-extracted handlers.
- `components/pages/{library,compare-logs,import-logs,settings}/index.tsx` — placeholder pages. Each carries `index.test.tsx` colocated. `pages/import-logs/utils/handle-drop` holds the Dropzone callback.
- `state/store/index.ts` — Redux store. Empty placeholder reducer until feature slices arrive.
- `state/hooks/index.ts` — typed `useAppDispatch` / `useAppSelector`.
- `utils/requests/index.ts` — Flask GET/POST with retry-on-connection-refused.
- `utils/services/index.ts` — `windowControls` facade over `window.electronAPI`.
- `utils/index.ts` — barrel that re-exports `get`, `post`, `windowControls` so consumers write `import { ... } from 'utils'`.
- `types/electron-api.ts` — contextBridge contract (stays in lock-step with `preload.ts`).

## Conventions / gotchas

- **CRA is end-of-life.** `react-scripts@5.0.1` was its last release. Mantine is pinned to 7.x because Mantine 9 requires React 19, and CRA 5 isn't vetted against React 19. Migrate to Vite when feature work needs more flexibility (see TODO §I).
- **HashRouter, not BrowserRouter.** Electron's prod build loads via `file://`; deep links would 404 under BrowserRouter.
- **Frameless window — platform-aware chrome.** `main.ts` branches at `BrowserWindow` creation: macOS uses `titleBarStyle: 'hiddenInset'` + `trafficLightPosition: { x: 14, y: 14 }`; Windows / Linux use `frame: false` and the renderer draws Mantine ActionIcon-based min/max/close on the right. Detect in the renderer via `window.electronAPI.platform === 'darwin'` (read inside the component body, not at module scope, so tests can swap the stub bridge between renders).
- **`-webkit-app-region`.** AppShell.Header is the OS drag handle (`drag` in `index.module.scss`). Interactive children opt out with `no-drag`.
- **ColorScheme FOUC.** `public/index.html` sets `data-mantine-color-scheme="dark"` before paint as a CRA stand-in for Mantine's `<ColorSchemeScript />` (CRA has no SSR hook).
- **Bridge updates require three edits.** Adding to the preload bridge means: (a) `preload.ts` exposes the field, (b) `src/types/electron-api.ts` declares it, (c) Jest mocks in `src/utils/{services,requests}/index.test.ts` set it.
- **Branding.** This is iPzard's project. LICENSE copyright reads `iPzard`, `.github/ISSUE_TEMPLATE/*` set `assignees: iPzard`. Don't strip these as "stale template branding" — they're intentional.

## Workflows

- `yarn start` — full dev (React + Electron + Flask, hot reload).
- `yarn lint` / `yarn typecheck` — three tsconfigs covered (renderer + electron + scripts).
- `yarn test` (Jest) / `yarn test:python` (pytest).
- `yarn build:react` / `yarn build:electron` / `yarn build:python` — individual.
- `yarn build:package:{windows,mac,linux}` — full installer builds.
- `yarn verify` — `lint → typecheck → jest → pytest → react build`. CI runs the same chain.

## Reference: design

The visual target is the Claude Design handoff at `C:\Users\Daniel\Downloads\torque-pro-assistant-handoff.zip`. Open `project/TorquePro Assistant.html` to see the full prototype. Match the visuals, not the prototype's structure (it mounts every screen via Babel-in-the-browser; we don't replicate that).

The current scaffold is intentionally minimal — placeholder pages, a stub `/import` Dropzone, and an AppShell shell. Real screens land via the TODO below.

---

## TODO

Sequenced feature plan to implement the design. Each item is roughly a commit-sized chunk; later items depend on earlier ones. Phases A–C build the foundation and ship the Library; D–F add Import/Session/Compare; G+ polish.

### A. Data foundations
1. Port the PID catalog (`PID_CATEGORIES`, `PID_BY_KEY`) from the design's `data.jsx` to `src/data/pids.ts`. Drop the seed/synthetic generator — we read real CSV exports.
2. Define TS types in `src/types/session.ts` — `SessionMeta`, `SessionDataRow`, `Vehicle`, `Session = { meta, data }`.
3. CSV ingestion in `src/utils/csv.ts` — Papa Parse adapter that maps Torque Pro export column headers to the canonical `SessionDataRow` shape. Header detection + unit normalization.
4. Port `summarize()` from `data.jsx` to `src/utils/summarize.ts` — derives `{ maxSpeed, peakHp, peakTq, maxBoost, maxCool, avgMpg, dist, t0to30, t0to60 }`.
5. Redux `sessionsSlice` in `src/state/sessionsSlice.ts` — add / remove / select sessions; persist via `localStorage` first (Flask-backed JSON file later).

### B. Shared chart + UI primitives
6. `src/components/charts/Sparkline.tsx` — Recharts `<LineChart>` w/ axes hidden, sized to context.
7. `src/components/charts/LineChart.tsx` — multi-series, optional dual y-axis, shared cursor (hoisted state or a small Context).
8. `src/components/charts/Brush.tsx` — Recharts brush styled to match the design's range window.
9. Design-matched primitives: `Metric`, `Card`, `KVRow`, `Pill` — many are thin Mantine wrappers (`Card`, `Group`, `Text`, `Badge`).
10. Status bar — fixed 24px footer at the bottom of `AppShell.Main` showing `READY · <route> · <units>`.

### C. Library screen
11. Sessions table (columns from `screens-lib.jsx#LibraryScreen`) — row click navigates to `/sessions/:id`. Wire selection, search, sort (date / duration / distance / max speed).
12. "Recently driven" card grid below the table.
13. Toolbar filters: date range, vehicle, units (UI only first; wire later).
14. First-run empty state when the sessions slice is empty.

### D. Import flow (full)
15. Replace the `/import` placeholder with the design's three-stage flow — drop, parsing (progress + row count), preview (table preview + detected columns + validation).
16. Validation panel — GPS present, monotonic time, malformed rows, hybrid-PID note, vehicle match.
17. Session details form — name, vehicle, notes. Save dispatches to the sessions slice.

### E. Session screen
18. `/sessions/:id` route + `SessionScreen` shell w/ tabs (Overview, Charts, Map, Raw Data) and the header KV row (date, vehicle, duration, distance, filename).
19. Overview tab — Metric grid (8 cells), Speed & RPM dual-axis chart w/ Brush, Throttle/Load, AFR cmd vs measured, Boost, Engine Vitals, Power & Torque, MiniMap.
20. Charts tab — filmstrip stacked charts driven by `selectedPids`, PID picker drawer (categorized search, multi-select).
21. Map tab — `BigMap` (port the SVG polyline-from-GPS map), Hotspots, Trip stats.
22. Raw Data tab — paginated table; hover sets the shared cursor.

### F. Compare screen
23. `/compare?ids=...` route — overlay charts (Speed+RPM, Throttle, Boost) for 2–4 sessions, alignment toggle (trip start / GPS).
24. Side-by-side summary table w/ Δ column.

### G. Settings + state polish
25. Settings screen — theme (dark/light), density (compact/regular/comfy), units (imperial/metric), accent shade, vehicle defaults. Backed by a `preferencesSlice` persisted to disk.
26. Wire `units` everywhere — chart axes, table values, summary labels.
27. Global keyboard shortcuts — `⌘O` opens Import, `⌘K` opens a command palette (deferred — placeholder for now).

### H. Branding (Q8 + Q9 from the original audit, deferred to here)
28. Real Torque Pro Assistant icon set — `public/favicon.ico`, `logo192.png`, `logo512.png`, plus installer art under `utilities/{deb,dmg,msi}/images/`.
29. Branded loader HTML — replace "Starting React Development Server" w/ Torque Pro Assistant copy + logo at `utilities/loaders/redux/index.html`.
30. Custom fonts — Geist + Geist Mono per design. Load locally; drop the system-stack fallback in `theme.fontFamily` / `theme.fontFamilyMonospace`.

### I. Migration (later — single dedicated branch)
31. CRA → Vite. Replace `react-scripts` and `scripts/build.ts`'s React adapter. PostCSS gains `postcss-preset-mantine` so Mantine's `em()` / `rem()` / responsive helpers work.
32. React 18 → 19. Update peer deps; verify `react-redux`, `@testing-library/react`, Jest config.
33. Mantine 7 → 9 (paired with the React 19 upgrade — Mantine 9 requires React 19).

### J. Live capture (Torque Pro real-time web upload)
34. Flask endpoint `/torque/upload` (HTTP GET) that accepts Torque Pro's [Realtime Web Upload](https://www.home-assistant.io/integrations/torque/) query-string format. Params: `k<hex>` PID values (`k0d` speed, `k1f` load, `kff1201` GPS-extended PIDs, …), `time` (epoch ms), `session`, `id`, `v`, `eml`. Skip `userUnit*` / `defaultUnit*` / `profile*` (except `profileName`). Buffer rows in-process keyed by `session`. Default Torque upload interval is ~2 s.
35. Hex-PID → `SessionDataRow` field map. Extend `data/pids` (or sibling `data/torque-pid-codes`) with the standard Torque PID code list so the adapter can translate `k0d` → `speed_mph` / `speed_kph`. Community-maintained code lists are the source.
36. Renderer subscribes to the live buffer via SSE (`/torque/stream`) or polling. New `state/liveSlice` tracks the in-flight session id + buffered rows; a "Live capture" page mirrors the Session detail layout but with auto-scrolling charts.
37. Save-to-library on disconnect — when the upload stream stops for N seconds, freeze the buffered session, run it through the standard `buildSession` path, dispatch `addSession`. Discard button on the live page abandons the buffer without persisting.
38. Network reachability: settings panel for the upload port + bind address (`0.0.0.0` for LAN), plus a copy-paste URL field showing what the user enters on the phone. Stretch: optional Bearer token check.
