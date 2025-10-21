document.addEventListener("DOMContentLoaded", function () {
  const statusText = document.getElementById("azure-bar-status-text");
  const fileInput = document.getElementById("gif-input");

  // Botón para cargar imagen
  document
    .getElementById("open-azure-portal-button")
    .addEventListener("click", function () {
      if (fileInput.files.length > 0) {
        // Guardar imagen actual en historial antes de actualizar
        chrome.storage.local.get(
          ["azure-image", "history-gif-images"],
          function (result) {
            const prevImage = result["azure-image"];
            let history = result["history-gif-images"] || [];
            if (prevImage && !history.includes(prevImage)) {
              history.unshift(prevImage); // Agrega al inicio si no está duplicada
              if (history.length > 10) history = history.slice(0, 10);
            }
            chrome.storage.local.set(
              { "history-gif-images": history },
              function () {
                // Ahora sigue el flujo normal
                const file = fileInput.files[0];
                const reader = new FileReader();
                reader.onload = function (event) {
                  const imageUrl = event.target.result;
                  chrome.storage.local.set(
                    { "azure-image": imageUrl },
                    function () {
                      if (statusText) {
                        statusText.textContent =
                          "Se ha cargado la imagen, por favor recarga la página actual.";
                      }
                    }
                  );
                };
                reader.readAsDataURL(file);
              }
            );
          }
        );
      } else {
        console.log("No se ha seleccionado ninguna imagen.");
      }
    });

  // Botón para borrar imagen
  document
    .getElementById("clear-azure-portal-button")
    .addEventListener("click", function () {
      chrome.storage.local.remove("azure-image", function () {
        console.log("Imagen eliminada de chrome.storage.local");
        if (statusText) {
          statusText.textContent =
            "Se ha eliminado la imagen, por favor recarga la página actual.";
        }
      });
    });

  // Botón para resetear las clases e imagen.
  document
    .getElementById("reset-gifs-button")
    .addEventListener("click", function () {
      chrome.storage.local.remove("azure-classes", function () {
        chrome.storage.local.set(
          { "azure-classes": defaultClasses },
          function () {
            if (statusText) {
              console.log(defaultClasses);
              statusText.textContent =
                "Se ha reseteado la configuracion de clases por default, recargue la pagina para ver los cambios";
            }
          }
        );
      });
    });

  // Tabs
  document
    .getElementById("change-gif-tab-1")
    .addEventListener("click", function () {
      document
        .querySelectorAll(".tab")
        .forEach((tab) => tab.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((tc) => tc.classList.remove("active"));
      this.classList.add("active");
      document.getElementById("imagen").classList.add("active");
    });

  document
    .getElementById("change-gif-tab-2")
    .addEventListener("click", function () {
      document
        .querySelectorAll(".tab")
        .forEach((tab) => tab.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((tc) => tc.classList.remove("active"));
      this.classList.add("active");
      document.getElementById("config").classList.add("active");
    });

  document
    .getElementById("change-gif-tab-3")
    .addEventListener("click", function () {
      document
        .querySelectorAll(".tab")
        .forEach((tab) => tab.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((tc) => tc.classList.remove("active"));
      this.classList.add("active");
      document.getElementById("history").classList.add("active");
    });

  setClassesList();
  // Mostrar imágenes recientes en historial
  mostrarImagenesRecientes();
  // Setup selection button
  const startSelectionBtn = document.getElementById("start-selection-button");
  if (startSelectionBtn) {
    startSelectionBtn.addEventListener("click", function () {
      // tell the content script to start selection mode
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs || tabs.length === 0) return;
        const tab = tabs[0];
        // Basic URL check: only attempt on http(s) pages
        try {
          const u = new URL(tab.url);
          if (u.protocol !== "http:" && u.protocol !== "https:") {
            if (statusText) statusText.textContent = "No se puede seleccionar en esta pestaña.";
            return;
          }
        } catch (e) {
          if (statusText) statusText.textContent = "URL no válida para selección.";
          return;
        }

        if (statusText) statusText.textContent = "Activando modo selección...";
        chrome.tabs.sendMessage(tab.id, { action: "start-selection" }, function (resp) {
          if (chrome.runtime.lastError) {
            // try to inject content script programmatically and retry (requires scripting permission)
            if (typeof chrome.scripting !== 'undefined') {
              if (statusText) statusText.textContent = 'Inyectando script en la pestaña...';
              chrome.scripting.executeScript(
                { target: { tabId: tab.id }, files: ['content.js'] },
                function () {
                  // retry sending message once
                  chrome.tabs.sendMessage(tab.id, { action: 'start-selection' }, function (resp2) {
                    if (chrome.runtime.lastError) {
                      if (statusText)
                        statusText.textContent =
                          'No se pudo activar el modo selección tras inyectar el script.';
                      return;
                    }
                    if (statusText) statusText.textContent = 'Modo selección activado: haz click en la imagen deseada.';
                  });
                }
              );
            } else {
              if (statusText)
                statusText.textContent =
                  'No se pudo activar el modo selección en esta pestaña (sin content script). Recarga la página e inténtalo de nuevo.';
            }
            return;
          }
          // popup will also receive 'selection-started' from content script; leave message until that arrives
        });
      });
    });
  }

  // Listen for selection-made messages from content script
  chrome.runtime.onMessage.addListener(function (
    message,
    sender,
    sendResponse
  ) {
    if (message && message.action === 'selection-started') {
      if (statusText) statusText.textContent = 'Modo selección activo — selecciona una imagen en la página.';
      return;
    }
    if (message && message.action === "selection-made") {
      // message.selector, message.src, message.alt
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs || tabs.length === 0) return;
        const url = new URL(tabs[0].url);
        const baseURL = `${url.protocol}//${url.host}`;
        chrome.storage.local.get(["azure-selections"], function (result) {
          const all = result["azure-selections"] || {};
          if (!all[baseURL]) all[baseURL] = [];
          // avoid duplicates for same selector
          const exists = all[baseURL].some(
            (s) => s.selector === message.selector
          );
          if (!exists) {
            all[baseURL].push({
              selector: message.selector,
              image: message.src || "",
              alt: message.alt || "",
              height: message.height || null,
              width: message.width || null,
              createdAt: Date.now(),
            });
            chrome.storage.local.set({ "azure-selections": all }, function () {
              // refresh UI
              renderSelectionsList(baseURL);
            });
          }
        });
      });
    }
  });

  // initial render of selections for current tab
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs || tabs.length === 0) return;
    const url = new URL(tabs[0].url);
    const baseURL = `${url.protocol}//${url.host}`;
    renderSelectionsList(baseURL);
  });
});

function setClassesList() {
  let classesDiv = document.getElementById("insert-query-lists");
  let titleText = document.getElementById("configuration-page-title");

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length === 0) return;

    const url = new URL(tabs[0].url);
    const baseURL = `${url.protocol}//${url.host}`;

    titleText.textContent = `Clases para ${baseURL}`;

    chrome.storage.local.get(["azure-classes"], (result) => {
      const classes = result["azure-classes"] || {};
      classesDiv.innerHTML = ""; // Limpiar antes de insertar

      if (classes[baseURL] && Array.isArray(classes[baseURL])) {
        classes[baseURL].forEach((className, idx) => {
          const wrapper = document.createElement("div");
          wrapper.style.display = "flex";
          wrapper.style.alignItems = "center";
          wrapper.style.marginBottom = "4px";

          const input = document.createElement("input");
          input.type = "text";
          input.value = className;
          input.disabled = true;

          const deleteButton = document.createElement("button");
          deleteButton.textContent = "🗑️";
          deleteButton.title = "Eliminar clase";
          deleteButton.classList = "custom-btn add-btn";
          deleteButton.style.marginLeft = "6px";
          deleteButton.addEventListener("click", function () {
            deleteClass(baseURL, idx);
          });

          wrapper.appendChild(input);
          wrapper.appendChild(deleteButton);
          classesDiv.appendChild(wrapper);
        });
      }

      // Agregar input vacío y botón +
      addClassInput(classesDiv, baseURL, classes);
    });
  });
}

function addClassInput(container, baseURL, classes) {
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Nueva clase";

  const addButton = document.createElement("button");
  addButton.textContent = "+";
  addButton.classList = "custom-btn add-btn";

  addButton.addEventListener("click", function () {
    const value = input.value.trim();
    if (value) {
      if (!classes[baseURL]) classes[baseURL] = [];
      classes[baseURL].push(value);
      chrome.storage.local.set({ "azure-classes": classes }, () => {
        setClassesList();
      });
    }
  });

  wrapper.appendChild(input);
  wrapper.appendChild(addButton);
  container.appendChild(wrapper);
}

function deleteClass(baseURL, index) {
  chrome.storage.local.get(["azure-classes"], (result) => {
    const classes = result["azure-classes"] || {};
    if (classes[baseURL] && Array.isArray(classes[baseURL])) {
      classes[baseURL].splice(index, 1);
      chrome.storage.local.set({ "azure-classes": classes }, () => {
        setClassesList();
      });
    }
  });
}

function mostrarImagenesRecientes() {
  const recentDiv = document.getElementById("insert-recent-gifs");
  const statusText2 = document.getElementById("insert-status-text-2");
  if (!recentDiv) return;
  chrome.storage.local.get(["history-gif-images"], (result) => {
    const images = result["history-gif-images"] || [];
    recentDiv.innerHTML = "";
    if (images.length === 0) {
      const noImg = document.createElement("div");
      noImg.textContent = "No hay imágenes recientes.";
      noImg.style.textAlign = "center";
      noImg.style.color = "#8ab4f8";
      recentDiv.appendChild(noImg);
      return;
    }
    recentDiv.style.display = "flex";
    recentDiv.style.flexWrap = "wrap";
    recentDiv.style.justifyContent = "center";
    images.forEach((imgUrl, idx) => {
      const img = document.createElement("img");
      img.src = imgUrl;
      img.alt = `GIF reciente ${idx + 1}`;
      img.style.width = "30%";
      img.style.aspectRatio = "1/1";
      img.style.objectFit = "cover";
      img.style.margin = "1%";
      img.style.borderRadius = "16px";
      img.style.cursor = "pointer";
      img.addEventListener("click", () => {
        // Al hacer click, guarda la imagen actual en historial (sin duplicados) y luego cambia azure-image
        chrome.storage.local.get(
          ["azure-image", "history-gif-images"],
          function (result) {
            const prevImage = result["azure-image"];
            let history = result["history-gif-images"] || [];
            if (prevImage && !history.includes(prevImage)) {
              history.unshift(prevImage);
              if (history.length > 10) history = history.slice(0, 10);
            }
            chrome.storage.local.set(
              { "azure-image": imgUrl, "history-gif-images": history },
              function () {
                if (statusText2) {
                  statusText2.textContent =
                    "Se ha cargado la imagen, por favor recarga la página actual.";
                }
              }
            );
          }
        );
      });
      recentDiv.appendChild(img);
    });
  });
}

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
    "div.x1c4vz4f.xs83m0k.xdl72j9.x1g77sc7.x78zum5 div div",
  ],
  "https://www.wrike.com": ["div.navigation-sidebar__sections-wrapper"],
};

// Selections UI helpers
function renderSelectionsList(baseURL) {
  const list = document.getElementById("selections-list");
  if (!list) return;
  list.innerHTML = "";
  chrome.storage.local.get(["azure-selections"], function (result) {
    const all = result["azure-selections"] || {};
    const sels = all[baseURL] || [];
    if (!sels || sels.length === 0) {
      const empty = document.createElement("div");
      empty.textContent = "No hay selecciones para esta página.";
      empty.style.color = "#8ab4f8";
      empty.style.textAlign = "center";
      list.appendChild(empty);
      return;
    }
    sels.forEach((s, idx) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.marginBottom = "6px";

      const info = document.createElement("div");
      info.style.flex = "1";
      info.style.fontSize = "12px";
      info.textContent = s.selector;

      const thumb = document.createElement("img");
      thumb.src = s.image || s.src || "";
      thumb.style.width = "48px";
      thumb.style.height = "48px";
      thumb.style.objectFit = "cover";
      thumb.style.marginRight = "6px";

      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.style.display = "none";
      fileInput.addEventListener("change", function () {
        if (fileInput.files.length === 0) return;
        const reader = new FileReader();
        reader.onload = function (e) {
          const data = e.target.result;
          // save into selections
          chrome.storage.local.get(["azure-selections"], function (res) {
            const all2 = res["azure-selections"] || {};
            if (!all2[baseURL]) all2[baseURL] = [];
            all2[baseURL][idx].image = data;
            chrome.storage.local.set({ "azure-selections": all2 }, function () {
              renderSelectionsList(baseURL);
            });
          });
        };
        reader.readAsDataURL(fileInput.files[0]);
      });

      const assignBtn = document.createElement("button");
      assignBtn.textContent = "Asignar imagen";
      assignBtn.classList = "custom-btn";
      assignBtn.style.marginRight = "6px";
      assignBtn.addEventListener("click", function () {
        fileInput.click();
      });

      const applyBtn = document.createElement('button');
      applyBtn.textContent = 'Aplicar ahora';
      applyBtn.classList = 'custom-btn';
      applyBtn.style.marginRight = '6px';
      applyBtn.addEventListener('click', function () {
        // send message to content script to apply immediately
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          if (!tabs || tabs.length === 0) return;
          const tab = tabs[0];
          const payload = { action: 'apply-selection', selector: s.selector, image: s.image || s.src || null, height: s.height || null };
          if (!payload.image) {
            if (statusText) statusText.textContent = 'No hay imagen asignada a esta selección.';
            return;
          }
          chrome.tabs.sendMessage(tab.id, payload, function (resp) {
            if (chrome.runtime.lastError) {
              // try to inject then retry
              if (typeof chrome.scripting !== 'undefined') {
                chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }, function () {
                  chrome.tabs.sendMessage(tab.id, payload, function (r2) {
                    if (chrome.runtime.lastError) {
                      if (statusText) statusText.textContent = 'No se pudo aplicar la selección en esta pestaña.';
                      return;
                    }
                    if (statusText) statusText.textContent = 'Selección aplicada.';
                  });
                });
              } else {
                if (statusText) statusText.textContent = 'No se pudo aplicar la selección (sin permiso de inyección).';
              }
            } else {
              if (statusText) statusText.textContent = 'Selección aplicada.';
            }
          });
        });
      });

      const delBtn = document.createElement("button");
      delBtn.textContent = "Eliminar";
      delBtn.classList = "custom-btn";
      delBtn.addEventListener("click", function () {
        chrome.storage.local.get(["azure-selections"], function (res) {
          const all2 = res["azure-selections"] || {};
          if (all2[baseURL]) {
            all2[baseURL].splice(idx, 1);
            chrome.storage.local.set({ "azure-selections": all2 }, function () {
              renderSelectionsList(baseURL);
            });
          }
        });
      });

  row.appendChild(thumb);
  row.appendChild(info);
  row.appendChild(assignBtn);
  row.appendChild(applyBtn);
  row.appendChild(delBtn);
      row.appendChild(fileInput);
      list.appendChild(row);
    });
  });
}
