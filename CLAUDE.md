I've cloned iPzard/electron-react-python-template and started converting it into my own app: Torque Pro Assistant, a Torque Pro log viewer.

The app's purpose: users upload CSV log files exported from Torque Pro (OBD-II vehicle diagnostics) and explore the data through charts, with the ability to view and compare historic sessions.

Stack going forward:
- Electron (keep)
- React + TypeScript (keep)
- Python/Flask backend (keep — for heavier data processing later)
- Redux Toolkit (keep)
- Mantine UI components (replace whatever UI library the template uses)
- Recharts for charts
- Papa Parse for CSV parsing

Project name: Torque Pro Assistant (use torque-pro-assistant for package.json name, and places where spacing is not ideal, and actual name for wherever the name will be displayed to users)

Important constraints:
- Don't build any Torque-specific features yet (no CSV parsing logic, no chart components, no session library). This pass is just "un-template and prepare the foundation."
- Ask me before making non-obvious choices
- Show me the audit (step 1) before destroying anything in step 2

What I need you to do:

2. Strip the template down
   - Remove all demo/sample code while keeping the working Electron ↔ React ↔ Python plumbing intact
   - Remove author-specific branding and replace with TorqueView placeholders
   - Update LICENSE to keep MIT but with my name as iPzard

3. Update the README
   - Keep the existing styled structure (badges, emoji section headers, code blocks, formatting) — don't redesign it
   - Update the content: title → Torque Pro Assistant, description → Torque Pro log viewer, setup/scripts/config sections updated to reflect the actual current stack
   - Remove the original screenshot/gif and leave a placeholder for a new one

4. Swap the UI library to Mantine
   - Install @mantine/core, @mantine/hooks, @mantine/dates, @mantine/notifications, @mantine/dropzone
   - Set up MantineProvider at the app root with a dark-mode-default theme
   - Replace the template's existing UI components with Mantine equivalents (AppShell with navbar + header, basic routing scaffold)

5. Install the data/chart libraries
   - recharts
   - papaparse + @types/papaparse
   - Don't build features yet — just install and verify they import cleanly

6. Scaffold the empty app structure (no real features yet, just placeholders)
   - AppShell with a sidebar nav: Library, Compare, Settings
   - Each route renders a placeholder page with the route name as a heading
   - An "Import CSV" button in the header that opens a Mantine Dropzone modal (no parsing logic yet, just the UI)

7. Verify everything still works
   - Dependencies install cleanly
   - `yarn run start` launches the Electron app
   - The Python/Flask backend still starts and the renderer can hit a sample endpoint (keep one trivial /ping endpoint as proof of life, remove the rest)
   - No console errors, no TypeScript errors

8. Commit hygiene
   - After each major step (audit, strip, README, Mantine swap, scaffold), make a separate git commit with a clear message
   - Don't commit node_modules, build artifacts, or Python venv

9. Delete everything in this file, and re-write the CLAUDE.md (this file) to something appropriate for the project at that time.

---

## Open questions (deferred — defaults assumed for now)

These came up during the audit. The user said "leave all for now" — defaults below were applied so steps 2–8 could proceed. Confirm or override before step 9 (CLAUDE.md rewrite).

The handoff bundle at `C:\Users\Daniel\Downloads\torque-pro-assistant-handoff.zip` (Claude Design export of `TorquePro Assistant.html`) is the visual target for future feature work. Several defaults below were biased toward what that design implies, since the user pointed at it for context.

1. **Custom titlebar (frameless window).**
   - Options: (a) drop frameless, use OS chrome and delete `Titlebar*` files; (b) keep frameless, restyle Titlebar into Mantine `AppShell.Header` w/ `-webkit-app-region: drag`; (c) keep current Titlebar bolted on top of AppShell unchanged.
   - **Default applied:** (b). Design has a custom 44px titlebar w/ macOS-style traffic lights, app name "TorquePro · Assistant", connection pills, and version stamp. Frameless will stay; Titlebar will be folded into the AppShell.Header during scaffolding.

2. **Redux store after stripping the counter slice.**
   - Options: keep `state/store.ts` + typed hooks with an empty reducer object for future use, vs. delete `state/` entirely until needed.
   - **Default applied:** keep, empty reducer object. Brief lists Redux Toolkit as part of the stack going forward.

3. **Sample-endpoint proof-of-life call.**
   - Options: have the renderer fire a `/ping` GET on mount and `console.log` the response; or leave the endpoint with no caller; or fire and `alert`.
   - **Default applied:** fire `/ping` on mount, `console.log` the response (no UI alert).

4. **`src/theme/` directory.**
   - The template's `theme/palette.ts` is a Microsoft Fluent UI palette never wired up; `variables.scss` is two SCSS vars.
   - **Default applied:** delete `src/theme/` entirely. Mantine theme will be defined inline in `src/index.tsx` (or alongside the App component) — no separate theme dir until there's enough config to justify one.

5. **GitHub issue templates.**
   - `assignees: iPzard` in both `bug_report.md` and `feature_request.md`.
   - **Default applied:** strip `assignees:` to empty. Reinstate w/ user's GitHub handle when known.

6. **CRA service worker.**
   - `src/serviceWorker.ts` + the `serviceWorker.unregister()` call in `index.tsx` are CRA PWA boilerplate; useless inside Electron.
   - **Default applied:** delete the file and its call.

7. **Sidebar nav vs. design.**
   - Brief says "Library, Compare, Settings". Design uses "Library, Compare, Import" with Settings pinned at the bottom of the nav (and Import as both a button AND its own route).
   - **Default applied:** follow brief — Library, Compare, Settings as routes. Import remains a header button → Mantine Dropzone modal (per brief), not a route. Reconcile with design when feature work begins.

8. **Loader dev-mode HTML.**
   - `utilities/loaders/redux/index.html` says "Starting React Development Server" with a generic logo. Not personalized to the template author, but it's there.
   - **Default applied:** leave as-is for now. Cosmetic; revisit when branding/icons land.

9. **Generic CRA assets.**
   - `public/favicon.ico`, `logo192.png`, `logo512.png`, `src/components/titlebar/img/favicon.png` — all generic CRA placeholders. Installer art under `utilities/{deb,dmg,msi}/images/` is also generic.
   - **Default applied:** leave in place. Replace as a single later pass with a real Torque Pro Assistant icon set.

