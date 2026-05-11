/**
 * @packageDocumentation
 *
 * Build orchestrator for the three sub-projects: the CRA React
 * renderer (`build/`), the Electron main + preload TypeScript
 * (`dist-electron/`), and the PyInstaller-packed Flask binary
 * (`resources/app/`). Each runs in its own child process via
 * `spawnSync` and inherits stdio so progress streams to the parent
 * terminal in real time.
 *
 * Invoked indirectly through `scripts/dispatch.ts` (`yarn build` etc.)
 * — the dispatcher routes the CLI args here.
 */
import { spawnSync, type SpawnSyncOptions } from 'child_process';

const spawnOptions: SpawnSyncOptions = {
  shell: true,
  stdio: 'inherit'
};

/**
 * Build orchestrator for the React renderer, the Electron main /
 * preload bundle, and the Python service. Each method shells out to
 * the matching native build tool (`react-scripts build`, `tsc -p
 * tsconfig.electron.json`, `pyinstaller`) so this class stays a thin
 * coordinator.
 */
export class Builder {

  /**
   * Creates Electron, React, and Python production builds.
   */
  buildAll = (): void => {
    const { buildElectron, buildPython, buildReact } = this;

    buildElectron();
    buildPython();
    buildReact();
  };

  /**
   * Compiles main.ts + preload.ts to dist-electron/.
   * package.json "main" points at dist-electron/main.js, so this output must
   * exist before electron-packager bundles the asar.
   */
  buildElectron = (): void => {
    console.log('Compiling Electron main + preload (TypeScript)...');
    spawnSync('tsc -p tsconfig.electron.json', spawnOptions);
  };

  /**
   * Creates production build of Python back end. Uses
   * app.spec (committed) so hiddenimports and bundled data files survive
   * PyInstaller's static-analysis blind spots — see the comment block at
   * the top of app.spec.
   */
  buildPython = (): void => {
    console.log('Creating Python distribution files...');

    const options = [
      '--noconfirm', // Don't confirm overwrite
      '--distpath ./resources', // Dist (out) path
      /**
       * PyInstaller's intermediate workpath defaults to ./build/<name>/.
       * That collides with CRA's `react-scripts build` which clears ./build/
       * and refuses to rmdir a non-empty subdirectory — yarn build:package:*
       * would fail with "ENOTEMPTY: directory not empty, rmdir 'build/app'".
       * Route PyInstaller's scratch dir outside ./build/.
       */
      '--workpath ./.pyi-build'
    ].join(' ');

    /**
     * Invoke via `python -m PyInstaller` so the build works even when
     * pip's user scripts directory isn't on PATH (common on Windows).
     */
    spawnSync(`python -m PyInstaller ${options} app.spec`, spawnOptions);
  };

  /**
   * Creates production build of React front end.
   *
   * DISABLE_ESLINT_PLUGIN=true: CRA 5 ships eslint-config-react-app and
   * loads it inside the webpack ESLint plugin. Combined with this project's
   * .eslintrc.cjs (which already lists `plugins: ['react']`), the build fails
   * with "Plugin 'react' was conflicted between …". Disabling CRA's plugin
   * keeps the build clean; standalone `yarn lint` still runs the airbnb
   * config we want.
   */
  buildReact = (): void => {
    console.log('Creating React distribution files...');
    spawnSync('cross-env DISABLE_ESLINT_PLUGIN=true react-scripts build', spawnOptions);
  };
}
