function onError(error) {
    console.error(error);
}

/** Class representing the interactive list of tailored domains. */
class TailoredDomainList {
    /**
     * Initialize the list UI.
     * @param {object} entryListElement - The HTML element representing the list.
     */
    constructor(entryListElement) {
        this.cacheData(entryListElement);
        this.bindEvents();

        browser.storage.sync
            .get("tailoredDomains")
            .then(storageData => this.populate(storageData), onError);
    }

    /**
     * Get all of the list's current entries.
     * @returns {object} - A nodelist of the current entries in the list.
     */
    get entries() {
        return this.entryList.querySelectorAll(".js-entry");
    }

    /**
     * Get all of the list's current entries.
     * @returns {array} - An array of the current values of each list item.
     */
    get entryValues() {
        return Array.from(this.entries).map(entry => ({
            domain: entry.querySelector(".js-entry-domain-input").value,
            treatment: "spotlight",
        }));
    }

    /**
     * Cache reusable data.
     * @param {object} entryListElement - The HTML element representing the list.
     */
    cacheData(entryListElement) {
        this.entryList = entryListElement;
        this.entryTemplate = document.querySelector("template#entry");
        this.addEntryButton = document.querySelector(
            '[data-click-action="add-entry"]'
        );
    }

    /**
     * Attach event handlers.
     */
    bindEvents() {
        document.addEventListener("click", e => {
            const clickTarget = e.target.closest("[data-click-action]");

            if (
                clickTarget &&
                clickTarget.dataset.clickAction === "add-entry"
            ) {
                this.addEntry();
                this.disableNewEntries();
            }

            if (
                clickTarget &&
                clickTarget.dataset.clickAction === "remove-entry"
            ) {
                const entryToRemove = clickTarget.closest(".js-entry");
                this.removeEntry(entryToRemove);
            }
        });

        this.entryList.addEventListener("change", e => {
            if (e.target.classList.contains("js-entry-domain-input")) {
                this.synchronize();
            }
        });

        this.entryList.addEventListener("input", e => {
            if (e.target.classList.contains("js-entry-domain-input")) {
                this.validateEntries();
            }
        });

        this.entryList.addEventListener("keypress", e => {
            if (e.target.classList.contains("js-entry-domain-input")) {
                if (e.key === " ") e.preventDefault();
            }
        });
    }

    /**
     * Populate the list with existing extension data or an empty entry.
     * @param {object} storageData - Existing extension data passed by the browser.storage API.
     */
    populate(storageData) {
        if (
            !storageData.tailoredDomains ||
            storageData.tailoredDomains.length === 0
        ) {
            this.addEntry();
            this.disableNewEntries();
            return;
        }

        storageData.tailoredDomains.forEach(tailoredDomain =>
            this.addEntry(tailoredDomain.domain)
        );
    }

    /**
     * Prevent the addition of new entries by users.
     */
    disableNewEntries() {
        this.addEntryButton.setAttribute("disabled", "");
    }

    /**
     * Allow the addition of new entries by users.
     */
    enableNewEntries() {
        this.addEntryButton.removeAttribute("disabled");
    }

    /**
     * Append a new entry to the list.
     * @param {string} [domain] - A domain to initialize the new entry's input value to.
     */
    addEntry(domain = "") {
        const newEntry = document.importNode(this.entryTemplate.content, true);
        const newEntryInput = newEntry.querySelector(".js-entry-domain-input");

        if (domain) {
            newEntryInput.setAttribute("value", domain);
        }

        this.entryList.appendChild(newEntry);
        newEntryInput.focus();
    }

    /**
     * Reset a list entry to its default state.
     * @param {object} entry - The entry node to reset.
     */
    static resetEntry(entry) {
        const entryInput = entry.querySelector(".js-entry-domain-input");
        entryInput.value = "";
    }

    /**
     * Remove an entry from the list, or reset it if it is the last entry.
     * @param {object} entry - The entry node to remove.
     */
    removeEntry(entry) {
        const numberOfEntries = this.entries.length;

        if (numberOfEntries === 1) {
            this.resetEntry(entry);
        } else {
            entry.remove();
        }

        this.validateEntries();
        this.synchronize();
    }

    /**
     * Validate entries to determine whether the user should be allowed to add more.
     * @param {...object} entries - The entry node(s) to validate. Defaults to all nodes.
     */
    validateEntries(...entries) {
        const entriesToValidate = entries.length
            ? entries
            : Array.from(this.entries);
        const inputValues = entriesToValidate.map(
            entry => entry.querySelector(".js-entry-domain-input").value
        );

        if (inputValues.includes("")) {
            this.disableNewEntries();
        } else {
            this.enableNewEntries();
        }
    }

    /**
     * Synchronize the list's current entries with the browser.storage API,
     * then reinitialize the addon in any tabs affected by the extension.
     */
    synchronize() {
        const validTailoredDomains = this.entryValues.filter(
            entryValueSet => entryValueSet.domain !== ""
        );

        function getAffectedTabs() {
            const addonManifest = browser.runtime.getManifest();
            const allowedDomains = addonManifest.content_scripts[0].matches;

            function requestTabUpdate(tabs) {
                tabs.forEach(tab => {
                    browser.tabs.sendMessage(tab.id, {
                        command: "reinitialize",
                    });
                });
            }

            browser.tabs
                .query({ url: allowedDomains })
                .then(requestTabUpdate)
                .catch(onError);
        }

        browser.storage.sync
            .set({ tailoredDomains: validTailoredDomains })
            .then(getAffectedTabs, onError);
    }
}

(function initPopup() {
    return new TailoredDomainList(document.querySelector(".entry-list"));
})();
