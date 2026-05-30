/**
 * QR Snipper – Toast Component
 * Injectable content-script module. Exposes window.QRSnipperToast.show(options).
 *
 * @param {object}   options
 * @param {string}   options.message          Text to display
 * @param {'success'|'error'|'warning'|'info'} [options.type='info']  Toast type
 * @param {number}   [options.duration=3000]  Auto-dismiss delay in ms
 * @param {function} [options.onClose]        Called after the toast is removed
 */
(function () {
  const TOAST_ID = "qr-snip-toast";

  const BG_COLORS = {
    success: "#15803d",
    error:   "#b91c1c",
    warning: "#b45309",
    info:    "#000000",
  };

  function show({ message, type = "info", duration = 3000, onClose } = {}) {
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
