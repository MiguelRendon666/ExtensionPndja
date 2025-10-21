function insertGIF(imageUrl, objectToSet) {
  const statusText = document.getElementById("azure-bar-status-text");
  if (objectToSet && !document.querySelector("#my-custom-gif")) {
    // If there is a specific Wrike logo inside the container, replace its src
    const targetImg = objectToSet.querySelector('img.logo__image[data-application="logo-custom-image"]');
    if (targetImg) {
      if (!targetImg.dataset.originalSrc) targetImg.dataset.originalSrc = targetImg.src;
      // preserve display by limiting the new image to the original element's height
      try {
        const h = targetImg.getBoundingClientRect().height;
        if (h && h > 0) targetImg.style.maxHeight = h + 'px';
      } catch (e) {}
      // keep aspect ratio
      targetImg.style.width = 'auto';
      targetImg.id = 'my-custom-gif';
      targetImg.src = imageUrl;
    } else {
      const img = document.createElement("img");
      img.id = "my-custom-gif";
      img.src = imageUrl;
      img.style.width = "100%";
      // try to respect container height as max-height to avoid overflow
      try {
        const ch = objectToSet.getBoundingClientRect().height;
        if (ch && ch > 0) img.style.maxHeight = ch + 'px';
      } catch (e) {}
      objectToSet.appendChild(img);
    }
    if (statusText) {
      statusText.textContent = "GIF mostrandose";
    }
  }
}

function getImage() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["azure-image"], (result) => {
      const image = result["azure-image"];
      if (!image) {
        const potasium =
          "https://media1.giphy.com/media/v1.Y2lkPWZjZGU1NDk1N3VuMWhhM25kbmRsNWFwNnFreGk3MDUyaTFldHYxcWFldjFleXVzZiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/BrnlKgVmhfLBS/giphy.gif";
        chrome.storage.local.set({ "azure-image": potasium }, function () {});
        resolve(potasium);
      } else {
        resolve(image);
      }
    });
  });
}

function getObjectFromStoredClasses(callback) {
  const baseURL = `${window.location.protocol}//${window.location.host}`;
  var returnedObject;

  chrome.storage.local.get(["azure-classes"], (result) => {
    let classes = result["azure-classes"];

    if (!classes) {
      classes = defaultClasses;
      chrome.storage.local.set({ "azure-classes": classes });
    }

    if (classes[baseURL]) {
      classes[baseURL].forEach((element) => {
        returnedObject = document.querySelector(element);
      });
    }

    if (returnedObject) {
      callback(returnedObject);
    } else {
      callback(false);
    }
  });
}

const observer = new MutationObserver(() => {
  getObjectFromStoredClasses((result) => {
    if (result) {
      getImage().then(function (image) {
        insertGIF(image, result);
      });
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });

//====================================================================================================================================

const defaultClasses = {
  "https://chatgpt.com": ["#stage-sidebar-tiny-bar"],
  "https://dev.azure.com": [
    '[role="menubar"].custom-scrollbar',
    '[role="navigation"] .custom-scrollbar',
  ],
  "https://github.com": [
    'ul.ActionListWrap[data-target="nav-list.topLevelList"]',
  ],
  "https://web.whatsapp.com": [
    "div.x1c4vz4f.xs83m0k.xdl72j9.x1g77sc7.x78zum5.xozq…euugli.x2lwn1j.x1nhvcw1.xdt5ytf.x1cy8zhl.x1277o0a",
  ],
  "https://www.wrike.com": ["div.navigation-sidebar__sections-wrapper"],
};

// ---- Selections API -----------------------------------------------------
// Listens for selection mode messages from the popup and reports back a CSS selector
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.action) return;
  if (message.action === "start-selection") {
    startSelectionMode();
    sendResponse({ started: true });
  } else if (message.action === 'apply-selection') {
    // message: { selector, image, height }
    try {
      const sel = message.selector;
      const nodes = document.querySelectorAll(sel);
      nodes.forEach(n => {
        if (n.tagName === 'IMG' && message.image) {
          try {
            if (message.height) n.style.maxHeight = message.height + 'px';
            n.style.width = 'auto';
            n.src = message.image;
          } catch (e) {}
        }
      });
    } catch (e) {}
  }
});

function startSelectionMode() {
  let lastHighlighted = null;
  // create overlay to indicate selection mode
  const overlay = document.createElement('div');
  overlay.id = 'potasium-selection-overlay';
  overlay.textContent = 'Modo selección activo — haz click en una imagen para seleccionarla. Presiona Esc para cancelar.';
  overlay.style.position = 'fixed';
  overlay.style.top = '10px';
  overlay.style.left = '50%';
  overlay.style.transform = 'translateX(-50%)';
  overlay.style.zIndex = 2147483647;
  overlay.style.background = 'rgba(0,0,0,0.75)';
  overlay.style.color = 'white';
  overlay.style.padding = '8px 12px';
  overlay.style.borderRadius = '6px';
  overlay.style.fontSize = '13px';
  overlay.style.boxShadow = '0 2px 6px rgba(0,0,0,0.5)';
  document.documentElement.appendChild(overlay);

  function highlight(el) {
    if (!el) return;
    el.style.outline = "3px solid #4FC3F7";
    el.style.cursor = "crosshair";
    lastHighlighted = el;
  }

  function unhighlight(el) {
    if (!el) return;
    el.style.outline = "";
    el.style.cursor = "";
  }

  function onMouseOver(e) {
    const t = e.target;
    if (t && t.tagName === "IMG") {
      highlight(t);
    }
  }

  function onMouseOut(e) {
    const t = e.target;
    if (t && t.tagName === "IMG") {
      unhighlight(t);
    }
  }

  function onClick(e) {
    const t = e.target;
    if (t && t.tagName === "IMG") {
      e.preventDefault();
      e.stopPropagation();
      // compute a selector for the image
      const selector = computeUniqueSelector(t);
      // get dimension at selection time
      let rect = null;
      try {
        rect = t.getBoundingClientRect();
      } catch (e) {
        rect = null;
      }
      const height = rect && rect.height ? Math.round(rect.height) : null;
      const width = rect && rect.width ? Math.round(rect.width) : null;
      // send selection back to extension (popup will receive it if open)
      try {
        chrome.runtime.sendMessage({
          action: "selection-made",
          selector: selector,
          src: t.src,
          alt: t.alt || "",
          height: height,
          width: width,
        });
      } catch (err) {
        console.error("Could not send selection message", err);
      }
      cleanup();
    }
  }

  // allow cancel with Escape
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      cleanup();
    }
  }

  function cleanup() {
    document.removeEventListener("mouseover", onMouseOver, true);
    document.removeEventListener("mouseout", onMouseOut, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
    if (lastHighlighted) unhighlight(lastHighlighted);
    const ov = document.getElementById('potasium-selection-overlay');
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
  }

  document.addEventListener("mouseover", onMouseOver, true);
  document.addEventListener("mouseout", onMouseOut, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener('keydown', onKeyDown, true);

  // notify popup/UI that selection started
  try {
    chrome.runtime.sendMessage({ action: 'selection-started' });
  } catch (e) {}
}

function computeUniqueSelector(el) {
  if (!el) return '';
  // Prefer id
  if (el.id) return `#${el.id}`;

  // For images prefer stable attributes
  if (el.tagName === 'IMG') {
    // data-* attributes
    for (let i = 0; i < el.attributes.length; i++) {
      const a = el.attributes[i];
      if (a.name.startsWith('data-') && a.value) {
        return `img[${a.name}="${CSS.escape(a.value)}"]`;
      }
    }
    // alt attribute
    if (el.alt && el.alt.trim().length > 0) {
      return `img[alt="${CSS.escape(el.alt.trim())}"]`;
    }
    // title
    if (el.title && el.title.trim().length > 0) {
      return `img[title="${CSS.escape(el.title.trim())}"]`;
    }
    // filename from src
    try {
      const u = new URL(el.src, location.href);
      const filename = u.pathname.split('/').filter(Boolean).pop();
      if (filename && filename.length > 0 && filename.length < 60) {
        return `img[src$="/${CSS.escape(filename)}"]`;
      }
    } catch (e) {}
  }

  // fallback: build path but avoid dynamic-looking classes
  function isLikelyDynamicClass(name) {
    if (!name) return true;
    if (name.length > 20) return true;
    const digits = (name.match(/\d/g) || []).length;
    if (digits / Math.max(1, name.length) > 0.3) return true;
    return false;
  }

  const parts = [];
  let node = el;
  while (node && node.nodeType === 1 && node.tagName.toLowerCase() !== 'html') {
    let part = node.tagName.toLowerCase();
    if (node.classList && node.classList.length > 0) {
      const good = Array.from(node.classList).filter(c => !isLikelyDynamicClass(c));
      if (good.length > 0) {
        part += '.' + good.slice(0,2).map(c => CSS.escape(c)).join('.');
      }
    }
    const parent = node.parentNode;
    if (parent) {
      const siblings = Array.from(parent.children).filter(c => c.tagName === node.tagName);
      if (siblings.length > 1) {
        const idx = Array.from(parent.children).indexOf(node) + 1;
        part += `:nth-child(${idx})`;
      }
    }
    parts.unshift(part);
    node = node.parentNode;
  }
  return parts.join(' > ');
}

// ---- Apply selections on mutation / load --------------------------------
function applySelectionsForCurrentPage() {
  const baseURL = `${window.location.protocol}//${window.location.host}`;
  chrome.storage.local.get(["azure-selections"], (result) => {
    const selections =
      (result["azure-selections"] && result["azure-selections"][baseURL]) || [];
    if (!Array.isArray(selections) || selections.length === 0) return;
    selections.forEach((sel) => {
      try {
        const nodes = document.querySelectorAll(sel.selector);
        nodes.forEach((n) => {
          if (n.tagName === "IMG" && sel.image) {
            try {
              const storedH = sel.height;
              if (storedH && storedH > 0) {
                n.style.maxHeight = storedH + 'px';
              } else {
                const h = n.getBoundingClientRect().height;
                if (h && h > 0) n.style.maxHeight = h + 'px';
              }
            } catch (e) {}
            // only replace if different to avoid flicker
            if (n.src !== sel.image) {
              n.style.width = 'auto';
              n.src = sel.image;
            }
          }
        });
      } catch (e) {
        // invalid selector
      }
    });
  });
}

// run on load and on mutations
applySelectionsForCurrentPage();
const selectionsObserver = new MutationObserver(() => {
  applySelectionsForCurrentPage();
});
selectionsObserver.observe(document.body, { childList: true, subtree: true });
