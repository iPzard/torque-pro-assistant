/**
 * Single source of truth for the contextBridge surface exposed in
 * preload.ts. The renderer reads this via the `Window` augmentation in
 * src/global.d.ts; the preload imports it to satisfy the contextBridge
 * shape. Keep these three in lock-step:
 *   - preload.ts                  (publishes electronAPI)
 *   - src/global.d.ts             (augments Window)
 *   - src/types/electron-api.ts   (this file — the contract)
 */

export interface ElectronAPI {
  /**
   * Returns the Flask port assigned by main.js. Synchronous so renderer code
   * can use the value at module load time without an extra await.
   */
  getPort: () => number;

  maximize: () => void;

  minimize: () => void;
  /**
   * Hands a URL off to the host OS's default browser via Electron's
   * `shell.openExternal`. Used by Settings → About to route to the
   * repo / docs / issue tracker without spawning a new BrowserWindow.
   * The renderer never sees the URL after dispatch — main.ts owns the
   * `shell` module.
   */
  openExternal: (url: string) => void;
  /**
   * Host platform string (`process.platform`) — 'win32' | 'darwin' | 'linux'
   * etc. Read once at preload time so the renderer can pick a platform-
   * appropriate chrome (e.g. native macOS traffic lights vs. custom Windows
   * window controls) without round-tripping IPC.
   */
  platform: NodeJS.Platform;
  quit: () => void;
  unmaximize: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
