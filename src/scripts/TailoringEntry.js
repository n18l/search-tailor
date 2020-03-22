const addonData = require("./addonData");
const addonFunctions = require("./addonFunctions");

/**
 * The interactive representation of a tailoring entry.
 */
class TailoringEntry {
    /**
     * Initialize the list entry.
     *
     * @param {Object} [tailoringEntry] The tailoring settings to use for this entry.
     * @param {boolean} [focusInput] Whether to focus this entry's domain input field on creation.
     */
    constructor(
        tailoringEntry = {
            domain: "",
            treatment: null,
        },
        focusInput = false
    ) {
        this.cacheData(tailoringEntry);
        this.populateTreatmentSelect();
        this.populateSwatchDrawer();
        this.defineActions();
        this.bindEvents();

        if (tailoringEntry.domain) {
            this.domainInput.value = tailoringEntry.domain;
            this.element.dataset.dragDisabled = false;
        } else {
            this.element.dataset.dragDisabled = true;
        }

        this.treatmentSelect.value = this.settings.treatment;

        addonFunctions.applyTailoringTreatmentToElement(
            addonFunctions.getTailoringTreatmentByID(
                this.treatmentSelect.value
            ),
            this.actionButtons.toggleSwatchDrawer
        );

        this.parentGroup.entryList.appendChild(this.element);

        if (focusInput) {
            this.domainInput.focus();
        }
    }

    populateTreatmentSelect() {
        addonData.local.tailoringTreatments.forEach(treatment => {
            const optionElement = document.createElement("option");
            optionElement.setAttribute("value", treatment.id);
            optionElement.textContent = treatment.label;

            this.treatmentSelect.appendChild(optionElement);
        });
    }

    /**
     * Cache selectors and other immutable data for this entry.
     */
    cacheData(tailoringEntry) {
        this.settings = tailoringEntry;

        this.elementTemplate = document.querySelector("template#entry");
        this.swatchTemplate = document.querySelector("template#swatch");

        // This entry.
        this.element = document
            .importNode(this.elementTemplate.content, true)
            .querySelector(".js-entry");

        // Input elements for this entry.
        this.domainInput = this.element.querySelector(".js-entry-domain-input");
        this.treatmentSelect = this.element.querySelector(
            ".js-entry-treatment-select"
        );

        // The drawer and list elements for tailoring treatment swatches.
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
            this.element.dataset.dragDisabled = this.domainInput.value === "";

            addonFunctions.syncTailoringEntriesToStorage();
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

        this.treatmentSelect.addEventListener("change", e => {
            addonFunctions.applyTailoringTreatmentToElement(
                addonFunctions.getTailoringTreatmentByID(e.target.value),
                this.actionButtons.toggleSwatchDrawer
            );

            this.element.dataset.activeTreatment = e.target.value;

            // Identify the newly selected treatment group and move this entry
            // to that group, updating the UI to match.
            const newTreatmentGroup = addonFunctions.getTailoringGroupByTreatmentID(
                e.target.value
            );
            this.move(
                newTreatmentGroup.entries.length,
                newTreatmentGroup,
                true
            );
        });

        this.actionButtons.deleteEntry.addEventListener("click", () =>
            this.delete()
        );

        this.actionButtons.toggleSwatchDrawer.addEventListener("click", () =>
            this.toggleSwatchDrawer()
        );
    }

    get parentGroup() {
        return addonFunctions.getTailoringGroupByTreatmentID(
            this.settings.treatment
        );
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
            treatment: this.treatmentSelect.value,
        };
    }

    populateSwatchDrawer() {
        addonData.local.tailoringTreatments.forEach(tailoringTreatment => {
            const swatchWrapper = document
                .importNode(this.swatchTemplate.content, true)
                .querySelector(".js-swatch-wrapper");

            const swatch = swatchWrapper.querySelector(".js-swatch");

            swatch.tailoringTreatment = tailoringTreatment;

            addonFunctions.applyTailoringTreatmentToElement(
                addonFunctions.getTailoringTreatmentByID(tailoringTreatment.id),
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
    move(targetIndex, targetGroup = this.parentGroup, updateUI = false) {
        let entry = this;

        // Remove this entry from its current position in its parent group's
        // entry array.
        entry.parentGroup.entries.splice(entry.index, 1);

        if (updateUI) {
            // Remove the entry's element and reinitialize it to manually create
            // a new one.
            entry.element.remove();
            entry = new TailoringEntry({
                domain: this.value.domain,
                treatment: targetGroup.treatment.id,
            });
            targetGroup.entries.push(entry);
        } else {
            // Insert this entry's object into the target group's entry array.
            targetGroup.entries.splice(targetIndex, 0, entry);
        }

        // Update the entry's treatment type if switching groups.
        if (targetGroup !== entry.parentGroup) {
            entry.settings.treatment = targetGroup.treatment.id;
            entry.treatmentSelect.value = targetGroup.treatment.id;
            entry.element.dataset.activeTreatment = targetGroup.treatment.id;
        }

        addonFunctions.syncTailoringEntriesToStorage();
    }

    /**
     * Remove the entry from its parent list.
     */
    delete() {
        console.log(this.parentGroup.entries);
        this.parentGroup.entries.splice(this.index, 1);
        this.element.remove();

        this.parentGroup.validateEntries(
            () => this.parentGroup.enableNewEntries(),
            () => this.parentGroup.disableNewEntries()
        );

        console.log(this.parentGroup.entries);

        addonFunctions.syncTailoringEntriesToStorage();
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
            ? "Change Treatment"
            : "Hide Treatments";
    }
}

module.exports = TailoringEntry;