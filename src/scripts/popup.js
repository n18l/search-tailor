const Sortable = require('sortablejs');
const addonData = require('./addonData');
const addonFunctions = require('./addonFunctions');

const entryTemplate = document.querySelector("template#entry");
const swatchTemplate = document.querySelector("template#swatch");

function logError(error) {
    console.error(error);
}

/* Class representing an entry in the list of tailored domains. */
class TailoredDomainListEntry {
    /**
     * Initialize the list entry.
     * @param {object} parentTailoredDomainList - The list object to add this entry to.
     * @param {object} [tailoredDomainSettings] - An object containing the settings to use for this entry.
     */
    constructor(
        parentTailoredDomainList,
        tailoredDomainSettings = {
            domain: "",
            tailoringTemplateID: "",
            treatment: null,
        }
    ) {
        this.cacheData(parentTailoredDomainList);
        this.populateSwatchDrawer();
        this.defineActions();
        this.bindEvents();

        if (tailoredDomainSettings.domain) {
            this.domainInput.value = tailoredDomainSettings.domain;
        }

        this.tailoringTemplateIDInput.value = this.getTailoringTemplateByID(
            tailoredDomainSettings.tailoringTemplateID
        )
            ? tailoredDomainSettings.tailoringTemplateID
            : this.parentList.tailoringTemplates[0].id;
        addonFunctions.applyTailoringTemplateStyles(
            this.getTailoringTemplateByID(this.tailoringTemplateIDInput.value),
            this.actionButtons.toggleSwatchDrawer
        );

        if (tailoredDomainSettings.treatment) {
            this.activeTreatment =
                tailoredDomainSettings.treatment || this.treatmentSelect.value;
        }

        this.parentList.element.appendChild(this.element);
        this.domainInput.focus();
    }

    /**
     * Cache selectors and other immutable data for this entry.
     */
    cacheData(parentTailoredDomainList) {
        // This entry.
        this.element = document
            .importNode(entryTemplate.content, true)
            .querySelector(".js-entry");

        // The list object containing this entry.
        this.parentList = parentTailoredDomainList;

        // Input elements for this entry.
        this.domainInput = this.element.querySelector(".js-entry-domain-input");
        this.tailoringTemplateIDInput = this.element.querySelector(
            ".js-entry-tailoring-template-id-input"
        );
        this.treatmentSelect = this.element.querySelector(
            ".js-entry-treatment-select"
        );

        // Options from the treatment select input.
        this.treatmentOptions = Array.from(this.treatmentSelect.options).map(
            option => option.value
        );

        // The drawer and list elements for tailoring template swatches.
        this.swatchDrawer = this.element.querySelector(".js-swatch-drawer");
        this.swatchList = this.swatchDrawer.querySelector(".js-swatch-list");
    }

    /**
     * Identify and assign the entry's action buttons.
     */
    defineActions() {
        this.actionButtons = {};

        // Assign each Node with a "data-click-action" attribute value to a
        // matching actionButton property.
        const actionButtons = this.element.querySelectorAll(
            "[data-click-action]"
        );

        actionButtons.forEach(actionButton => {
            const { clickAction } = actionButton.dataset;
            this.actionButtons[clickAction] = actionButton;
        });

        // Assign a NodeList of all Nodes sharing a "data-click-action[]"
        // attribute value to a matching actionButton property.
        const actionButtonArrays = this.element.querySelectorAll(
            "[data-click-action\\[\\]]"
        );

        actionButtonArrays.forEach(actionButtonArray => {
            const clickAction = actionButtonArray.dataset["clickAction[]"];
            this.actionButtons[clickAction] = this.element.querySelectorAll(
                `[data-click-action\\[\\]="${clickAction}"]`
            );
        });
    }

    /**
     * Attach event handlers.
     */
    bindEvents() {
        this.domainInput.addEventListener("change", () =>
            this.parentList.syncToStorage()
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

        this.tailoringTemplateIDInput.addEventListener("change", e => {
            addonFunctions.applyTailoringTemplateStyles(
                this.getTailoringTemplateByID(e.target.value),
                this.actionButtons.toggleSwatchDrawer
            );
            this.parentList.syncToStorage();
        });

        this.treatmentSelect.addEventListener("change", () =>
            this.parentList.syncToStorage()
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

        this.actionButtons.toggleSwatchDrawer.addEventListener("click", () =>
            this.toggleSwatchDrawer()
        );

        this.actionButtons.selectTailoringTemplate.forEach(actionButton => {
            actionButton.addEventListener("click", e => {
                this.updateEntryTailoringTemplate(
                    e.target.tailoringTemplate.id
                );
            });
        });
    }

    /**
     * Get the value of the entry as an object.
     */
    get value() {
        return {
            domain: this.domainInput.value,
            tailoringTemplateID: this.tailoringTemplateIDInput.value,
            treatment: this.treatmentSelect.value,
        };
    }

    /**
     * Set the the entry's active tailoring treatment.
     */
    set activeTreatment(newTreatment) {
        this.treatmentSelect.value = newTreatment;
        this.element.dataset.activeTreatment = newTreatment;
        this.toggleSwatchDrawer(false);
    }

    updateEntryTailoringTemplate(newTemplateID) {
        this.tailoringTemplateIDInput.value = newTemplateID;
        this.tailoringTemplateIDInput.dispatchEvent(new Event("change"));
    }

    getTailoringTemplateByID(templateID) {
        return this.parentList.tailoringTemplates.find(
            template => template.id === templateID
        );
    }

    populateSwatchDrawer() {
        this.parentList.tailoringTemplates.forEach(tailoringTemplate => {
            const swatchWrapper = document
                .importNode(swatchTemplate.content, true)
                .querySelector(".js-swatch-wrapper");

            const swatch = swatchWrapper.querySelector(".js-swatch");

            swatch.tailoringTemplate = tailoringTemplate;

            addonFunctions.applyTailoringTemplateStyles(
                this.getTailoringTemplateByID(tailoringTemplate.id),
                swatch,
                true
            );

            this.swatchList.appendChild(swatchWrapper);
        });
    }

    /**
     * Reset the entry to its default state.
     */
    reset() {
        this.domainInput.value = "";
        [
            this.tailoringTemplateIDInput.value,
        ] = this.parentList.tailoringTemplates;
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
        this.parentList.syncToStorage();
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

        this.activeTreatment = targetTreatmentOption;
        this.treatmentSelect.dispatchEvent(new Event("change"));
    }

    toggleSwatchDrawer(shouldBeOpen = null) {
        const swatchDrawerOpenClass = "entry__swatch-drawer--is-open";
        const swatchDrawerIsOpen = this.swatchDrawer.classList.contains(
            swatchDrawerOpenClass
        );

        this.swatchDrawer.classList.toggle(
            swatchDrawerOpenClass,
            shouldBeOpen !== null ? shouldBeOpen : !swatchDrawerIsOpen
        );
        this.actionButtons.toggleSwatchDrawer.title = swatchDrawerIsOpen
            ? "Change Template"
            : "Hide Templates";
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
            .get(["tailoredDomains", "tailoringTemplates"])
            .then(storageData => {
                this.tailoringTemplates =
                    storageData.tailoringTemplates ||
                    addonData.defaultUserData.tailoringTemplates;
                this.populate(storageData);
            }, logError);
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
     * Update the order of the list's entries.
     * @param {integer} fromIndex - The index of the entry being reordered.
     * @param {integer} toIndex - The index where the reordered entry should be placed.
     */
    reorderEntry(fromIndex, toIndex) {
        const entryToMove = this.entries.splice(fromIndex, 1)[0];
        this.entries.splice(toIndex, 0, entryToMove);
        this.syncToStorage();
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
    syncToStorage() {
        const validTailoredDomains = this.entryValues.filter(
            entryValueSet => entryValueSet.domain !== ""
        );

        browser.storage.sync
            .set({ tailoredDomains: validTailoredDomains })
            .then(null, logError);
    }
}

const entryListElement = document.querySelector(".entry-list");

const currentTailoredDomainList = (function initTailoredDomainList() {
    return new TailoredDomainList(entryListElement);
})();

(function enableDomainListSorting() {
    return new Sortable(entryListElement, {
        handle: ".js-sort-handle",
        animation: 150,
        onUpdate(event) {
            currentTailoredDomainList.reorderEntry(
                event.oldIndex,
                event.newIndex
            );
        },
    });
})();
