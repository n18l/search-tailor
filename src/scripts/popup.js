const entryTemplate = document.querySelector("template#entry");

function onError(error) {
    console.error(error);
}

/* Class representing an entry in the list of tailored domains */
class TailoredDomainListEntry {
    /**
     * Initialize the list entry.
     * @param {object} parentTailoredDomainList - The list object to add this entry to.
     * @param {string} [domain=""] - A domain to initialize this entry's input value to.
     */
    constructor(parentTailoredDomainList, domainValue = "") {
        this.parentList = parentTailoredDomainList;
        this.element = document
            .importNode(entryTemplate.content, true)
            .querySelector(".js-entry");
        this.domainInput = this.element.querySelector(".js-entry-domain-input");

        this.defineActions();
        this.bindEvents();

        if (domainValue) {
            this.domainInput.setAttribute("value", domainValue);
        }

        this.parentList.element.appendChild(this.element);
        this.domainInput.focus();
    }

    /**
     * Get the value of the entry as an object.
     */
    get value() {
        return {
            domain: this.domainInput.value,
            treatment: "spotlight",
        };
    }

    /**
     * Identify and assign the entry's action buttons.
     */
    defineActions() {
        this.actionButtons = {};
        const actionButtons = this.element.querySelectorAll(
            "[data-click-action]"
        );

        actionButtons.forEach(actionButton => {
            this.actionButtons[actionButton.dataset.clickAction] = actionButton;
        });
    }

    /**
     * Attach event handlers.
     */
    bindEvents() {
        this.actionButtons.deleteEntry.addEventListener("click", () =>
            this.delete()
        );

        this.domainInput.addEventListener("change", () =>
            this.parentList.synchronize()
        );
        this.domainInput.addEventListener("input", () =>
            this.parentList.validateEntries(
                () => this.parentList.enableNewEntries(),
                () => this.parentList.disableNewEntries()
            )
        );
        this.domainInput.addEventListener("keypress", e => {
            if (e.key === " ") e.preventDefault();
        });
    }

    /**
     * Reset the entry to its default state.
     */
    reset() {
        this.domainInput.value = "";
    }

    /**
     * Remove the entry from its parent list, or reset it if it is the last entry.
     */
    delete() {
        const numberOfEntries = this.parentList.entries.length;

        if (numberOfEntries === 1) {
            this.reset();
        } else {
            const entryIndex = this.parentList.entries.indexOf(this);
            this.parentList.entries.splice(entryIndex, 1);
            this.element.remove();
        }

        this.parentList.validateEntries(
            () => this.parentList.enableNewEntries(),
            () => this.parentList.disableNewEntries()
        );
        this.parentList.synchronize();
    }

    /**
     * Test the entry's validity.
     * @returns {boolean} - Whether or not this entry is valid.
     */
    validate() {
        const validityRequirements = [this.domainInput.value !== ""];

        return !validityRequirements.includes(false);
    }
}

/** Class representing the interactive list of tailored domains. */
class TailoredDomainList {
    /**
     * Initialize the list UI.
     * @param {object} entryListElement - The HTML element representing the list.
     */
    constructor(entryListElement) {
        this.entries = [];
        this.element = entryListElement;
        this.addEntryButton = document.querySelector(
            '[data-click-action="addEntry"]'
        );

        this.bindEvents();

        browser.storage.sync
            .get("tailoredDomains")
            .then(storageData => this.populate(storageData), onError);
    }

    /**
     * Get all of the list's current entries.
     * @returns {array} - An array of the current values of each list item.
     */
    get entryValues() {
        return this.entries.map(entry => entry.value);
    }

    /**
     * Attach event handlers.
     */
    bindEvents() {
        document.addEventListener("click", e => {
            const clickTarget = e.target.closest("[data-click-action]");

            if (clickTarget && clickTarget.dataset.clickAction === "addEntry") {
                this.disableNewEntries();
                this.entries.push(new TailoredDomainListEntry(this));
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
            this.disableNewEntries();
            this.entries.push(new TailoredDomainListEntry(this));
        }

        storageData.tailoredDomains.forEach(tailoredDomain =>
            this.entries.push(
                new TailoredDomainListEntry(this, tailoredDomain.domain)
            )
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
     * Validate each of the list's entries.
     * @param {function} [validCallback] - A function to call if all entries are valid.
     * @param {function} [invalidCallback] - A function to call if any entries are invalid.
     * @returns {array} - An array representing each entry's validity state.
     */
    validateEntries(validCallback = null, invalidCallback = null) {
        const entryValidityStates = this.entries.map(entry => entry.validate());

        if (invalidCallback && entryValidityStates.includes(false)) {
            invalidCallback();
        } else if (validCallback) {
            validCallback();
        }

        return entryValidityStates;
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
