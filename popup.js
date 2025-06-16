document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('open-azure-portal-button').addEventListener('click', function() {
    const gifInput = document.getElementById('gif-input');
    if (gifInput.files.length > 0) {
      const file = gifInput.files[0];
      const reader = new FileReader();
      reader.onload = function(event) {
        const imageUrl = event.target.result;
        chrome.storage.local.set({ 'azure-image': imageUrl }, function() {
        });
      };
      reader.readAsDataURL(file);
    } else {
      console.log('No se ha seleccionado ninguna imagen.');
    }
  });

  document.getElementById('clear-azure-portal-button').addEventListener('click', function() {
    chrome.storage.local.remove('azure-image', function() {
      console.log('Imagen eliminada de chrome.storage.local');
    });
  });
});