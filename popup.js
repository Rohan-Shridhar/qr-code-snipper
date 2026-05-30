const snipBtn = document.getElementById("snip-btn");
const clearBtn = document.getElementById("clear-btn");

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

function addResultItem(text) {
  const resultDiv = document.getElementById("result");

  const item = document.createElement("div");
  item.className = "item";

  const textSpan = document.createElement("span");
  textSpan.className = "text";
  textSpan.textContent = text;
  textSpan.title = text;

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

