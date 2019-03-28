// function getStyle(themeInfo) {
//     if (themeInfo.colors) {
//         console.log("accent color : " + themeInfo.colors.accentcolor);
//         console.log("toolbar : " + themeInfo.colors.toolbar);
//     } else {
//         console.log('no themeinfo');
//     }

//     document.querySelector('.content').append(JSON.stringify(themeInfo));
// }

// async function getCurrentThemeInfo() {
//     var themeInfo = await browser.theme.getCurrent();
//     getStyle(themeInfo);
// }

let filteredDomains = [];
const entryList = document.querySelector(".entry-list");
const entryTemplate = document.querySelector("#entry");

function disableNewEntries() {
    document
        .querySelector('[data-action="add-entry"]')
        .setAttribute("disabled", "");
}

function enableNewEntries() {
    document
        .querySelector('[data-action="add-entry"]')
        .removeAttribute("disabled");
}

function updated(tabs) {
    enableNewEntries();
    tabs.forEach(tab => {
        console.log(tab);
        browser.tabs.sendMessage(tab.id, {
            command: "reinitialize",
        });
    });
}

function onError(error) {
    console.log(error);
}

function onUpdate() {
    const addonManifest = browser.runtime.getManifest();
    const allowedDomains = addonManifest.content_scripts[0].matches;

    browser.tabs
        .query({ url: allowedDomains })
        .then(updated)
        .catch(onError);
}

function insertEntryElement(inputValue = "") {
    const newEntry = document.importNode(entryTemplate.content, true);

    if (inputValue) {
        newEntry.querySelector("input").setAttribute("value", inputValue);
    }

    entryList.appendChild(newEntry);
    const allInputs = document.querySelectorAll(".entry__domain-input");
    const lastInput = allInputs[allInputs.length - 1];
    lastInput.focus();
}

function populateExistingDomains(item) {
    const newFilteredDomains = item.filteredDomains;
    filteredDomains = newFilteredDomains;
    item.filteredDomains.forEach(domain => insertEntryElement(domain.domain));
}

document.addEventListener("click", e => {
    if (e.target.dataset.action === "add-entry") {
        insertEntryElement();
        disableNewEntries();
    }
});

document.addEventListener("change", e => {
    if (e.target.classList.contains("entry__domain-input")) {
        const newFilteredDomains = [];
        const entryInputs = document.querySelectorAll(".entry__domain-input");

        entryInputs.forEach(input => {
            if (!input.value.trim()) {
                input.closest(".entry").remove();
                return;
            }

            newFilteredDomains.push({
                domain: input.value,
                action: "spotlight",
            });
        });

        filteredDomains = newFilteredDomains;

        browser.storage.sync.set({ filteredDomains }).then(onUpdate, onError);
    }
});

// document.addEventListener('focusout', (e) => {
//     if (e.target.classList.contains('entry__domain-input')) {

//         if (!e.target.value.trim()) {
//             e.target.closest('.entry').remove();
//         }
//     }
// });

browser.storage.sync
    .get("filteredDomains")
    .then(populateExistingDomains, onError);
