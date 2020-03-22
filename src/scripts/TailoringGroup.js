const Sortable = require("sortablejs");
const ColorPicker = require("vanilla-picker");
const addonFunctions = require("./addonFunctions");
const TailoringEntry = require("./TailoringEntry");

/**
 * The interactive representation of tailoring template, grouping together all
 * entries to which the template applies.
 */
class TailoringGroup {
    /**
     * Initialize the entry group's data object and corresponding UI.
     *
     * @param {Object} treatment - The treatment data to use to initialize this group.
     */
    constructor(treatment) {
        this.cacheData(treatment);
        this.defineActions();
        this.bindEvents();
        this.enableEntrySorting();

        if (this.treatment.label) {
            this.labelInput.value = this.treatment.label;
        }

        const entryGroupContainer = document.querySelector(
            ".js-entry-group-container"
        );
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
        this.elementTemplate = document.querySelector("template#entry-group");
        this.element = document
            .importNode(this.elementTemplate.content, true)
            .querySelector(".js-entry-group");

        // Add this group's treatment ID to its HTML element for styling.
        this.element.dataset.treatmentId = treatment.id;

        // Save references to relevant child nodes of this group.
        this.entryList = this.element.querySelector(".js-entry-list");
        this.titleElement = this.element.querySelector(".js-entry-group-title");
        this.settingsDrawer = this.element.querySelector(
            ".js-entry-group-settings-drawer"
        );
        this.labelInput = this.element.querySelector(
            ".js-treatment-label-input"
        );

        // Set this group's display title.
        this.title = this.treatment.label;

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
     * Gets whether this group's settings drawer is currently open.
     *
     * @returns {boolean} Whether the settings drawer is currently open.
     */
    get settingsDrawerIsOpen() {
        return this.settingsDrawer.dataset.isOpen === "true";
    }

    /**
     * Updates this group's settings drawer's HTML to reflect its new state.
     *
     * @param {boolean} newDrawerState - The updated drawer state.
     */
    set settingsDrawerIsOpen(newDrawerState) {
        this.settingsDrawer.dataset.isOpen = newDrawerState;
        this.actionButtons.toggleSettingsDrawer.dataset.actionActive = newDrawerState;
    }

    /**
     * The text title to display for this group in the popup UI.
     *
     * @param {string} newTitle - The title to apply to this group.
     */
    set title(newTitle) {
        let updatedTitle = newTitle;

        // Prepend "Spotlight" to this group if applicable.
        if (this.treatment.id.startsWith("spotlight")) {
            updatedTitle = `Spotlight: ${updatedTitle}`;
        }

        this.titleElement.textContent = updatedTitle;
    }

    /**
     * Identify and store references to this group's action buttons.
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
        this.actionButtons.addEntry.addEventListener("click", () => {
            this.disableNewEntries();

            this.entries.push(
                new TailoringEntry(
                    {
                        domain: "",
                        treatment: this.treatment.id,
                    },
                    true
                )
            );
        });

        // Toggle this group's settings drawer.
        this.actionButtons.toggleSettingsDrawer.addEventListener("click", () =>
            this.toggleSettingsDrawer()
        );

        // Update this group's title/treatment label on change.
        this.labelInput.addEventListener("change", e => {
            // Only proceed if this input's valud is valid.
            if (!e.target.validity.valid) return;

            // Update this group's label and title values.
            this.treatment.label = e.target.value;
            this.title = e.target.value;

            // Update the working copy data's label value.
            addonFunctions.getTailoringTreatmentByID(this.treatment.id).label =
                e.target.value;

            // Save the working copy data to storage.
            addonFunctions.syncTailoringTreatmentsToStorage();
        });

        // Initialize this group's background color picker.
        this.backgroundPicker = new ColorPicker({
            parent: this.actionButtons.setBackgroundColor,
            color: this.treatment.backgroundColor,
            popup: "left",
            onChange: color => {
                // Update the icon color to reference the new selection.
                this.actionButtons.setBackgroundColor.style.setProperty(
                    "--color-background-icon-fill",
                    color.hslaString
                );

                // Update this group's color value.
                this.treatment.backgroundColor = color.hslaString;

                // Update the working copy data's color value.
                addonFunctions.getTailoringTreatmentByID(
                    this.treatment.id
                ).backgroundColor = color.hslaString;

                // Save the working copy data to storage.
                addonFunctions.syncTailoringTreatmentsToStorage();
            },
        });

        // Initialize this group's border color picker.
        this.borderPicker = new ColorPicker({
            parent: this.actionButtons.setBorderColor,
            color: this.treatment.borderColor,
            popup: "left",
            onChange: color => {
                // Update the icon color to reference the new selection.
                this.actionButtons.setBorderColor.style.setProperty(
                    "--color-border-icon-fill",
                    color.hslaString
                );

                // Update this group's color value.
                this.treatment.borderColor = color.hslaString;

                // Update the working copy data's color value.
                addonFunctions.getTailoringTreatmentByID(
                    this.treatment.id
                ).borderColor = color.hslaString;

                // Save the working copy data to storage.
                addonFunctions.syncTailoringTreatmentsToStorage();
            },
        });
    }

    /**
     * Prevent the addition of new entries by users.
     */
    disableNewEntries() {
        this.actionButtons.addEntry.setAttribute("disabled", "");
    }

    /**
     * Allow the addition of new entries by users.
     */
    enableNewEntries() {
        this.actionButtons.addEntry.removeAttribute("disabled");
    }

    /**
     * Toggles this group's settings drawer open and closed.
     *
     * @param {boolean|null} shouldBeOpen - Whether to force the drawer to a particular state.
     */
    toggleSettingsDrawer(shouldBeOpen = null) {
        // Set the drawer's new state, preferring the passed state but falling
        // back to the opposite of its current state.
        this.settingsDrawerIsOpen =
            shouldBeOpen !== null ? shouldBeOpen : !this.settingsDrawerIsOpen;

        // Update the title text of the drawer's action button.
        this.actionButtons.toggleSettingsDrawer.title = this
            .settingsDrawerIsOpen
            ? "Hide group settings"
            : "View group settings";
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
     * Enables drag & drop sorting of Tailoring Entries within this group's UI.
     */
    enableEntrySorting() {
        return new Sortable(this.entryList, {
            handle: ".js-sort-handle",
            filter: "[data-drag-disabled='true']",
            group: "tailoring-entries",
            animation: 150,
            onEnd(event) {
                // Identify the treatment list being moved from and to.
                const oldTreatment = event.from.closest(".js-entry-group")
                    .dataset.treatmentId;
                const newTreatment = event.to.closest(".js-entry-group").dataset
                    .treatmentId;

                // Identify the entry being moved.
                const draggedItem = addonFunctions.getTailoringGroupByTreatmentID(
                    oldTreatment
                ).entries[event.oldIndex];

                // Move the entry from the old treatment group to the new one.
                draggedItem.move(
                    event.newIndex,
                    addonFunctions.getTailoringGroupByTreatmentID(newTreatment)
                );
            },
        });
    }
}

module.exports = TailoringGroup;
