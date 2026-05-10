// Window-control helpers backed by the preload bridge (window.electronAPI).
// See preload.ts for the exposed API.

/**
 * Window-control facade for the renderer. Each method delegates to the
 * matching `window.electronAPI` channel exposed by the preload bridge,
 * which forwards an `ipcRenderer.send` to the main process.
 *
 * The facade exists so component code never reaches into `window.electronAPI`
 * directly — making the surface easy to swap out in tests and future
 * platforms (e.g. a web build with a mocked bridge).
 */
export const app = {
  /** Maximize the program window. */
  maximize: (): void => window.electronAPI.maximize(),
  /** Minimize the program window. */
  minimize: (): void => window.electronAPI.minimize(),
  /** Close the program window and tear down the Flask backend. */
  quit: (): void => window.electronAPI.quit(),
  /** Restore (unmaximize) the program window. */
  unmaximize: (): void => window.electronAPI.unmaximize()
};
