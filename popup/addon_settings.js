function getStyle(themeInfo) {
    if (themeInfo.colors) {
        console.log("accent color : " + themeInfo.colors.accentcolor);
        console.log("toolbar : " + themeInfo.colors.toolbar);
    } else {
        console.log('no themeinfo');
    }

    document.querySelector('.content').append(JSON.stringify(themeInfo));
}

async function getCurrentThemeInfo() {
    var themeInfo = await browser.theme.getCurrent();
    getStyle(themeInfo);
}

document.addEventListener('click', (e) => {
    if (e.target.dataset.action === 'add-entry') {
        insertEntryElement();
        disableNewEntries();
    }
});

document.addEventListener('change', (e) => {
    if (e.target.classList.contains('entry__domain-input')) {
        let newFilteredDomains = [];
        const entryInputs = document.querySelectorAll('.entry__domain-input');

        entryInputs.forEach(input => {
            if (!input.value.trim()) {
                input.closest('.entry').remove();
                return;
            }

            newFilteredDomains.push({
                domain: input.value,
                action: 'spotlight',
            });
        });

        filteredDomains = newFilteredDomains;

        browser.storage.sync.set({ filteredDomains })
            .then(onUpdate, onError);
    }
});

// document.addEventListener('focusout', (e) => {
//     if (e.target.classList.contains('entry__domain-input')) {

//         if (!e.target.value.trim()) {
//             e.target.closest('.entry').remove();
//         }
//     }
// });

function disableNewEntries() {
    document.querySelector('[data-action="add-entry"]').setAttribute('disabled', '');
}

function enableNewEntries() {
    document.querySelector('[data-action="add-entry"]').removeAttribute('disabled');
}

function onUpdate() {
    const matches = browser.runtime.getManifest().content_scripts[0].matches;
    browser.tabs.query({ url: matches })
        .then(updated)
        .catch(onError);
}

function updated(tabs) {
    enableNewEntries();
    for (let tab of tabs) {
        console.log(tab);
        browser.tabs.sendMessage(tab.id, {
            command: 'reinitialize',
        });
    }
}

let filteredDomains = [];
const entryList = document.querySelector('.entry-list');
const entryTemplate = document.querySelector('#entry');

browser.storage.sync.get('filteredDomains')
    .then(populateExistingDomains, onError);

function populateExistingDomains(item) {
    filteredDomains = item.filteredDomains;
    item.filteredDomains.forEach(domain => insertEntryElement(domain.domain));
}

function insertEntryElement(inputValue = '') {
    const newEntry = document.importNode(entryTemplate.content, true);

    if (inputValue) {
        newEntry.querySelector('input').setAttribute('value', inputValue);
    }
    
    entryList.appendChild(newEntry);
    const allInputs = document.querySelectorAll('.entry__domain-input');
    const lastInput = allInputs[allInputs.length - 1];
    lastInput.focus();
}

function onError(error) {
    console.log(error);
}