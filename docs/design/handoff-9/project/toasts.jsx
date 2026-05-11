/* toasts.jsx — global toast/notification system

   API:
     window.toast({ kind, title, subtitle?, action?, duration? })
     window.toast.success(title, opts?)
     window.toast.info(title, opts?)
     window.toast.warning(title, opts?)
     window.toast.error(title, opts?)
     window.toast.dismiss(id)
     window.toast.clear()

   - `kind`     'success' | 'info' | 'warning' | 'error'   (default 'info')
   - `duration` ms, or 0 / Infinity to stay until dismissed (default 4000)
   - `action`   { label: string, onClick: () => void }     optional, one max

   <ToastHost /> renders the visible stack (max 3 at once, queued newest-last).
   When the queue is empty, ToastHost returns null — no wrapper, no chrome.
*/

const { useState: useToastState, useEffect: useToastEffect, useRef: useToastRef } = React;

const _toastListeners = new Set();
const _toastQueue = [];
let _toastNextId = 1;

function _emit() {
  const snap = _toastQueue.slice();
  _toastListeners.forEach((fn) => fn(snap));
}

function toast(opts) {
  const t = {
    id: _toastNextId++,
    kind: "info",
    duration: 4000,
    title: "",
    ...opts,
  };
  _toastQueue.push(t);
  _emit();
  return t.id;
}
toast.success = (title, rest) => toast({ kind: "success", title, ...(rest || {}) });
toast.info    = (title, rest) => toast({ kind: "info",    title, ...(rest || {}) });
toast.warning = (title, rest) => toast({ kind: "warning", title, ...(rest || {}) });
toast.error   = (title, rest) => toast({ kind: "error",   title, ...(rest || {}) });
toast.dismiss = (id) => {
  const i = _toastQueue.findIndex((t) => t.id === id);
  if (i >= 0) { _toastQueue.splice(i, 1); _emit(); }
};
toast.clear = () => { _toastQueue.length = 0; _emit(); };

window.toast = toast;

// ── Host ────────────────────────────────────────────────────────────────────
function ToastHost() {
  const [items, setItems] = useToastState([]);
  useToastEffect(() => {
    _toastListeners.add(setItems);
    return () => _toastListeners.delete(setItems);
  }, []);

  // Show newest 3 at the bottom; older ones queue silently.
  const visible = items.slice(-3);

  if (visible.length === 0) return null;
  return (
    <div className="toast-host" role="region" aria-label="Notifications" aria-live="polite">
      {visible.map((t) => (
        <ToastItem key={t.id} t={t} onClose={() => toast.dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ t, onClose }) {
  const [leaving, setLeaving] = useToastState(false);
  const timer = useToastRef(null);
  const paused = useToastRef(false);

  function close() {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onClose, 180);
  }
  function arm() {
    if (paused.current) return;
    const d = t.duration;
    if (!d || d === Infinity) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(close, d);
  }

  useToastEffect(() => {
    arm();
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line
  }, []);

  const showProgress = t.duration && t.duration !== Infinity;

  return (
    <div
      className={"toast " + t.kind + (leaving ? " leaving" : "")}
      role="status"
      onMouseEnter={() => { paused.current = true; clearTimeout(timer.current); }}
      onMouseLeave={() => { paused.current = false; arm(); }}>
      <span className="toast-dot" aria-hidden="true" />
      <div className="toast-body">
        <div className="toast-title">{t.title}</div>
        {t.subtitle && <div className="toast-sub">{t.subtitle}</div>}
        {t.action && (
          <div className="toast-actions">
            <button
              type="button"
              className="toast-action"
              onClick={() => {
                try { t.action.onClick && t.action.onClick(); } finally { close(); }
              }}>
              {t.action.label}
            </button>
          </div>
        )}
      </div>
      <button
        type="button"
        className="toast-close"
        aria-label="Dismiss notification"
        onClick={close}>
        {I.cross}
      </button>
      {showProgress && (
        <div
          className="toast-progress"
          style={{ animationDuration: t.duration + "ms" }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

Object.assign(window, { ToastHost });
