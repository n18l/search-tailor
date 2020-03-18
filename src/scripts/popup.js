const Sortable = require('sortablejs');
const addonData = require('./addonData');
const addonFunctions = require('./addonFunctions');

const entryGroupContainer = document.querySelector(".js-entry-group-container");
const entryGroupTemplate = document.querySelector("template#entry-group");
const entryTemplate = document.querySelector("template#entry");
const swatchTemplate = document.querySelector("template#swatch");

const tailoredDomainGroups = {};

function logError(error) {
    console.error(error);
}

/**
 * Synchronize the list's current entries with the browser.storage API,
 * then reinitialize the addon in any tabs affected by the extension.
 */
function syncTailoredDomainsToStorage() {
    let allEntryValues = [];

    Object.entries(tailoredDomainGroups).forEach(([, tailoredDomainGroup]) => {
        allEntryValues = allEntryValues.concat(tailoredDomainGroup.entryValues);
    });

    const validTailoredDomains = allEntryValues.filter(
        entryValues => entryValues.domain !== ""
    );

    browser.storage.sync
        .set({ tailoredDomains: validTailoredDomains })
        .then(null, logError);
}

/* Class representing an entry in the list of tailored domains. */
class TailoredDomainListEntry {
    /**
     * Initialize the list entry.
     * @param {object} parentTailoredDomainGroup - The list object to add this entry to.
     * @param {object} [tailoredDomainSettings] - An object containing the settings to use for this entry.
     * @param {boolean} [focusInput] - Whether to focus this entry's domain input field on creation.
     */
    constructor(
        parentTailoredDomainGroup,
        tailoredDomainSettings = {
            domain: "",
            tailoringTemplateID: "",
            treatment: null,
        },
        focusInput = false
    ) {
        this.cacheData(parentTailoredDomainGroup);
        this.populateSwatchDrawer();
        this.defineActions();
        this.bindEvents();

        if (tailoredDomainSettings.domain) {
            this.domainInput.value = tailoredDomainSettings.domain;
            this.element.dataset.dragDisabled = false;
        } else {
            this.element.dataset.dragDisabled = true;
        }

        this.tailoringTemplateIDInput.value = this.getTailoringTemplateByID(
            tailoredDomainSettings.tailoringTemplateID
        )
            ? tailoredDomainSettings.tailoringTemplateID
            : this.parentGroup.tailoringTemplates[0].id;

        addonFunctions.applyTailoringTemplateStyles(
            this.getTailoringTemplateByID(this.tailoringTemplateIDInput.value),
            this.actionButtons.toggleSwatchDrawer
        );

        if (tailoredDomainSettings.treatment) {
            this.activeTreatment =
                tailoredDomainSettings.treatment || this.treatmentSelect.value;
        }

        this.parentGroup.entryList.appendChild(this.element);

        if (focusInput) {
            this.domainInput.focus();
        }
    }

    /**
     * Cache selectors and other immutable data for this entry.
     */
    cacheData(parentTailoredDomainGroup) {
        // This entry.
        this.element = document
            .importNode(entryTemplate.content, true)
            .querySelector(".js-entry");

        // The list object containing this entry.
        this.parentGroup = parentTailoredDomainGroup;

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
        this.domainInput.addEventListener("change", () => {
            this.element.dataset.dragDisabled = this.domainInput.value === '';

            syncTailoredDomainsToStorage()
        });

        this.domainInput.addEventListener("input", () =>
            this.parentGroup.validateEntries(
                () => this.parentGroup.enableNewEntries(),
                () => this.parentGroup.disableNewEntries()
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
            syncTailoredDomainsToStorage();
        });

        this.treatmentSelect.addEventListener("change", e => {
            // Identify the newly selected treatment group and move this entry
            // to that group, updating the UI to match.
            const newTreatmentGroup = tailoredDomainGroups[e.target.value];
            this.move(newTreatmentGroup.entries.length, newTreatmentGroup, true);
        });

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
     * Gets the position of this entry among others in its group.
     */
    get index() {
        return this.parentGroup.entries.indexOf(this);
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
        this.parentGroup = tailoredDomainGroups[newTreatment];
        this.treatmentSelect.value = newTreatment;
        this.element.dataset.activeTreatment = newTreatment;
        this.toggleSwatchDrawer(false);
    }

    updateEntryTailoringTemplate(newTemplateID) {
        this.tailoringTemplateIDInput.value = newTemplateID;
        this.tailoringTemplateIDInput.dispatchEvent(new Event("change"));
    }

    getTailoringTemplateByID(templateID) {
        return this.parentGroup.tailoringTemplates.find(
            template => template.id === templateID
        );
    }

    populateSwatchDrawer() {
        this.parentGroup.tailoringTemplates.forEach(tailoringTemplate => {
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
     * Moves this entry within or between groups.
     *
     * @param {integer} targetIndex - The index in the target group where this entry should be placed.
     * @param {integer} targetGroup - The group to which the moved entry should be assigned.
     * @param {boolean} updateUI - Whether the entry's element should be removed and added to the new list.
     */
    move(targetIndex, targetGroup = this, updateUI = false) {
        // Remove this entry from its current position in its parent group's
        // entry array.
        this.parentGroup.entries.splice(this.index, 1);

        // Update the entry's treatment type if switching groups.
        if (targetGroup !== this.parentGroup) {
            this.activeTreatment = targetGroup.treatmentType;
        }

        if (updateUI) {
            // Remove the entry's element and reinitialize it to manually create
            // a new one.
            this.element.remove();
            targetGroup.entries.push(new TailoredDomainListEntry(targetGroup, this.value));
        } else {
            // Insert this entry's object into the target group's entry array.
            targetGroup.entries.splice(targetIndex, 0, this);
        }

        syncTailoredDomainsToStorage();
    }

    /**
     * Remove the entry from its parent list.
     */
    delete() {
        this.parentGroup.entries.splice(this.index, 1);
        this.element.remove();

        this.parentGroup.validateEntries(
            () => this.parentGroup.enableNewEntries(),
            () => this.parentGroup.disableNewEntries()
        );

        syncTailoredDomainsToStorage();
    }

    /**
     * Test the entry's validity.
     * @returns {boolean} - Whether or not this entry is valid.
     */
    validate() {
        const validityRequirements = [this.domainInput.value !== ""];

        return !validityRequirements.includes(false);
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
class TailoredDomainGroup {
    /**
     * Initialize the entry group's data object and corresponding UI.
     *
     * @param {Object} treatment - The treatment data to use to initialize this group.
     */
    constructor(treatment) {
        this.cacheData(treatment);
        this.bindEvents();

        browser.storage.sync
            .get(["tailoredDomains", "tailoringTemplates"])
            .then(storageData => {
                this.tailoringTemplates =
                    storageData.tailoringTemplates ||
                    addonData.defaultUserData.tailoringTemplates;
                this.populate(storageData);
            }, logError);

        entryGroupContainer.appendChild(this.element);
    }

    /**
     * Caches immutable data for future access.
     *
     * @param {Object} treatment - The treatment data to use to initialize this group.
     */
    cacheData(treatment) {
        // Save a reference to the data used to initialize the group.
        this.treatment = treatment;

        // Initialize the element representing this entry group.
        this.element = document
            .importNode(entryGroupTemplate.content, true)
            .querySelector('.js-entry-group');

        this.treatmentType = treatment.id;
        this.title = treatment.label;

        // Save references to relevant child nodes of this group.
        this.entryList = this.element
            .querySelector('.js-entry-list');
        this.addEntryButton = this.element
            .querySelector('[data-click-action="addEntry"]');

        // Initialize the array of entries for the group.
        this.entries = [];
    }

    /**
     * Gets all of the list's current entries.
     * @returns {array} - An array of the current values of each list item.
     */
    get entryValues() {
        return this.entries.map(entry => entry.value);
    }

    /**
     * The ID of this group's current treatment, which ties this group's UI to
     * its object via data-attribute.
     *
     * @param {string} newTreatmentType - The treatment type to apply to this group.
     */
    set treatmentType(newTreatmentType) {
        this.element.dataset.treatmentType = newTreatmentType;
    }

    get treatmentType() {
        return this.treatment.id;
    }

    /**
     * The text title of this group's UI.
     *
     * @param {string} newTitle - The title to apply to this group.
     */
    set title(newTitle) {
        this.element.querySelector('.js-entry-group-title').textContent = newTitle;
    }

    /**
     * Attach event handlers.
     */
    bindEvents() {
        this.addEntryButton.addEventListener('click', () => {
            this.disableNewEntries();

            this.entries.push(new TailoredDomainListEntry(this, {
                domain: '',
                tailoringTemplateID: '',
                treatment: this.treatmentType,
            }, true));
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

        // Get all tailored domains for this group's treatment type.
        const tailoredDomainsOfType = storageData.tailoredDomains
            .filter(tailoredDomain => tailoredDomain.treatment === this.treatmentType);

        tailoredDomainsOfType.forEach(tailoredDomainSettings =>
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
}


/**
 * Initialize and store each group of domain entries, keyed by treatment type.
 */
addonData.treatmentTypes.forEach(treatment => {
    tailoredDomainGroups[treatment.id] = new TailoredDomainGroup(treatment);
});

/**
 * Initialize domain list sorting by creating a new sortable list for each group
 * of domains based on their treatment type.
 */
(function enableDomainListSorting() {
    Object.entries(tailoredDomainGroups).forEach(
        ([, tailoredDomainGroup]) => new Sortable(tailoredDomainGroup.entryList, {
            handle: ".js-sort-handle",
            filter: "[data-drag-disabled='true']",
            group: "tailoring-domains",
            animation: 150,
            onEnd(event) {
                // Identify the treatment list being moved from and to.
                const oldTreatment = event.from.closest('.js-entry-group').dataset.treatmentType;
                const newTreatment = event.to.closest('.js-entry-group').dataset.treatmentType;

                // Identify the entry being moved.
                const draggedItem = tailoredDomainGroups[oldTreatment].entries[event.oldIndex];

                // Move the entry from the old treatment group to the new one.
                draggedItem.move(event.newIndex, tailoredDomainGroups[newTreatment]);
            },
        })
    );
})();
