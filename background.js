importScripts("jsQR.js");

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "CAPTURE") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, async (dataUrl) => {
      try {
        const blob = await fetch(dataUrl).then((r) => r.blob());
        const bitmap = await createImageBitmap(blob);

        const rect = sanitizeRect(message.rect, bitmap.width, bitmap.height);

        const canvas = new OffscreenCanvas(rect.width, rect.height);
        const ctx = canvas.getContext("2d");

        ctx.drawImage(
          bitmap,
          rect.x,
          rect.y,
          rect.width,
          rect.height,
          0,
          0,
          rect.width,
          rect.height
        );
        console.log("Canvas size:", canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        console.log("ImageData OK:", imageData.width, imageData.height);
        console.log("jsQR available?", typeof jsQR);

        const code = jsQR(imageData.data, imageData.width, imageData.height);
        console.log("jsQR executed");

        if (code) {
          console.log("QR Code data:", code.data);
          chrome.storage.local.get("snippedQR", (result) => {
            let qrdata = result.snippedQR || [];
            if (!qrdata.includes(code.data)) {
              qrdata.push(code.data);
              chrome.storage.local.set({ snippedQR: qrdata });
            } else {
              chrome.scripting.executeScript({
                target: { tabId: sender.tab.id },
                func: (url) => {
                  const existing = document.getElementById("qr-snip-toast");
                  if (existing) existing.remove();

                  const toast = document.createElement("div");
                  toast.id = "qr-snip-toast";
                  Object.assign(toast.style, {
                    position: "fixed",
                    bottom: "28px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "#000",
                    color: "#fff",
                    padding: "10px 18px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    zIndex: "2147483647",
                    maxWidth: "420px",
                    wordBreak: "break-all",
                    textAlign: "center",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
                    opacity: "0",
                    transition: "opacity 0.2s ease",
                  });
                  toast.textContent = `Already saved: ${url}`;
                  document.body.appendChild(toast);
                  requestAnimationFrame(() => {
                    toast.style.opacity = "1";
                  });
                  setTimeout(() => {
                    toast.style.opacity = "0";
                    setTimeout(() => toast.remove(), 200);
                  }, 3000);
                },
                args: [code.data],
              });
            }
          });
        } else {
          console.log("No QR code found.");
        }
      } catch (err) {
        console.error("Error decoding QR:", err);
      }
    });
  }
});

function sanitizeRect(rect, imageWidth, imageHeight) {
  const x = Math.max(0, Math.min(rect.left, imageWidth - 1));
  const y = Math.max(0, Math.min(rect.top, imageHeight - 1));
  const width = Math.max(1, Math.min(rect.width, imageWidth - x));
  const height = Math.max(1, Math.min(rect.height, imageHeight - y));
  return { x, y, width, height };
}
