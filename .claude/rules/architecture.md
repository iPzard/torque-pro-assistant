# Architecture rules

Hard rules for how files, folders, tests, identifiers, and comments are organized in `torque-pro-assistant`. Apply to all new code; fix existing code that violates them when you touch the surrounding folder.

## File layout

1. **Kebab-case for every file / folder we control.** Folder name is the kebab form of the thing's camelCase identifier — `someUtil` lives in `some-util/index.ts`, exported as `someUtil`. Exceptions: framework-mandated names (`setupTests.ts`, `tsconfig*.json`, `package.json`) and Python files (snake_case).

2. **Folder-per-thing with `index.{tsx,ts}`.** Every component, page, hook, slice, or util lives in its own kebab-cased folder. Implementation is `index.tsx` (React) or `index.ts` (logic). Optional sibling `index.module.scss` when CSS modules are needed. Imports stay clean: `import Library from 'components/pages/library'`.

3. **Tests colocated as `index.test.{tsx,ts}`.** Each component / page / util / hook / slice gets a unit test using **React Testing Library**.
   - **Always query by `data-testid`** — never `getByText`, never `getByRole({ name })`. Add `data-testid` to every element you assert against. Copy changes often; tests shouldn't.
   - **Use `it(...)` not `test(...)`.**
   - Test IDs follow the kebab-case rule. Predictable shape: `<scope>-<element>` (e.g. `library-page`, `library-import-button`, `app-name`, `app-window-control-minimize`, `app-nav-link-library`).
   - **Tests don't reach across.** A component's test asserts only that component's behavior. To verify routing or composition, mock the children — don't assert the rendered output of B inside A's test.

4. **Barrels at `<thing>/utils/index.{tsx,ts}` only.** A `utils/` folder gets a barrel re-exporting siblings so consumers write `import { someUtil, otherUtil } from '<path>/utils'`. Shared utils → `src/utils/index.ts`. Page- or component-local utils → `<thing>/utils/index.tsx`. **Do NOT barrel-export components, pages, hooks, types, slices, or anything else** — import those by direct path.

5. **CSS modules only for bespoke styling.** Mantine carries 95% via CSS variables / component props. For custom CSS, use a sibling `index.module.scss` imported as `import styles from './index.module.scss'`. No global selectors inside module files.

   **Component-scoped vs. global CSS.** Styles that belong to a single component (the component's internal layout, its variants, its private animations) live in that component's `index.module.scss` — not in `src/index.scss`. Only styles that are *applied app-wide* — design-system tokens (CSS variables), typography / spacing utilities (`.mono`, `.dim`, `.row`, `.col`), and cross-cutting design-system primitives used by many independent surfaces as raw HTML classes (`.btn`, `.pill`, `.tbl`, `.kbd`, `.card`, `.page`) — earn a spot in the global stylesheet. When something is only used by one component (or its sub-components), keep it local. Audit `src/index.scss` periodically and migrate one-off rules into the owning component's module.

   **CSS class names are kebab-case.** Same rule as files / folders. Bad: `.bodyFlush`, `.windowControls`. Good: `.body-flush`, `.window-controls`. Inside `index.module.scss` files, kebab-case the class then access via bracket notation in JSX (`styles['body-flush']`) — CRA's `css-loader` keeps the source name as-is by default.

6. **Sub-components nest under their parent.** A sub-component used only by `componentA` lives at `component-a/sub-component/index.tsx` — not hoisted to the shared component pool. Sub-components carry their own `utils/` and barrel. Things sit only as high in the tree as they need to to feed the current directory + descendants.

7. **No utils inside component / page files.** Any named function defined inside a component (event handlers, predicates, fetchers) gets extracted to a util folder with its own test. Anonymous one-line lambdas inline in JSX (`onClick={() => navigate(...)}`) are fine.

## Code style

8. **Descriptive variable names.** No single-letter identifiers. `state` not `s`, `error` not `e`. The reader should never need to inspect surrounding code to know what a variable holds.

9. **Every component / util / hook / slice gets a TSDoc block.** A `/** ... */` JSDoc comment above each default export (and each named export of utils) describing what the thing does, its parameters, and its return. Feeds `yarn build:docs`. Keep narrative inline comments separate — JSDoc above the export, `//` for in-body explanations.

10. **Multi-line comments use `/** ... */` blocks.** Any narrative comment spanning two or more lines must be a `/** */` block (each interior line prefixed by ` * `). Single-line `// ...` is fine for one-line explanations and trailing comments. Decorative section dividers stay as `//` or get folded into a single `/** */` block containing the divider rule.

11. **American English throughout.** `behavior` not `behaviour`, `color` not `colour`, `center` not `centre`, `organize` not `organise`, `analyze`, `realize`, `favorite`, `recognize`, `catalog`, `artifact`. Applies to comments, doc text, identifiers, commit subjects.

## Example shape

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
      compare-logs/
        index.tsx
        index.test.tsx
        utils/
          some-util/
            index.tsx
            index.test.tsx
          index.tsx
        sub-component/       ← used only by compare-logs
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

## How to apply

- New code matches the shape from day one.
- Existing code gets fixed when you touch the surrounding folder. Don't open a "fix all imports" PR unless asked.
- If unsure whether something is a "util" (gets a barrel) or a "page/component" (no barrel), the heuristic is: utils are pure-ish functions / non-rendering modules; anything that exports a React component is not a util.
- When extracting an inline handler, lift the closed-over values into parameters so the util is testable in isolation. `isActive` reads `location.pathname` from a closure → extract as `isActive(pathname, path)`.
