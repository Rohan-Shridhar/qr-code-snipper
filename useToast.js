/**
 * QR Snipper – useToast
 *
 * Factory function that returns the ToastContext API.
 * Call after ToastContext.js has been injected.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.show({ message: 'Hello!', type: 'success', duration: 3000 });
 *   toast.success('Saved!');
 *   toast.error('Something went wrong');
 *   toast.warning('Already saved');
 *   toast.info('FYI...');
 *   toast.dismiss(id);  // dismiss a specific toast by the id returned from show()
 *
 * @returns {{ show, success, error, warning, info, dismiss }}
 */
(function () {
  if (window.useToast) return;

  function useToast() {
    if (!window.QRSnipperToastContext) {
      console.warn(
        "[useToast] QRSnipperToastContext not found. " +
        "Ensure ToastContext.js is injected before calling useToast()."
      );
      const noop = () => {};
      return { show: noop, success: noop, error: noop, warning: noop, info: noop, dismiss: noop };
    }
    return window.QRSnipperToastContext;
  }

  window.useToast = useToast;
})();
