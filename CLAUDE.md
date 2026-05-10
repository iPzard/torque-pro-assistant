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

1. Audit the current state of the repo
   - List every file/folder and what it does
   - Flag anything that is purely template demo code (sample components, demo routes, placeholder Python endpoints, the example toolbar demo, sample Redux slices, etc.)
   - Flag any remaining branding/personalization tied to the original author (iPzard references, JSDoc/TSDoc remnants, license attribution, etc.)

2. Strip the template down
   - Remove all demo/sample code while keeping the working Electron ↔ React ↔ Python plumbing intact
   - Remove author-specific branding and replace with TorqueView placeholders
   - Update LICENSE to keep MIT but with my name as a placeholder ("TODO: your name")

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

