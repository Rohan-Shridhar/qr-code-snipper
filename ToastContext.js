/**
 * QR Snipper – ToastContext
 *
 * Injectable singleton that manages a queue of toasts and renders them all
 * inside a single ToastContainer div. Safe to inject multiple times.
 *
 * Toast props contract:
 * @typedef {Object} ToastOptions
 * @property {string} message                          Text to display (required)
 * @property {'success'|'error'|'warning'|'info'} [type='info'] Toast type
 * @property {number} [duration=3000]                  Auto-dismiss delay in ms
 * @property {function} [onClose]                      Called after the toast is removed
 *
 * Exposes: window.QRSnipperToastContext
 *   .show({ message, type, duration, onClose }) → id
 *
 *   .success(message, duration?, onClose?)      → id

 *   .error(message, duration?, onClose?)        → id
 *   .warning(message, duration?, onClose?)      → id
 *   .info(message, duration?, onClose?)         → id
 *   .dismiss(id)
 */
(function () {
  // Re-use existing context if already injected
  if (window.QRSnipperToastContext) return;

  const CONTAINER_ID = "qr-snip-toast-container";

  const BG_COLORS = {
    success: "#15803d",
    error:   "#b91c1c",
    warning: "#b45309",
    info:    "#000000",
  };

  let idCounter = 0;

  // Active toast map: id → { el, timer }
  const queue = new Map();

  // ─── ToastContainer ────────────────────────────────────────────────────────

  function getContainer() {
    let container = document.getElementById(CONTAINER_ID);
    if (!container) {
      container = document.createElement("div");
      container.id = CONTAINER_ID;
      Object.assign(container.style, {
        position:      "fixed",
        bottom:        "28px",
        left:          "50%",
        transform:     "translateX(-50%)",
        display:       "flex",
        flexDirection: "column",      // newest appended last → appears at bottom
        alignItems:    "center",
        gap:           "8px",
        zIndex:        "2147483647",
        pointerEvents: "none",        // container itself is click-through
        width:         "max-content",
        maxWidth:      "min(420px, 90vw)",
      });
      document.body.appendChild(container);
    }
    return container;
  }

  function maybeRemoveContainer() {
    if (queue.size === 0) {
      const container = document.getElementById(CONTAINER_ID);
      if (container) container.remove();
    }
  }

  // ─── Individual Toast ───────────────────────────────────────────────────────

  function createToastElement({ id, message, type }) {
    const el = document.createElement("div");
    el.dataset.toastId = String(id);
    el.className = "qr-snip-toast qr-snip-toast-item";

    // Only dynamic parts (per-type background color)
    el.style.backgroundColor = BG_COLORS[type] || BG_COLORS.info;

    el.textContent = message;
    return el;
  }

  // ─── Core API ───────────────────────────────────────────────────────────────

  function dismiss(id) {
    const entry = queue.get(id);
    if (!entry) return;

    clearTimeout(entry.timer);
    queue.delete(id);

    const { el, onClose } = entry;
    el.style.opacity   = "0";
    el.style.transform = "translateY(8px) scale(0.97)";

    setTimeout(() => {
      if (el.parentNode) el.remove();
      maybeRemoveContainer();
      if (typeof onClose === "function") onClose();
    }, 280);
  }

  function assertToastOptions(options) {
    const allowedTypes = ["success", "error", "warning", "info"];

    if (!options || typeof options !== "object") {
      throw new TypeError("ToastContext.show: options object is required");
    }

    if (typeof options.message !== "string") {
      throw new TypeError("ToastContext.show: message must be a string");
    }

    if (options.type != null) {
      if (
        typeof options.type !== "string" ||
        !allowedTypes.includes(options.type)
      ) {
        throw new TypeError(
          "ToastContext.show: type must be one of 'success'|'error'|'info'|'warning'"
        );
      }
    }

    if (options.duration != null) {
      if (typeof options.duration !== "number" || !Number.isFinite(options.duration)) {
        throw new TypeError("ToastContext.show: duration must be a finite number");
      }
    }

    if (options.onClose != null && typeof options.onClose !== "function") {
      throw new TypeError("ToastContext.show: onClose must be a function");
    }
  }

  function show({ message, type = "info", duration = 3000, onClose } = {}) {
    assertToastOptions({ message, type, duration, onClose });

    const id        = ++idCounter;

    const container = getContainer();
    const el        = createToastElement({ id, message, type });

    container.appendChild(el);

    // Animate in on next frame
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translateY(0) scale(1)";
    });

    const timer = duration > 0
      ? setTimeout(() => dismiss(id), duration)
      : null;

    queue.set(id, { el, timer, onClose });

    // Click to dismiss early
    el.addEventListener("click", () => dismiss(id));

    return id;
  }

  function success(message, duration, onClose) {
    return show({ message, type: "success", duration, onClose });
  }
  function error(message, duration, onClose) {
    return show({ message, type: "error", duration, onClose });
  }
  function warning(message, duration, onClose) {
    return show({ message, type: "warning", duration, onClose });
  }
  function info(message, duration, onClose) {
    return show({ message, type: "info", duration, onClose });
  }

  window.QRSnipperToastContext = { show, success, error, warning, info, dismiss };
})();
