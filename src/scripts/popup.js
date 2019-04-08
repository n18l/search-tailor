const entryTemplate = document.querySelector("template#entry");

function logError(error) {
    console.error(error);
}

/* Class representing an entry in the list of tailored domains. */
class TailoredDomainListEntry {
    /**
     * Initialize the list entry.
     * @param {object} parentTailoredDomainList - The list object to add this entry to.
     * @param {string} [tailoredDomainSettings] - An object containing the settings to use for this entry.
     */
    constructor(
        parentTailoredDomainList,
        tailoredDomainSettings = {
            domain: "",
            treatment: null,
        }
    ) {
        this.parentList = parentTailoredDomainList;
        this.element = document
            .importNode(entryTemplate.content, true)
            .querySelector(".js-entry");
        this.domainInput = this.element.querySelector(".js-entry-domain-input");
        this.treatmentSelect = this.element.querySelector(
            ".js-entry-treatment-select"
        );
        this.treatmentOptions = Array.from(this.treatmentSelect.options).map(
            option => option.value
        );

        this.defineActions();
        this.bindEvents();

        if (tailoredDomainSettings.domain) {
            this.domainInput.value = tailoredDomainSettings.domain;
        }

        if (tailoredDomainSettings.treatment) {
            this.treatmentSelect.value = tailoredDomainSettings.treatment;
            this.actionButtons.toggleEntryTreatment.dataset.activeTreatment =
                tailoredDomainSettings.treatment;
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
            treatment: this.treatmentSelect.value,
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

        this.treatmentSelect.addEventListener("change", () =>
            this.parentList.synchronize()
        );

        this.actionButtons.toggleEntryTreatment.addEventListener("click", () =>
            this.cycleTreatmentSelect()
        );

        this.actionButtons.toggleEntryTreatment.addEventListener(
            "contextmenu",
            e => {
                e.preventDefault();
                this.cycleTreatmentSelect(-1);
            }
        );

        this.actionButtons.deleteEntry.addEventListener("click", () =>
            this.delete()
        );
    }

    /**
     * Reset the entry to its default state.
     */
    reset() {
        this.domainInput.value = "";
    }

    /**
     * Remove the entry from its parent list, or reset it if it is the only
     * remaining entry.
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

    /**
     * Programatically advance the treatment select field to the next option.
     */
    cycleTreatmentSelect(cycleAmount = 1) {
        if (cycleAmount === 0) return;

        const cycleDirection = cycleAmount > 0 ? "forwards" : "backwards";
        const adjustedAmount =
            cycleDirection === "backwards"
                ? this.treatmentOptions.length + cycleAmount
                : cycleAmount;
        const targetTreatmentIndex =
            this.treatmentOptions.indexOf(this.treatmentSelect.value) +
            adjustedAmount;
        const targetTreatmentOption = this.treatmentOptions[
            targetTreatmentIndex % this.treatmentOptions.length
        ];

        this.treatmentSelect.value = targetTreatmentOption;
        this.treatmentSelect.dispatchEvent(new Event("change"));
        this.actionButtons.toggleEntryTreatment.dataset.activeTreatment = targetTreatmentOption;
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
            .then(storageData => this.populate(storageData), logError);
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

        storageData.tailoredDomains.forEach(tailoredDomainSettings =>
            this.entries.push(
                new TailoredDomainListEntry(this, tailoredDomainSettings)
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
                .catch(logError);
        }

        browser.storage.sync
            .set({ tailoredDomains: validTailoredDomains })
            .then(getAffectedTabs, logError);
    }
}

(function initPopup() {
    return new TailoredDomainList(document.querySelector(".entry-list"));
})();
