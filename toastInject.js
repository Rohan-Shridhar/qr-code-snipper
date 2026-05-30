(function () {
  const moduleUrl = chrome.runtime.getURL("Toast.js");

  window.__qrSnipperShowToast = function (message, duration) {
    return import(moduleUrl)
      .then(function (mod) {
        mod.default(message, duration);
      })
      .catch(function (err) {
        console.error("[QR Snipper] Toast failed to load:", err);
      });
  };
})();
