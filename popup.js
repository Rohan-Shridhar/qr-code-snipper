const snipBtn = document.getElementById("snip-btn");
const clearBtn = document.getElementById("clear-btn");
const themeToggleBtn = document.getElementById("theme-toggle");

// Apply the theme to documentElement and update toggle icon/title
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const icon = themeToggleBtn.querySelector("i");
  if (theme === "dark") {
    icon.className = "fas fa-sun";
    themeToggleBtn.title = "Switch to Light Mode";
  } else {
    icon.className = "fas fa-moon";
    themeToggleBtn.title = "Switch to Dark Mode";
  }
}

// Initial theme load
chrome.storage.local.get("theme", (result) => {
  let theme = result.theme;
  if (!theme) {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    theme = prefersDark ? "dark" : "light";
  }
  applyTheme(theme);
});

// Theme toggle click handler
themeToggleBtn.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(newTheme);
  chrome.storage.local.set({ theme: newTheme });
});

chrome.storage.local.get("isSnipping", (result) => {
  if (result.isSnipping) {
    snipBtn.disabled = true;
    snipBtn.textContent = "Snipping...";
    snipBtn.classList.add("snipping");
  }
});

snipBtn.addEventListener("click", async () => {
  snipBtn.disabled = true;
  snipBtn.textContent = "Snipping...";
  snipBtn.classList.add("snipping");
  chrome.storage.local.set({ isSnipping: true });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log(tab);
  chrome.scripting
    .executeScript({
      target: { tabId: tab.id },
      files: ["snip.js"],
    })
    .then(() => {
      console.log("script inserted successfully");
      window.close();
    });
});

function isValidUrl(string) {
  const trimmed = string.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      new URL(trimmed);
      return true;
    } catch (_) {
      return false;
    }
  }
  if (/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,6}(:[0-9]{1,5})?(\/.*)?$/i.test(trimmed)) {
    try {
      new URL("https://" + trimmed);
      return true;
    } catch (_) {
      return false;
    }
  }
  return false;
}

function addResultItem(text) {
  const resultDiv = document.getElementById("result");

  const item = document.createElement("div");
  item.className = "item";

  const isUrl = isValidUrl(text);
  const textSpan = document.createElement(isUrl ? "a" : "span");
  textSpan.className = "text";
  textSpan.textContent = text;

  if (isUrl) {
    let href = text.trim();
    if (!/^https?:\/\//i.test(href)) {
      href = "https://" + href;
    }
    textSpan.href = href;
    textSpan.target = "_blank";
    textSpan.title = "Open";
  } else {
    textSpan.title = text;
  }

  const copyIcon = document.createElement("i");
  copyIcon.className = "fas fa-copy icon";
  copyIcon.title = "Copy";
  copyIcon.onclick = () => {
    navigator.clipboard.writeText(text);
    copyIcon.className = "fas fa-check icon";
    copyIcon.title = "Copied successfully";
    setTimeout(() => {
      copyIcon.className = "fas fa-copy icon";
      copyIcon.title = "Copy";
    }, 2000);
  };

  item.appendChild(textSpan);
  item.appendChild(copyIcon);
  resultDiv.appendChild(item);
  updateClearButtonVisibility();
}

function updateClearButtonVisibility() {
  chrome.storage.local.get("snippedQR", (result) => {
    if (result.snippedQR && result.snippedQR.length > 0) {
      clearBtn.style.display = "block";
    } else {
      clearBtn.style.display = "none";
    }
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SNIP_DONE' || message.type === 'SNIP_CANCELLED') {
    chrome.storage.local.set({ isSnipping: false });
    snipBtn.disabled = false;
    snipBtn.textContent = "Snip QR Code";
    snipBtn.classList.remove("snipping");
  }
});

chrome.storage.local.get("snippedQR", (result) => {
  console.log("QR from storage:", result.snippedQR);
  const resultelement = document.getElementById("result");
  const resultitems = result?.snippedQR?.length;
  if (resultitems > 0) {
    resultelement.textContent = "";
    result.snippedQR.forEach((element) => {
      addResultItem(element);
    });
  }
});

clearBtn.addEventListener("click", () => {
  chrome.storage.local.remove("snippedQR", () => {
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "";
    resultDiv.textContent = "Waiting for the result....";
    updateClearButtonVisibility();
  });
});

updateClearButtonVisibility();

