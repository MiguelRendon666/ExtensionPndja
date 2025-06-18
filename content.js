function insertGIF(imageUrl) {
    const menubar = document.querySelector('[role="menubar"].custom-scrollbar');
    const statusText = document.getElementById('azure-bar-status-text');
    if (menubar && !document.querySelector('#my-custom-gif')) {
        const img = document.createElement('img');
        img.id = 'my-custom-gif';
        img.src = imageUrl;
        img.style.width = '100%';
        menubar.appendChild(img);
        if (statusText) {
            statusText.textContent = 'GIF mostrandose';
        }
    }
}

if (window.location.href.includes('https://dev.azure.com/')) {
    const observer = new MutationObserver(() => {
        getImage().then(insertGIF);
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

function getImage() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['azure-image'], (result) => {
            const image = result['azure-image'];
            if (!image) {
                resolve('https://media1.giphy.com/media/v1.Y2lkPWZjZGU1NDk1N3VuMWhhM25kbmRsNWFwNnFreGk3MDUyaTFldHYxcWFldjFleXVzZiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/BrnlKgVmhfLBS/giphy.gif');
            } else {
                resolve(image);
            }
        });
    });
}