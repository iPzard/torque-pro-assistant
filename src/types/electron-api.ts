// Single source of truth for the contextBridge surface exposed in preload.js
// (preload.ts after Phase 5). The renderer reads this via the global.d.ts
// declaration on Window; the preload imports it to satisfy the contextBridge
// shape. Keep these three in lock-step:
//   - preload.js / preload.ts  (publishes electronAPI)
//   - src/global.d.ts          (augments Window)
//   - src/types/electron-api.ts (this file — the contract)

export interface ElectronAPI {
  /**
   * Returns the Flask port assigned by main.js. Synchronous so renderer code
   * can use the value at module load time without an extra await.
   */
  getPort: () => number;

  /**
   * Host platform string (`process.platform`) — 'win32' | 'darwin' | 'linux'
   * etc. Read once at preload time so the renderer can pick a platform-
   * appropriate chrome (e.g. native macOS traffic lights vs. custom Windows
   * window controls) without round-tripping IPC.
   */
  platform: NodeJS.Platform;

  maximize: () => void;
  minimize: () => void;
  quit: () => void;
  unmaximize: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
