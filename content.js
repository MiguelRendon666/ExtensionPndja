function insertGIF(imageUrl, objectToSet) {
    const statusText = document.getElementById('azure-bar-status-text');
    if (objectToSet && !document.querySelector('#my-custom-gif')) {
        const img = document.createElement('img');
        img.id = 'my-custom-gif';
        img.src = imageUrl;
        img.style.width = '100%';
        objectToSet.appendChild(img);
        if (statusText) {
            statusText.textContent = 'GIF mostrandose';
        }
    }
}

function getImage() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['azure-image'], (result) => {
            const image = result['azure-image'];
            if (!image) {
                const potasium = 'https://media1.giphy.com/media/v1.Y2lkPWZjZGU1NDk1N3VuMWhhM25kbmRsNWFwNnFreGk3MDUyaTFldHYxcWFldjFleXVzZiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/BrnlKgVmhfLBS/giphy.gif'
                chrome.storage.local.set({ 'azure-image': potasium }, function() {});
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
    
    chrome.storage.local.get(['azure-classes'], (result) => {
        let classes = result['azure-classes'];

        if (!classes) {
            classes = defaultClasses;
            chrome.storage.local.set({ 'azure-classes': classes });
        }

        if (classes[baseURL]) {
            classes[baseURL].forEach(element => {
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
            getImage().then(function(image) {
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
    "[role=\"menubar\"].custom-scrollbar",
    "[role=\"navigation\"] .custom-scrollbar"
  ],
  "https://github.com": ["ul.ActionListWrap[data-target=\"nav-list.topLevelList\"]"],
  "https://web.whatsapp.com": [
    "div.x1c4vz4f.xs83m0k.xdl72j9.x1g77sc7.x78zum5.xozq…euugli.x2lwn1j.x1nhvcw1.xdt5ytf.x1cy8zhl.x1277o0a"
  ],
  "https://www.wrike.com": [
    "div.navigation-sidebar__sections-wrapper"
  ]
}