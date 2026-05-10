// Talks to the Python/Flask backend via fetch. The Flask port is provided by
// the preload bridge (see preload.ts → contextBridge → window.electronAPI).
// The renderer no longer has direct Electron access (contextIsolation: true).
//
// Flask is spawned by Electron in parallel with the React dev server, so the
// first few requests after startup may race the Flask bind. fetchWithRetry
// retries on connection-refused-style errors with exponential backoff up to
// `maxAttempts` total attempts.
//
// The port is read lazily and cached on first request so jest can stub
// window.electronAPI before any module-load reads fire.

let portCache: number | undefined;

/**
 * Resolves the Flask port via the preload bridge, caching the result so
 * subsequent calls are free. Reading lazily keeps tests able to install a
 * stub `window.electronAPI` before the first request fires.
 *
 * @returns The port number Flask is bound to in the running window.
 */
const resolvePort = (): number => {
  if (portCache === undefined) portCache = window.electronAPI.getPort();
  return portCache;
};

const RETRYABLE_NETWORK_ERROR = /Failed to fetch|NetworkError|ECONNREFUSED|connection refused/i;

/**
 * fetch wrapper that retries on connection-refused-style network errors.
 * Used by `get` and `post` to absorb the race between the React dev
 * server and the Flask process during startup.
 *
 * @param requestUrl - Absolute URL to fetch.
 * @param requestInit - Optional fetch init (method, headers, body).
 * @param maxAttempts - Total attempts before re-throwing the last error.
 * @returns The fetch `Response` from the first successful attempt.
 */
const fetchWithRetry = async (
  requestUrl: string,
  requestInit?: RequestInit,
  maxAttempts = 6
): Promise<Response> => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await (requestInit === undefined ? fetch(requestUrl) : fetch(requestUrl, requestInit));
    } catch (error) {
      lastError = error;
      const message = (error instanceof Error ? error.message : '') || '';
      if (!RETRYABLE_NETWORK_ERROR.test(message) || attempt === maxAttempts) {
        throw error;
      }
      // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms (capped)
      const delay = Math.min(100 * 2 ** (attempt - 1), 1600);
      await new Promise<void>((resolve) => { setTimeout(resolve, delay); });
    }
  }
  throw lastError;
};

/**
 * Issues a GET to the Python/Flask backend at the bridge-supplied port.
 *
 * @param route - Path under the Flask root (no leading slash) — e.g.
 *   `'ping'` or `'sessions/abc'`.
 * @param onSuccess - Callback invoked with the parsed JSON body.
 * @param onError - Optional callback for fetch failures. Defaults to
 *   `console.error`.
 */
export const get = <ResponseBody = unknown>(
  route: string,
  onSuccess: (data: ResponseBody) => void,
  onError?: (error: unknown) => void
): void => {
  fetchWithRetry(`http://127.0.0.1:${resolvePort()}/${route}`)
    .then((response) => response.json() as Promise<ResponseBody>)
    .then(onSuccess)
    .catch((error) => (onError ? onError(error) : console.error(error)));
};

/**
 * Issues a POST to the Python/Flask backend at the bridge-supplied port,
 * with `Content-Type: application/json`.
 *
 * @param requestBody - Body payload (already serialised) to send.
 * @param route - Path under the Flask root (no leading slash).
 * @param onSuccess - Callback invoked with the parsed JSON body.
 * @param onError - Optional callback for fetch failures. Defaults to
 *   `console.error`.
 */
export const post = <RequestBody extends BodyInit | null | undefined, ResponseBody = unknown>(
  requestBody: RequestBody,
  route: string,
  onSuccess: (data: ResponseBody) => void,
  onError?: (error: unknown) => void
): void => {
  fetchWithRetry(`http://127.0.0.1:${resolvePort()}/${route}`, {
    body: requestBody,
    headers: { 'Content-type': 'application/json' },
    method: 'POST'
  })
    .then((response) => response.json() as Promise<ResponseBody>)
    .then(onSuccess)
    .catch((error) => (onError ? onError(error) : console.error(error)));
};
