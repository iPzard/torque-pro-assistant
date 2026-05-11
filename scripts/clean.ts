/**
 * @packageDocumentation
 *
 * Workspace cleaner — wipes the build artifacts each sub-project
 * produces (`build/`, `dist/`, `dist-electron/`, `resources/`,
 * `node_modules/.cache/`, PyInstaller's `.pyi-build/`) so a fresh
 * `yarn install && yarn build` is deterministic.
 *
 * Invoked through `scripts/dispatch.ts` — see its `cleanProject()`
 * for the full list of paths swept.
 */
import {
  existsSync,
  readdirSync,
  rmdirSync,
  statSync,
  unlinkSync
} from 'fs';

/**
 * Filesystem cleaner. Recursively removes a path (file or directory),
 * tolerating non-existent paths so a clean step can be idempotent.
 */
export class Cleaner {
  removePath = (pathToRemove: string): void => {

    if (existsSync(pathToRemove)) {
      console.log(`Removing: ${pathToRemove}`);

      if (statSync(pathToRemove).isFile()) unlinkSync(pathToRemove);
      else {
        const files = readdirSync(pathToRemove);

        files.forEach((file) => {
          const filePath = `${pathToRemove}/${file}`;

          if (statSync(filePath).isDirectory()) this.removePath(filePath);
          else unlinkSync(filePath);
        });
        rmdirSync(pathToRemove);
      }
    }
  };
}
