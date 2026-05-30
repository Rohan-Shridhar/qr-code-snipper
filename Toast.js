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

export default function Toast(message, duration = 2000) {
  if (!message) {
    return;
  }

  loadStyles();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, duration);
}
