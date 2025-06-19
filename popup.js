document.addEventListener('DOMContentLoaded', function () {
  const statusText = document.getElementById('azure-bar-status-text');
  const fileInput = document.getElementById('gif-input');

  // Botón para cargar imagen
  document.getElementById('open-azure-portal-button').addEventListener('click', function () {
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = function (event) {
        const imageUrl = event.target.result;
        chrome.storage.local.set({ 'azure-image': imageUrl }, function () {
          if (statusText) {
            statusText.textContent = 'Se ha cargado la imagen, por favor recarga la página de Azure DevOps.';
          }
        });
      };
      reader.readAsDataURL(file);
    } else {
      console.log('No se ha seleccionado ninguna imagen.');
    }
  });

  // Botón para borrar imagen
  document.getElementById('clear-azure-portal-button').addEventListener('click', function () {
    chrome.storage.local.remove('azure-image', function () {
      console.log('Imagen eliminada de chrome.storage.local');
      if (statusText) {
        statusText.textContent = 'Se ha eliminado la imagen, por favor recarga la página de Azure DevOps.';
      }
    });
  });

  // Tabs
  document.getElementById('change-gif-tab-1').addEventListener('click', function () {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    this.classList.add('active');
    document.getElementById('imagen').classList.add('active');
    console.log('Tab 1 activada');
  });

  document.getElementById('change-gif-tab-2').addEventListener('click', function () {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    this.classList.add('active');
    document.getElementById('config').classList.add('active');
    console.log('Tab 2 activada');
  });

  setClassesList();
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