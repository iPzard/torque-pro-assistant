// Built-in modules
import { spawn } from 'child_process';
// Electron modules
import {
  app,
  BrowserWindow,
  ipcMain,
  type IpcMainEvent
} from 'electron';
import * as fs from 'fs';
/**
 * Extra modules. get-port v5 publishes via `export = getPort` (CommonJS
 * namespace), which works as a default import under esModuleInterop.
 */
import getPort from 'get-port';
import * as http from 'http';
import * as path from 'path';

/**
 * Electron's `app.isPackaged` is the canonical "is this a packaged build?"
 * signal — no need for the `electron-is-dev` shim. Defined here as a
 * constant so the rest of the file reads naturally.
 */
const isDevMode = !app.isPackaged;


/**
 * Shuts down Electron & Flask.
 *
 * Uses Node's built-in http module rather than axios — this is the only
 * HTTP call from the Electron main process, so a dedicated client is
 * unnecessary. Flask responds with a JSON ack and then exits itself
 * (see app.py /quit). We don't read the body; we just need the request
 * to flush before quitting Electron.
 *
 * Belt-and-braces: schedule app.exit(0) a few seconds after app.quit().
 * app.quit() can be silently no-op'd by hidden windows, deadlocked
 * renderer hangs, or stuck devtools sessions — leaving electron.exe alive
 * after the user thinks they closed the app. app.exit() is unconditional.
 * @param {number} port - Port that Flask server is running on.
 */
const shutdown = (port: number): void => {
  const forceExit = setTimeout(() => app.exit(0), 3000);
  forceExit.unref();

  const finish = (): void => {
    app.quit();
  };

  const req = http.get(`http://127.0.0.1:${port}/quit`, finish);
  req.on('error', finish);
  req.setTimeout(2000, () => {
    req.destroy();
    finish();
  });
};


/**
 * Electron browser windows.
 *
 * @see https://www.electronjs.org/docs/api/browser-window
 */
interface BrowserWindowsRefs {
  loadingWindow?: BrowserWindow | null;
  mainWindow?: BrowserWindow;
}

const browserWindows: BrowserWindowsRefs = {};


/**
 * Creates main window.
 * @param {number} port - Port that Flask server is running on.
 */
const createMainWindow = (port: number): void => {
  const { loadingWindow, mainWindow } = browserWindows;
  if (!mainWindow) throw new Error('mainWindow not initialized before createMainWindow()');

  /**
   * Function to use custom JavaScript in the DOM.
   * @param {string} command - JavaScript to execute in DOM.
   * @param {function} callback - Callback to execute here once complete.
   * @returns {Promise}
   */
  const executeOnWindow = (
    command: string,
    callback?: (result: unknown) => void
  ): Promise<void> => {
    return mainWindow.webContents.executeJavaScript(command)
      .then((result: unknown) => { if (callback) callback(result); })
      .catch(console.error);
  };

  /**
   * Dismiss the splash loadingWindow once the renderer is ready.
   *
   * IMPORTANT: destroy() — not hide(). The 'window-all-closed' event
   * only fires when every BrowserWindow is closed/destroyed; a merely
   * hidden loadingWindow keeps Electron alive in the background, so
   * when the user closes the main window, app.quit() never fires and
   * the electron.exe process leaks.
   *
   * Order matters too: show() the main window BEFORE destroying the
   * splash so the user never sees a flash of empty desktop between
   * the two.
   */
  const dismissSplash = (): void => {
    mainWindow.show();
    loadingWindow?.destroy();
    browserWindows.loadingWindow = null;
  };

  /**
   * Hide the main window until it's actually loaded — we surface the
   * branded splash in front of it on every launch (dev + prod).
   */
  mainWindow.hide();

  if (isDevMode) {

    /**
     * Use 127.0.0.1 (not localhost) — CRA binds IPv4 only when HOST=127.0.0.1
     * is set in scripts/start.js. On Windows, Electron resolves "localhost"
     * to ::1 (IPv6) and the connection is refused.
     */
    mainWindow.loadURL('http://127.0.0.1:3000');

    /**
     * Hide loading window and show main window
     * once the main window is ready.
     */
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.openDevTools({ mode: 'undocked' });

      /**
       * Checks page for errors that may have occurred
       * during the hot-loading process.
       */
      const isPageLoaded = `
        var isBodyFull = document.body.innerHTML !== "";
        var isHeadFull = document.head.innerHTML !== "";
        var isLoadSuccess = isBodyFull && isHeadFull;

        isLoadSuccess || Boolean(location.reload());
      `;

      const handleLoad = (isLoaded: unknown): void => {
        if (isLoaded) dismissSplash();
      };

      /**
       * Checks if the page has been populated with
       * React project. if so, shows the main page.
       */
      executeOnWindow(isPageLoaded, handleLoad);
    });
  }

  /**
   * Production renderer — load the packed build, dismiss the splash as
   * soon as the renderer finishes its first paint.
   *
   * After Phase 5 of TS migration, this file lives at dist-electron/main.js
   * (one level deep from app root). Use app.getAppPath() — works in dev
   * (project root) and prod (asar root) — instead of __dirname.
   */
  else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'build/index.html'));
    mainWindow.webContents.on('did-finish-load', dismissSplash);
  }


  /**
   * Controls the opacity of title bar on focus/blur.
   * @param {number} value - Opacity to set for title bar.
   */
  const setTitleOpacity = (value: number): string => `
    if(document.readyState === 'complete') {
      const titleBar = document.getElementById('electron-window-title-text');
      const titleButtons = document.getElementById('electron-window-title-buttons');

      if(titleBar) titleBar.style.opacity = ${value};
      if(titleButtons) titleButtons.style.opacity = ${value};
    }
  `;


  mainWindow.on('focus', () => executeOnWindow(setTitleOpacity(1)));
  mainWindow.on('blur', () => executeOnWindow(setTitleOpacity(0.5)));

  /**
   * Listen and respond to ipcRenderer events on the frontend.
   * @see `src\utils\services.ts`
   */
  ipcMain.on('app-maximize', () => mainWindow.maximize());
  ipcMain.on('app-minimize', () => mainWindow.minimize());
  ipcMain.on('app-quit', () => shutdown(port));
  ipcMain.on('app-unmaximize', () => mainWindow.unmaximize());
  ipcMain.on('get-port-number', (event: IpcMainEvent) => {
    event.returnValue = port;
  });
};


/**
 * Creates loading window to show while build is created.
 */
const createLoadingWindow = (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const { loadingWindow } = browserWindows;
    if (!loadingWindow) {
      reject(new Error('loadingWindow not initialized'));
      return;
    }

    /**
     * Path to the boot splash shown while the renderer + Flask spin up.
     * Used on every launch (dev compile wait + prod renderer mount).
     * Add new variants under utilities/loaders/<name>/ if you want to swap.
     */
    const loaderHtml = 'utilities/loaders/torque-pro-assistant/index.html';

    try {
      /**
       * app.getAppPath() instead of __dirname so this resolves correctly
       * after main.js relocated to dist-electron/.
       */
      loadingWindow.loadFile(path.join(app.getAppPath(), loaderHtml));

      loadingWindow.webContents.on('did-finish-load', () => {
        loadingWindow.show();
        resolve();
      });
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};


/**
 * Installs developer extensions. The package is a devDependency
 * so it's absent from production bundles (closed issue #23). We therefore
 * require it lazily and swallow MODULE_NOT_FOUND — the installer is purely
 * a dev convenience.
 * @returns {Promise}
 */
type ElectronDevtoolsInstallerModule = typeof import('electron-devtools-installer');

const installExtensions = async (): Promise<unknown> => {
  const isForceDownload = Boolean(process.env.UPGRADE_EXTENSIONS);

  let installer: ElectronDevtoolsInstallerModule;
  try {
    installer = await import('electron-devtools-installer');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND') throw error;
    return undefined;
  }

  const extensions = (['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'] as const)
    .map((extension) => installer.default(installer[extension], isForceDownload));

  return Promise
    .allSettled(extensions)
    .catch(console.error);
};


/**
 * This method will be called when Electron has finished
 * initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
*/
app.whenReady().then(async () => {

  /**
   * Method to set port in range of 3001-3999,
   * based on availability.
   */
  const port = await getPort({
    port: getPort.makeRange(3001, 3999)
  });

  /**
   * Assigns the main browser window on the
   * browserWindows object.
   *
   * preload sits next to main.js in dist-electron/ after compile —
   * use __dirname so this works in dev and inside the asar in prod.
   *
   * Platform-aware chrome:
   *   - macOS uses `titleBarStyle: 'hiddenInset'` so the OS keeps rendering
   *     the real traffic-light buttons inset into our custom 44px titlebar.
   *     The renderer matches by NOT drawing its own min/max/close on Mac.
   *   - Windows / Linux keep `frame: false` (fully frameless) and the
   *     renderer draws Mantine ActionIcon-based min/max/close on the right.
   */
  const platformChrome = process.platform === 'darwin'
    ? {
      titleBarStyle: 'hiddenInset' as const,
      trafficLightPosition: { x: 14, y: 14 }
    }
    : { frame: false };

  /**
   * Default window size + minimums.
   *
   * The design handoff's Library screen targets a wide layout — the
   * sessions table has 12 columns and the toolbar is densely packed.
   * Electron's `BrowserWindow` default (800×600) cuts those off, so
   * pick a 1440×900 starting size and a 1024×640 minimum that keeps
   * the AppShell readable on a small laptop.
   */
  browserWindows.mainWindow = new BrowserWindow({
    ...platformChrome,
    height: 900,
    minHeight: 640,
    minWidth: 1024,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    },
    width: 1440
  });

  /**
   * Boot splash — shown on every launch, dev and prod. Sits in front
   * of the main window while the renderer compiles (dev) or unpacks
   * (prod); destroyed by `dismissSplash` inside `createMainWindow`
   * once `did-finish-load` fires.
   */
  browserWindows.loadingWindow = new BrowserWindow({ frame: false, height: 320, width: 480 });

  if (isDevMode) {
    await installExtensions(); // React, Redux devTools
    createLoadingWindow().then(() => createMainWindow(port));
    spawn(`python app.py ${port}`, { detached: true, shell: true, stdio: 'inherit' });
  }

  /**
   * Production: show the splash first, then load the bundled renderer.
   */
  else {
    createLoadingWindow().then(() => createMainWindow(port));

    /**
     * Production Flask launch.
     *
     * Path lives at process.resourcesPath (the dir CONTAINING app.asar),
     * NOT app.getAppPath() (which is the asar itself — you can't spawn a
     * binary from inside a read-only archive). electron-packager's
     * --extra-resource flag drops the PyInstaller dir at
     *   <install>/resources/app/   on Win/Linux
     *   <install>/Resources/app/   inside the .app bundle on macOS
     * and process.resourcesPath resolves to that parent on every platform.
     *
     * We spawn the Flask binary directly rather than through a shell. That
     * avoids the `start` cmd quirk on Windows (returns immediately, drops
     * stderr) and the `open -gj` path on macOS (swallows errors silently).
     */
    const flaskBinaryName = process.platform === 'win32' ? 'app.exe' : 'app';
    const flaskBinary = path.join(
      process.resourcesPath,
      'app',
      flaskBinaryName
    );

    /**
     * Capture Flask stdout + stderr to a logfile in the OS user-data dir.
     * PyInstaller's `console=False` (in app.spec) means there's no console
     * window in production, so a Flask traceback would otherwise vanish.
     * The log path is platform-specific:
     *   Windows: %APPDATA%\<app-name>\flask.log
     *   macOS:   ~/Library/Application Support/<app-name>/flask.log
     *   Linux:   ~/.config/<app-name>/flask.log
     * Template users who want different routing (rotation, no log at all,
     * separate stdout/stderr) can edit the few lines below.
     */
    const userDataDir = app.getPath('userData');
    fs.mkdirSync(userDataDir, { recursive: true });
    const flaskLogPath = path.join(userDataDir, 'flask.log');
    const flaskLog = fs.createWriteStream(flaskLogPath, { flags: 'a' });
    flaskLog.write(`\n--- Flask launched at ${new Date().toISOString()} on port ${port} ---\n`);

    const flaskProc = spawn(flaskBinary, [String(port)], {
      cwd: path.dirname(flaskBinary),
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    flaskProc.stdout?.pipe(flaskLog);
    flaskProc.stderr?.pipe(flaskLog);
  }

  app.on('activate', () => {
    /**
     * On macOS it's common to re-create a window in the app when the
     * dock icon is clicked and there are no other windows open.
    */
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow(port);
  });

  /**
   * Ensures that only a single instance of the app
   * can run, this correlates with the "name" property
   * used in `package.json`.
   */
  const initialInstance = app.requestSingleInstanceLock();
  if (!initialInstance) app.quit();
  else {
    app.on('second-instance', () => {
      if (browserWindows.mainWindow?.isMinimized()) browserWindows.mainWindow?.restore();
      browserWindows.mainWindow?.focus();
    });
  }

  /**
   * Quit when all windows are closed, except on macOS. There, it's common
   * for applications and their menu bar to stay active until the user quits
   * explicitly with Cmd + Q.
  */
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      shutdown(port);
    }
  });
});
