const TOAST_FONT = "14px system-ui, -apple-system, sans-serif";
const HORIZONTAL_PADDING_RATIO = 0.2;

let stylesLoaded = false;

function loadStyles() {
  if (stylesLoaded || document.getElementById("toast-styles")) {
    return;
  }
  const link = document.createElement("link");
  link.id = "toast-styles";
  link.rel = "stylesheet";
  link.href = new URL("./Toast.css", import.meta.url).href;
  document.head.appendChild(link);
  stylesLoaded = true;
}

function measureMessageWidth(message) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = TOAST_FONT;
  return context.measureText(message).width;
}

function applyContentPadding(toast, message) {
  const textWidth = measureMessageWidth(message);
  const horizontalPadding = textWidth * HORIZONTAL_PADDING_RATIO;
  toast.style.paddingTop = "10px";
  toast.style.paddingBottom = "10px";
  toast.style.paddingLeft = `${horizontalPadding}px`;
  toast.style.paddingRight = `${horizontalPadding}px`;
}

function waitForBottomTransition(toast, raised) {
  return new Promise((resolve) => {
    const onTransitionEnd = (event) => {
      if (event.propertyName !== "bottom") {
        return;
      }
      const isRaised = toast.classList.contains("toast--raised");
      if (isRaised === raised) {
        toast.removeEventListener("transitionend", onTransitionEnd);
        resolve();
      }
    };
    toast.addEventListener("transitionend", onTransitionEnd);
  });
}

function createToastElement(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  applyContentPadding(toast, message);
  return toast;
}

export default function Toast(message, duration = 2000) {
  if (!message) {
    return;
  }

  loadStyles();

  const toast = createToastElement(message);
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add("toast--raised");
    });
  });

  void (async () => {
    await waitForBottomTransition(toast, true);
    await new Promise((resolve) => setTimeout(resolve, duration));
    toast.classList.remove("toast--raised");
    await waitForBottomTransition(toast, false);
    toast.remove();
  })();
}
