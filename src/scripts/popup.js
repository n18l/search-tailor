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

const entryList = document.querySelector(".entry-list");
const entryTemplate = document.querySelector("#entry");

function disableNewEntries() {
    document
        .querySelector('[data-click-action="add-entry"]')
        .setAttribute("disabled", "");
}

function enableNewEntries() {
    document
        .querySelector('[data-click-action="add-entry"]')
        .removeAttribute("disabled");
}

function updated(tabs) {
    tabs.forEach(tab => {
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
    console.log("entry list updated");

    browser.tabs
        .query({ url: allowedDomains })
        .then(updated)
        .catch(onError);
}

function updateDomains() {
    const updatedDomainList = [];
    const entries = document.querySelectorAll(".js-entry");

    entries.forEach(entry => {
        const entryDomain = entry.querySelector(".js-entry-domain-input").value;

        if (!entryDomain.trim()) {
            return;
        }

        updatedDomainList.push({
            domain: entryDomain,
            treatment: "spotlight",
        });
    });

    browser.storage.sync
        .set({ tailoredDomains: updatedDomainList })
        .then(onUpdate, onError);
}

function insertEntryElement(inputValue = "") {
    const newEntry = document.importNode(entryTemplate.content, true);
    const newEntryInput = newEntry.querySelector(".js-entry-domain-input");

    if (inputValue) {
        newEntryInput.setAttribute("value", inputValue);
    }

    entryList.appendChild(newEntry);
    newEntryInput.focus();
    console.log("entry inserted");
}

function resetEntryElement(element) {
    const elementInput = element.querySelector(".js-entry-domain-input");
    elementInput.value = "";
    console.log("entry reset");
}

function removeEntryElement(element) {
    const numberOfEntries = document.querySelectorAll(".js-entry").length;

    if (numberOfEntries === 1) {
        resetEntryElement(element);
    } else {
        element.remove();
        console.log("entry removed");
    }

    validateEntries();
    updateDomains();
}

function populateDomainEntryList(item) {
    if (!item.tailoredDomains || item.tailoredDomains.length === 0) {
        insertEntryElement();
        disableNewEntries();
        return;
    }

    item.tailoredDomains.forEach(domain => insertEntryElement(domain.domain));
}

function validateEntries() {
    const entryInputs = document.querySelectorAll(".js-entry-domain-input");
    const entryInputValues = Array.from(entryInputs).map(
        entryInput => entryInput.value
    );

    if (entryInputValues.includes("")) {
        disableNewEntries();
    } else {
        enableNewEntries();
    }
}

document.addEventListener("click", e => {
    const clickTarget = e.target.closest("[data-click-action]");

    if (clickTarget && clickTarget.dataset.clickAction === "add-entry") {
        insertEntryElement();
        disableNewEntries();
    }

    if (clickTarget && clickTarget.dataset.clickAction === "remove-entry") {
        const entryToRemove = clickTarget.closest(".js-entry");
        removeEntryElement(entryToRemove);
    }
});

document.addEventListener("change", e => {
    if (e.target.classList.contains("js-entry-domain-input")) {
        updateDomains();
    }
});

document.addEventListener("input", e => {
    if (e.target.classList.contains("js-entry-domain-input")) {
        validateEntries();
    }
});

browser.storage.sync
    .get("tailoredDomains")
    .then(populateDomainEntryList, onError);
