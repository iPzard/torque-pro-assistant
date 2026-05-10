// Flat config (ESLint 9+) authored in TypeScript. ESLint 9.18+ loads
// eslint.config.ts via `jiti` (declared in devDependencies).
//
// This config is the project's single source of truth for sort order +
// import-shape rules. Every formatting rule is auto-fixable so saving in
// VS Code (with ESLint extension's `source.fixAll.eslint` action) reformats
// in place. Run `yarn lint --fix` to apply across the tree.
//
// Rule keys are alphabetised within each rules object — sort-keys is
// project-wide, so this config must satisfy its own rule.

import js from '@eslint/js';
import importX from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sortKeysFix from 'eslint-plugin-sort-keys-fix';
import typescriptSortKeys from 'eslint-plugin-typescript-sort-keys';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // -------------------------------------------------------------------
  // Ignored paths — replaces .eslintignore + the old `ignorePatterns`.
  // -------------------------------------------------------------------
  {
    ignores: [
      '.pyi-build/',
      'build/',
      'coverage/',
      'dist-electron/',
      'dist/',
      'docs/',
      'node_modules/',
      'resources/'
    ]
  },

  // Base JS recommendations — applies to every linted file.
  js.configs.recommended,

  // typescript-eslint recommendations (type-aware).
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,

  // -------------------------------------------------------------------
  // Project-wide configuration applied to source files.
  // -------------------------------------------------------------------
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        // Three tsconfigs cover the three contexts: renderer (src/),
        // electron (main.ts + preload.ts), and scripts (scripts/**/*.ts).
        // typescript-eslint walks them in order until one includes the
        // linted file. eslint.config.ts itself is excluded from
        // type-aware linting via the override block below.
        project: [
          './tsconfig.json',
          './tsconfig.electron.json',
          './tsconfig.scripts.json'
        ],
        tsconfigRootDir: import.meta.dirname
      },
      sourceType: 'module'
    },
    plugins: {
      'import-x': importX,
      'jsx-a11y': jsxA11y,
      'no-relative-import-paths': noRelativeImportPaths,
      react,
      'react-hooks': reactHooks,
      'simple-import-sort': simpleImportSort,
      'sort-keys-fix': sortKeysFix,
      'typescript-sort-keys': typescriptSortKeys
    },
    rules: {
      // Spread presets first — keys before/after a spread are sorted
      // independently, so this group lives outside the literal-key block.
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...reactHooks.configs['recommended-latest'].rules,
      ...jsxA11y.flatConfigs.recommended.rules,

      // Literal keys, alphabetised (sort-keys-fix enforces this on
      // object literals; sort-keys itself stays off because the built-in
      // rule isn't auto-fixable).
      '@typescript-eslint/consistent-type-imports': ['warn', {
        // `typeof import('./foo')` is the canonical pattern for typing a
        // module's shape inside jest mocks; leave it alone instead of
        // forcing a top-level `import type` rewrite that would break the
        // `requireActual` flow.
        disallowTypeAnnotations: false,
        fixStyle: 'separate-type-imports',
        prefer: 'type-imports'
      }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-use-before-define': ['error', { functions: false }],
      'comma-dangle': ['warn', 'never'],
      'comma-spacing': ['warn', { after: true, before: false }],
      'import-x/extensions': ['warn', 'ignorePackages', {
        js: 'never', jsx: 'never', ts: 'never', tsx: 'never'
      }],
      'import-x/no-extraneous-dependencies': 'off',
      'import-x/prefer-default-export': 'off',
      indent: ['warn', 2, { SwitchCase: 1 }],
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/interactive-supports-focus': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Forbid relative parent imports (`../foo`). `rootDir: 'src'` makes
      // any reference outside the current folder rewrite to an absolute
      // path rooted at the matching src/ subdir. `./foo` and `.` stay
      // valid for same-folder imports per the project rules.
      'no-promise-executor-return': 'error',
      'no-relative-import-paths/no-relative-import-paths': ['error', {
        allowSameFolder: true,
        prefix: '',
        rootDir: 'src'
      }],
      'no-unused-vars': 'off',
      'no-use-before-define': 'off',
      'object-curly-spacing': ['warn', 'always'],
      'prefer-const': 'warn',
      'prefer-template': 'warn',
      quotes: ['warn', 'single', { avoidEscape: true }],
      'react/button-has-type': 'error',
      'react/destructuring-assignment': 'off',
      'react/function-component-definition': ['error', {
        namedComponents: 'function-declaration',
        unnamedComponents: 'arrow-function'
      }],
      'react/jsx-curly-spacing': ['warn', 'always'],
      'react/jsx-filename-extension': 'off',
      'react/jsx-props-no-spreading': 'off',
      // JSX prop order — alphabetical (case-insensitive), callbacks/short
      // hands intermixed. Auto-fixable.
      'react/jsx-sort-props': ['warn', {
        callbacksLast: false,
        ignoreCase: true,
        noSortAlphabetically: false,
        reservedFirst: true,
        shorthandFirst: false
      }],
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/require-default-props': 'off',
      semi: ['warn', 'always'],
      // simple-import-sort handles BOTH grouping and alphabetisation of
      // imports; auto-fixable so save reformats. Five groups in order:
      //   1. side-effect (e.g. `import 'foo.css'`)
      //   2. node-builtins + external packages
      //   3. absolute imports rooted at src/ (components, state, types, utils)
      //   4. relative same-folder imports (`./foo`, `.`)
      //   5. style / asset imports
      'simple-import-sort/exports': 'warn',
      'simple-import-sort/imports': ['warn', {
        groups: [
          ['^\\u0000'],
          ['^node:', '^@?\\w'],
          ['^(components|state|types|utils)(/|$)'],
          ['^\\.'],
          ['^.+\\.s?css$']
        ]
      }],
      'sort-keys': 'off',
      // sort-keys-fix replaces the built-in rule because it can auto-fix.
      'sort-keys-fix/sort-keys-fix': ['warn', 'asc', { caseSensitive: false }],
      'typescript-sort-keys/interface': 'warn',
      'typescript-sort-keys/string-enum': 'warn'
    },
    settings: {
      'import-x/resolver': {
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
        typescript: { project: ['./tsconfig.json', './tsconfig.electron.json'] }
      },
      react: { version: 'detect' }
    }
  },

  // -------------------------------------------------------------------
  // Per-area overrides.
  // -------------------------------------------------------------------
  {
    // Build/dev scripts intentionally console.log progress and errors —
    // they are CLI entry points, not production code.
    files: ['scripts/**/*.ts'],
    rules: { 'no-console': 'off' }
  },
  {
    // Test files: relax type-aware rules that fight common test patterns.
    files: ['**/*.test.{ts,tsx}', 'src/setupTests.ts'],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off'
    }
  },
  {
    // Electron main + preload sit at the repo root and import each other
    // by relative path, plus `./src/types/...`. Those *are* relative parent
    // imports from src/'s perspective, but main/preload aren't under src/
    // so the `rootDir: 'src'` rule shouldn't apply to them.
    files: ['main.ts', 'preload.ts'],
    rules: { 'no-relative-import-paths/no-relative-import-paths': 'off' }
  },
  {
    // eslint.config.ts itself isn't in any tsconfig — disable type-aware
    // rules so the parser doesn't complain about missing project info.
    extends: [tseslint.configs.disableTypeChecked],
    files: ['eslint.config.ts']
  }
);
