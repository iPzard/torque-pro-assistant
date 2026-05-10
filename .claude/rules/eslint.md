# ESLint / TypeScript / commit rules

Hard rules for the project's lint surface + TypeScript hygiene + commit-message style. Every formatting rule below is auto-fixable; saving in VS Code (with the ESLint extension + `source.fixAll.eslint` action on save, wired in `.vscode/settings.json`) reformats automatically. Run `yarn lint --fix` to apply across the tree.

## Sort everything (alphabetical, auto-fixable)

- **Imports + exports** — `simple-import-sort/imports` + `simple-import-sort/exports`. Five-group order: side-effect, external/node-builtins, absolute (`components|state|types|utils`), relative (`./`), CSS/SCSS side-effect.
- **Object literal keys** — `sort-keys-fix/sort-keys-fix` (case-insensitive ascending). Replaces the non-fixable built-in `sort-keys`.
- **JSX prop order** — `react/jsx-sort-props` (case-insensitive, `reservedFirst`).
- **TS interface / type members + string enums** — `typescript-sort-keys/interface` and `typescript-sort-keys/string-enum`.

If a save reformats things in an order you didn't write — that's the point.

## Absolute imports under `src/`

- `tsconfig.json` sets `baseUrl: "src"`. CRA 5 / jest auto-resolve.
- ESLint enforces via `no-relative-import-paths/no-relative-import-paths` with `rootDir: 'src'` — auto-fixes any `../foo` to the absolute equivalent.
- Same-folder imports use `./` or `.` (both accepted). Anything reaching outside the current folder must be absolute. Valid absolute roots: `components/`, `state/`, `types/`, `utils/` (the top-level `src/` subdirs).
- Electron-side code (`main.ts`, `preload.ts`) uses its own tsconfig and isn't covered by the rule.

**Plugin gap:** `eslint-plugin-no-relative-import-paths` only flags `../` traversal — it does NOT catch `./subdir/path` (child traversal from root files like `src/index.tsx`). Audit those manually; auto-fix doesn't reach them.

## TypeScript hygiene

- `@typescript-eslint/no-explicit-any: error` — never use `any`. Use `unknown` and narrow.
- `@typescript-eslint/consistent-type-imports`: separate type-only imports. Inline `typeof import('./foo')` is allowed (used in jest mocks to type the shape of a require'd module) via `disallowTypeAnnotations: false`.
- Prefer `interface` for public surfaces (props, bridge contracts); `type` for unions / aliases.
- `readonly` arrays / fields for immutable data.
- No non-null `!` assertions without a one-line `// why:` comment.

## Naming

Types, interfaces, enums, components, utils, hooks all carry self-explanatory names. `SessionDataRow` not `Row`; `ElectronAPI` not `API`; verb-led utils (`handleDrop`, `pingFlask`); predicate-led booleans (`isActive`). No initialism collisions — two-letter acronyms stay all-caps (`IO`, `TS`); 3+ letter acronyms title-case the rest (`HttpClient`, `JsonResponse`).

## Commit subjects

**Always start commit subjects with a gitmoji.** Format `:emoji: scope: subject`. Common picks:

- `:sparkles:` new feature
- `:bug:` bug fix
- `:recycle:` refactor (no behavior change)
- `:memo:` docs
- `:wrench:` config / chore
- `:white_check_mark:` tests
- `:package:` deps
- `:art:` style / structure (no behavior change)
- `:rotating_light:` lint / type fixes
- `:fire:` removing code or files
- `:rewind:` revert / downgrade
- `:rocket:` deploy / release
- `:lock:` security
