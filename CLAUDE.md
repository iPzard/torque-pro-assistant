# Torque Pro Assistant

Desktop log viewer for [Torque Pro](https://torque-bhp.com/) OBD-II driving sessions. Drop in a CSV export, explore the data through charts, and compare historic trips side-by-side. Built on the [iPzard/electron-react-python-template](https://github.com/iPzard/electron-react-python-template) scaffold.

## Stack

- Electron 30 — frameless on Windows / Linux (`frame: false`), `titleBarStyle: 'hiddenInset'` on macOS so the OS keeps drawing the real traffic lights.
- React 18.3 + TypeScript 5.6, served by CRA 5 (`react-scripts@5.0.1`).
- Mantine 7.17 — `@mantine/{core,hooks,dates,notifications,dropzone}` + `dayjs`.
- Redux Toolkit 2.11 with typed hooks via `src/state/hooks.ts`.
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
- `components/pages/{library,compare,import,settings}/index.tsx` — placeholder pages. Each carries `index.test.tsx` colocated. `pages/import/utils/handle-drop` holds the Dropzone callback.
- `state/store/index.ts` — Redux store. Empty placeholder reducer until feature slices arrive.
- `state/hooks/index.ts` — typed `useAppDispatch` / `useAppSelector`.
- `utils/requests/index.ts` — Flask GET/POST with retry-on-connection-refused.
- `utils/services/index.ts` — `windowControls` facade over `window.electronAPI`.
- `utils/index.ts` — barrel that re-exports `get`, `post`, `windowControls` so consumers write `import { ... } from 'utils'`.
- `types/electron-api.ts` — contextBridge contract (stays in lock-step with `preload.ts`).

## File layout rules

Hard rules — apply to all new code; fix existing code that violates them when you touch the surrounding folder.

1. **Kebab-case for every file / folder we control.** Folder name is the kebab form of the thing's camelCase identifier — `someUtil` lives in `some-util/index.ts`, exported as `someUtil`. Exceptions: framework-mandated names (`setupTests.ts`, `tsconfig*.json`, `package.json`) and Python (snake_case).
2. **Folder-per-thing with `index.{tsx,ts}`.** Every component, page, hook, slice, or util lives in its own kebab-cased folder. Implementation is `index.tsx` (React) or `index.ts` (logic). Optional sibling `index.module.scss` when CSS modules are needed. Imports stay clean: `import Library from './pages/library'`.
3. **Tests colocated as `index.test.{tsx,ts}`.** Each component / page / util / hook / slice gets a unit test using **React Testing Library**.
   - **Always query by `data-testid`** — never `getByText`, never `getByRole({ name })`, never any other text- or role-based selector. Add `data-testid` to every element you assert against. Copy changes often; tests shouldn't.
   - **Use `it(...)` not `test(...)`.** Both work; the project picks `it`.
   - Test IDs follow the kebab-case rule. Predictable shape: `<scope>-<element>` (e.g. `library-page`, `library-import-button`, `app-name`, `app-window-control-minimize`, `app-nav-link-library`).
4. **Barrels at `<thing>/utils/index.{tsx,ts}` only.** A `utils/` folder gets a barrel re-exporting siblings so consumers write `import { someUtil, otherUtil } from '<path>/utils'`. Shared utils → `src/utils/index.ts`. Page- or component-local utils → `<thing>/utils/index.tsx`. **Do NOT barrel-export components, pages, hooks, types, slices, or anything else** — import those by direct path.
5. **CSS modules only for bespoke styling.** Mantine carries 95% via CSS variables / component props. For custom CSS, use a sibling `index.module.scss` imported as `import styles from './index.module.scss'`. No global selectors inside module files.
6. **Sub-components nest under their parent.** A sub-component used only by `componentA` lives at `component-a/sub-component/index.tsx` — not hoisted to the shared component pool. Sub-components carry their own `utils/` and barrel. Things sit only as high in the tree as they need to to feed the current directory + descendants.
7. **No utils inside component / page files.** Any named function defined inside a component (event handlers, predicates, fetchers) gets extracted to a util folder with its own test. Anonymous one-line lambdas inline in JSX (`onClick={() => navigate(...)}`) are fine.
8. **Tests don't reach across.** A component's test asserts only that component's behaviour. To verify routing or composition, mock the children — don't assert the rendered output of B inside A's test.
9. **Descriptive variable names.** No single-letter identifiers. `state` not `s`, `error` not `e`. The reader should never need to inspect surrounding code to know what a variable holds.
10. **Every component / util / hook / slice gets a TSDoc block.** A `/** ... */` JSDoc comment above each default export (and each named export of utils) describing what the thing does, its parameters, and its return. Feeds `yarn build:docs`. Keep narrative inline comments separate — JSDoc above the export, `//` for in-body explanations.

Example shape:

```
src/
  components/
    app/
      index.tsx
      index.test.tsx
      index.module.scss
      utils/
        is-active/
          index.ts
          index.test.ts
        index.ts             ← barrel for app's utils
    pages/
      compare/
        index.tsx
        index.test.tsx
        utils/
          some-util/
            index.tsx
            index.test.tsx
          index.tsx
        sub-component/       ← used only by compare
          index.tsx
          index.test.tsx
          utils/
            sub-util/
              index.tsx
              index.test.tsx
            index.tsx
  utils/
    requests/
      index.ts
      index.test.ts
    index.ts                 ← barrel for shared utils
  types/
    electron-api.ts          ← flat: types don't get a barrel or test
```

## Lint / TS / commit rules

These match the file-layout rules in spirit — strict, machine-enforced, auto-fixable. Saving in VS Code (with the ESLint extension + `source.fixAll.eslint` on save) reformats automatically. Run `yarn lint --fix` to apply across the tree manually.

**Sort everything (alphabetical, auto-fixable):**
- Imports — `simple-import-sort/imports` (groups: side-effect, external, absolute, relative, type-only).
- Object literal keys — `sort-keys-fix` (replaces non-fixable built-in `sort-keys`).
- JSX prop order — `react/jsx-sort-props`.
- TS interface / type members + string enums — `typescript-sort-keys`.

**Absolute imports under `src/`:**
- `tsconfig.json` sets `baseUrl: "src"`. CRA 5 / jest auto-resolve.
- `no-relative-import-paths/no-relative-import-paths` with `rootDir: 'src'` enforces and auto-fixes `../foo` → absolute.
- Same-folder imports use `./` or `.` (both accepted). Anything reaching outside the current folder must be absolute. Valid absolute roots: `components/`, `state/`, `types/`, `utils/` (i.e. the top-level `src/` subdirs).
- Electron-side files (`main.ts`, `preload.ts`) compile under `tsconfig.electron.json` and aren't covered by the rule.

**TypeScript hygiene:**
- `@typescript-eslint/no-explicit-any: error` — never use `any`. Use `unknown` and narrow.
- `interface` for public surfaces (props, bridge contracts); `type` for unions / aliases.
- `readonly` arrays / fields for immutable data.
- No non-null `!` assertions without a one-line `// why:` comment.

**Naming (extends architecture rule #9):** types, interfaces, enums, components, utils, hooks all carry self-explanatory names. `SessionDataRow` not `Row`; `ElectronAPI` not `API`; verb-led utils (`handleDrop`, `pingFlask`); predicate-led booleans (`isActive`).

**Commits:** every subject starts with a gitmoji (gitmoji CLI is installed globally). Format `:emoji: scope: subject`. Common picks — `:sparkles:` feat, `:bug:` fix, `:recycle:` refactor, `:memo:` docs, `:wrench:` config, `:white_check_mark:` tests, `:package:` deps, `:rotating_light:` lint, `:fire:` removal, `:lock:` security.

## Conventions / gotchas

- **CRA is end-of-life.** `react-scripts@5.0.1` was its last release. Mantine is pinned to 7.x because Mantine 9 requires React 19, and CRA 5 isn't vetted against React 19. Migrate to Vite when feature work needs more flexibility (see TODO §I).
- **HashRouter, not BrowserRouter.** Electron's prod build loads via `file://`; deep links would 404 under BrowserRouter.
- **Frameless window — platform-aware chrome.** `main.ts` branches at `BrowserWindow` creation: macOS uses `titleBarStyle: 'hiddenInset'` + `trafficLightPosition: { x: 14, y: 14 }`; Windows / Linux use `frame: false` and the renderer draws Mantine ActionIcon-based min/max/close on the right. Detect in the renderer via `window.electronAPI.platform === 'darwin'` (captured once at module load in `App.tsx`).
- **`-webkit-app-region`.** AppShell.Header is the OS drag handle (`drag` in `App.module.scss`). Interactive children opt out with `no-drag`.
- **ColorScheme FOUC.** `public/index.html` sets `data-mantine-color-scheme="dark"` before paint as a CRA stand-in for Mantine's `<ColorSchemeScript />` (CRA has no SSR hook).
- **ESLint `sort-keys: error`.** Object literals must be alphabetised — including inline JSX `style` props.
- **Bridge updates require three edits.** Adding to the preload bridge means: (a) `preload.ts` exposes the field, (b) `src/types/electron-api.ts` declares it, (c) Jest mocks in `src/tests/{services,requests}.test.ts` set it.
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

The current scaffold is intentionally minimal — three placeholder pages, a stub `/import` Dropzone, and an AppShell shell. Real screens land via the TODO below.

---

## TODO

Sequenced feature plan to implement the design. Each item is roughly a commit-sized chunk; later items depend on earlier ones. Phases A–C build the foundation and ship the Library; D–F add Import/Session/Compare; G+ polish.

### A. Data foundations
1. Port the PID catalog (`PID_CATEGORIES`, `PID_BY_KEY`) from the design's `data.jsx` to `src/data/pids.ts`. Drop the seed/synthetic generator — we read real CSV exports.
2. Define TS types in `src/types/session.ts` — `SessionMeta`, `SessionDataRow`, `Vehicle`, `Session = { meta, data }`.
3. CSV ingestion in `src/utils/csv.ts` — Papa Parse adapter that maps Torque Pro export column headers to the canonical `SessionDataRow` shape. Header detection + unit normalisation.
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
20. Charts tab — filmstrip stacked charts driven by `selectedPids`, PID picker drawer (categorised search, multi-select).
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
