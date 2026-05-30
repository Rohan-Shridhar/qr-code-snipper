/**
 * QR Snipper – Toast Component
 * Injectable content-script module. Exposes window.QRSnipperToast.show(options).
 *
 * Toast props contract:
 * @typedef {Object} ToastOptions
 * @property {string} message                          Text to display (required)
 * @property {'success'|'error'|'warning'|'info'} [type='info']  Toast type
 * @property {number} [duration=3000]                  Auto-dismiss delay in ms
 * @property {function} [onClose]                      Called after the toast is removed
 *
 * @param {ToastOptions} options
 */
(function () {
  const TOAST_ID = "qr-snip-toast";

  function assertToastOptions(options) {
    const allowedTypes = ["success", "error", "warning", "info"];

    if (!options || typeof options !== "object") {
      throw new TypeError("Toast.show: options object is required");
    }

    if (typeof options.message !== "string") {
      throw new TypeError("Toast.show: message must be a string");
    }

    if (options.type != null) {
      if (typeof options.type !== "string" || !allowedTypes.includes(options.type)) {
        throw new TypeError(
          "Toast.show: type must be one of 'success'|'error'|'info'|'warning'"
        );
      }
    }

    if (options.duration != null) {
      if (typeof options.duration !== "number" || !Number.isFinite(options.duration)) {
        throw new TypeError("Toast.show: duration must be a finite number");
      }
    }

    if (options.onClose != null && typeof options.onClose !== "function") {
      throw new TypeError("Toast.show: onClose must be a function");
    }
  }


  const BG_COLORS = {
    success: "#15803d",
    error:   "#b91c1c",
    warning: "#b45309",
    info:    "#000000",
  };

  function show({ message, type = "info", duration = 3000, onClose } = {}) {
    assertToastOptions({ message, type, duration, onClose });

    // Remove any existing toast immediately

    const existing = document.getElementById(TOAST_ID);
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = TOAST_ID;
    toast.className = "qr-snip-toast";

    // Only dynamic parts (per-type background color)
    toast.style.backgroundColor = BG_COLORS[type] || BG_COLORS.info;

    toast.textContent = message;
    document.body.appendChild(toast);

    // Slide in
    requestAnimationFrame(() => {
      toast.style.transform = "translate(-50%, 0)";
      toast.style.opacity   = "1";
    });

    const dismiss = () => {
      // Guard against double-dismiss
      if (!toast.parentNode) return;
      clearTimeout(autoTimer);
      toast.style.transition = "transform 0.35s cubic-bezier(0.47,0,0.745,0.715), opacity 0.25s ease-in";
      toast.style.transform  = "translate(-50%, calc(10vh + 100%))";
      toast.style.opacity    = "0";
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
        if (typeof onClose === "function") onClose();
      }, 350);
    };

    // Auto-dismiss
    const autoTimer = setTimeout(dismiss, duration);

    // Click to dismiss early
    toast.addEventListener("click", dismiss);
  }

  window.QRSnipperToast = { show };
})();
