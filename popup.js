document.addEventListener('DOMContentLoaded', function () {
  const statusText = document.getElementById('azure-bar-status-text');
  const fileInput = document.getElementById('gif-input');

  // Botón para cargar imagen
  document.getElementById('open-azure-portal-button').addEventListener('click', function () {
    if (fileInput.files.length > 0) {
      // Guardar imagen actual en historial antes de actualizar
      chrome.storage.local.get(['azure-image', 'history-gif-images'], function (result) {
        const prevImage = result['azure-image'];
        let history = result['history-gif-images'] || [];
        if (prevImage && !history.includes(prevImage)) {
          history.unshift(prevImage); // Agrega al inicio si no está duplicada
          if (history.length > 10) history = history.slice(0, 10);
        }
        chrome.storage.local.set({ 'history-gif-images': history }, function () {
          // Ahora sigue el flujo normal
          const file = fileInput.files[0];
          const reader = new FileReader();
          reader.onload = function (event) {
            const imageUrl = event.target.result;
            chrome.storage.local.set({ 'azure-image': imageUrl }, function () {
              if (statusText) {
                statusText.textContent = 'Se ha cargado la imagen, por favor recarga la página actual.';
              }
            });
          };
          reader.readAsDataURL(file);
        });
      });
    } else {
      console.log('No se ha seleccionado ninguna imagen.');
    }
  });

  // Botón para borrar imagen
  document.getElementById('clear-azure-portal-button').addEventListener('click', function () {
    chrome.storage.local.remove('azure-image', function () {
      console.log('Imagen eliminada de chrome.storage.local');
      if (statusText) {
        statusText.textContent = 'Se ha eliminado la imagen, por favor recarga la página actual.';
      }
    });
  });

  // Botón para resetear las clases e imagen.
  document.getElementById('reset-gifs-button').addEventListener('click', function () {
    chrome.storage.local.remove('azure-classes', function () {
      chrome.storage.local.set({ 'azure-classes': defaultClasses }, function () {
        if (statusText) {
          console.log(defaultClasses);
          statusText.textContent = 'Se ha reseteado la configuracion de clases por default, recargue la pagina para ver los cambios';
        }
      });
    });
  });

  // Tabs
  document.getElementById('change-gif-tab-1').addEventListener('click', function () {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    this.classList.add('active');
    document.getElementById('imagen').classList.add('active');
  });

  document.getElementById('change-gif-tab-2').addEventListener('click', function () {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    this.classList.add('active');
    document.getElementById('config').classList.add('active');
  });

  document.getElementById('change-gif-tab-3').addEventListener('click', function () {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    this.classList.add('active');
    document.getElementById('history').classList.add('active');
  });

  setClassesList();
  // Mostrar imágenes recientes en historial
  mostrarImagenesRecientes();
});

function setClassesList() {
  let classesDiv = document.getElementById('insert-query-lists');
  let titleText = document.getElementById('configuration-page-title');

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length === 0) return;

    const url = new URL(tabs[0].url);
    const baseURL = `${url.protocol}//${url.host}`;

    titleText.textContent = `Clases para ${baseURL}`;

    chrome.storage.local.get(['azure-classes'], (result) => {
      const classes = result['azure-classes'] || {};
      classesDiv.innerHTML = ''; // Limpiar antes de insertar

      if (classes[baseURL] && Array.isArray(classes[baseURL])) {
        classes[baseURL].forEach((className, idx) => {
          const wrapper = document.createElement('div');
          wrapper.style.display = 'flex';
          wrapper.style.alignItems = 'center';
          wrapper.style.marginBottom = '4px';

          const input = document.createElement('input');
          input.type = 'text';
          input.value = className;
          input.disabled = true;

          const deleteButton = document.createElement('button');
          deleteButton.textContent = '🗑️';
          deleteButton.title = 'Eliminar clase';
          deleteButton.classList = 'custom-btn add-btn';
          deleteButton.style.marginLeft = '6px';
          deleteButton.addEventListener('click', function () {
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
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Nueva clase';

  const addButton = document.createElement('button');
  addButton.textContent = '+';
  addButton.classList = 'custom-btn add-btn';

  addButton.addEventListener('click', function () {
    const value = input.value.trim();
    if (value) {
      if (!classes[baseURL]) classes[baseURL] = [];
      classes[baseURL].push(value);
      chrome.storage.local.set({ 'azure-classes': classes }, () => {
        setClassesList();
      });
    }
  });

  wrapper.appendChild(input);
  wrapper.appendChild(addButton);
  container.appendChild(wrapper);
}

function deleteClass(baseURL, index) {
  chrome.storage.local.get(['azure-classes'], (result) => {
    const classes = result['azure-classes'] || {};
    if (classes[baseURL] && Array.isArray(classes[baseURL])) {
      classes[baseURL].splice(index, 1);
      chrome.storage.local.set({ 'azure-classes': classes }, () => {
        setClassesList();
      });
    }
  });
}

function mostrarImagenesRecientes() {
  const recentDiv = document.getElementById('insert-recent-gifs');
  const statusText2 = document.getElementById('insert-status-text-2');
  if (!recentDiv) return;
  chrome.storage.local.get(['history-gif-images'], (result) => {
    const images = result['history-gif-images'] || [];
    recentDiv.innerHTML = '';
    if (images.length === 0) {
      const noImg = document.createElement('div');
      noImg.textContent = 'No hay imágenes recientes.';
      noImg.style.textAlign = 'center';
      noImg.style.color = '#8ab4f8';
      recentDiv.appendChild(noImg);
      return;
    }
    recentDiv.style.display = 'flex';
    recentDiv.style.flexWrap = 'wrap';
    recentDiv.style.justifyContent = 'center';
    images.forEach((imgUrl, idx) => {
      const img = document.createElement('img');
      img.src = imgUrl;
      img.alt = `GIF reciente ${idx+1}`;
      img.style.width = '30%';
      img.style.aspectRatio = '1/1';
      img.style.objectFit = 'cover';
      img.style.margin = '1%';
      img.style.borderRadius = '16px';
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => {
        // Al hacer click, se cambia azure-image por esta imagen
        chrome.storage.local.set({ 'azure-image': imgUrl }, function () {
          if (statusText2) {
            statusText2.textContent = 'Se ha cargado la imagen, por favor recarga la página actual.';
          }
        });
      });
      recentDiv.appendChild(img);
    });
  });
}

//====================================================================================================================================

const defaultClasses = {
  "https://chatgpt.com": ["#stage-sidebar-tiny-bar"],
  "https://dev.azure.com": [
    "[role=\"menubar\"].custom-scrollbar",
    "[role=\"navigation\"] .custom-scrollbar"
  ],
  "https://github.com": ["ul.ActionListWrap[data-target=\"nav-list.topLevelList\"]"],
  "https://web.whatsapp.com": [
    "div.x1c4vz4f.xs83m0k.xdl72j9.x1g77sc7.x78zum5 div div"
  ],
  "https://www.wrike.com": [
    "div.navigation-sidebar__sections-wrapper"
  ]
}