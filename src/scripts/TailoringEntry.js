import TokenField from "tokenfield";
import ColorPicker from "vanilla-picker";
import addonData from "./addonData";
import {
    qs,
    qsa,
    generateTailoringEntryID,
    saveTailoringEntries,
} from "./addonFunctions";

/**
 * The interactive representation of a tailoring entry.
 */
class TailoringEntry {
    /**
     * Initializes this tailoring entry interface.
     *
     * @param {Object} [tailoringEntry] The settings object to base this interface on.
     * @param {boolean} [focusInput]    Whether to focus this entry's domain input field on creation.
     */
    constructor(tailoringEntry = null, focusInput = false) {
        // Save a reference to the settings this entry is based on, or create
        // a default settings object is none are provided.
        this.settings = tailoringEntry || {
            id: generateTailoringEntryID(),
            domains: [],
            treatment: addonData.defaultTreatment,
        };

        this.cacheData();
        this.defineActions();
        this.initializeTokenField();
        this.initializeColorPickers();
        this.bindEvents();

        // Initialize this entry's dynamically-colored icons.
        this.updateColoredIcons();

        // Add this entry's UI to the container element.
        this.container.appendChild(this.element);

        // Focus this entry's domain input if desired.
        if (focusInput) {
            this.tokenFieldInput.focus({ preventScroll: true });
            this.element.scrollIntoView({ behavior: "smooth" });
        }
    }

    /**
     * Caches immutable data for this entry.
     */
    cacheData() {
        // The HTML template to base this entry's UI on.
        this.elementTemplate = qs("template#tailoring-entry");

        // A copy of the template's contents to add to the DOM.
        this.element = qs(
            ".js-entry",
            document.importNode(this.elementTemplate.content, true)
        );

        // The container this entry will be inserted into.
        this.container = qs(".js-entry-container");

        // The input field for the domains this entry applies to.
        this.domainInput = qs(".js-entry-domain-input", this.element);

        // The drawer containing settings for this entry.
        this.settingsDrawer = qs(".js-entry-settings-drawer", this.element);

        // Elements related to this entry's color-picking modals.
        this.pickerElements = {
            backgroundModal: qs(".js-background-picker-modal", this.element),
            background: qs(".js-background-picker", this.element),
            borderModal: qs(".js-border-picker-modal", this.element),
            border: qs(".js-border-picker", this.element),
        };
    }

    /**
     * Stores references to this entry's action buttons.
     */
    defineActions() {
        this.actionButtons = {};

        // Assign each Node with a [data-click-action] attribute value to a
        // matching actionButton property.
        const actionButtons = qsa("[data-click-action]", this.element);

        actionButtons.forEach(actionButton => {
            const { clickAction } = actionButton.dataset;
            this.actionButtons[clickAction] = actionButton;
        });
    }

    /**
     * Initializes a token field to act as the input for this entry's domains.
     *
     * @see https://github.com/KaneCohen/tokenfield
     */
    initializeTokenField() {
        // Initialize a new TokenField on the domain input field.
        this.tokenField = new TokenField({
            el: this.domainInput,
            setItems: this.settings.domains.map(d => ({ id: d, name: d })),
            addItemOnBlur: true,
        });

        // Save a reference to the TokenField's actual text input element.
        this.tokenFieldInput = qs(".tokenfield-input", this.element);
    }

    /**
     * Initializes the color picker inputs for this entry's background and
     * border colors.
     */
    initializeColorPickers() {
        // Initialize this entry's background color picker.
        this.backgroundPicker = new ColorPicker({
            color: this.settings.treatment.backgroundColor,
            parent: this.pickerElements.background,
            popup: false,
        });

        this.backgroundPicker.onChange = newColor =>
            this.setTreatmentProperty("backgroundColor", newColor.hslaString);

        this.backgroundPicker.onDone = () => {
            this.backgroundColorModalIsVisible = false;
        };

        // Initialize this entry's border color picker.
        this.borderPicker = new ColorPicker({
            color: this.settings.treatment.borderColor,
            parent: this.pickerElements.border,
            popup: false,
        });

        this.borderPicker.onChange = newColor =>
            this.setTreatmentProperty("borderColor", newColor.hslaString);

        this.borderPicker.onDone = () => {
            this.borderColorModalIsVisible = false;
        };
    }

    /**
     * Attaches event handlers.
     */
    bindEvents() {
        // Save all entries when the domain tokens change. Note that this uses
        // the NodeJS Event API as implemented by the TokenField library.
        // @see https://nodejs.org/api/events.html#events_emitter_on_eventname_listener
        this.tokenField.on("change", () => {
            // Get the raw TokenField values as an array of strings and apply it
            // to this entry's settings object.
            const domainArray = this.tokenField.getItems().map(i => i.name);
            this.settings.domains = domainArray;

            saveTailoringEntries();
        });

        // Respond to keyboard events in the TokenField.
        this.tokenFieldInput.addEventListener("keydown", e => {
            // Disallow spaces within the TokenField's input.
            if (e.key === " ") e.preventDefault();
        });

        // Open and close this entry's settings drawer.
        this.actionButtons.toggleSettingsDrawer.addEventListener("click", () =>
            this.toggleSettingsDrawer()
        );

        // Scroll this entry's settings drawer into view when it opens.
        this.settingsDrawer.addEventListener("transitionend", () => {
            if (!this.settingsDrawerIsOpen) {
                return;
            }

            this.settingsDrawer.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });
        });

        // Show this entry's background color picker modal on click.
        this.actionButtons.showBackgroundColorModal.addEventListener(
            "click",
            () => {
                this.backgroundColorModalIsVisible = true;
            }
        );

        // Hide this entry's background color picker modal on click.
        this.actionButtons.hideBackgroundColorModal.addEventListener(
            "click",
            () => {
                this.backgroundColorModalIsVisible = false;
            }
        );

        // Show this entry's border color picker modal on click.
        this.actionButtons.showBorderColorModal.addEventListener(
            "click",
            () => {
                this.borderColorModalIsVisible = true;
            }
        );

        // Hide this entry's border color picker modal on click.
        this.actionButtons.hideBorderColorModal.addEventListener(
            "click",
            () => {
                this.borderColorModalIsVisible = false;
            }
        );

        // Delete this entry on click.
        this.actionButtons.deleteEntry.addEventListener("click", () =>
            this.delete()
        );
    }

    /**
     * The index of this entry among all current entries.
     */
    get index() {
        return addonData.runtime.tailoringEntryObjects.indexOf(this);
    }

    /**
     * The current state of this entry's settings drawer.
     */
    get settingsDrawerIsOpen() {
        return this.settingsDrawer.dataset.isOpen === "true";
    }

    set settingsDrawerIsOpen(newDrawerState) {
        this.settingsDrawer.dataset.isOpen = newDrawerState;
        this.actionButtons.toggleSettingsDrawer.dataset.actionActive = newDrawerState;
    }

    /**
     * The current state of this entry's border color modal.
     */
    set backgroundColorModalIsVisible(newModalState) {
        this.pickerElements.backgroundModal.dataset.isVisible = !!newModalState;
    }

    /**
     * The current state of this entry's background color modal.
     */
    set borderColorModalIsVisible(newModalState) {
        this.pickerElements.borderModal.dataset.isVisible = !!newModalState;
    }

    /**
     * Updates this entry's treatment, applying appropriate side effects based
     * on the updated property.
     *
     * @param {string} property - The treatment property to update.
     * @param {object} newValue - The updated value to apply.
     */
    setTreatmentProperty(property, newValue) {
        // Update this property's value.
        this.settings.treatment[property] = newValue;

        if (property === "borderColor") {
            this.updateColoredIcons(["borderColor"]);
        }

        if (property === "backgroundColor") {
            this.updateColoredIcons(["backgroundColor"]);
        }

        saveTailoringEntries();
    }

    /**
     * Synchronizes any dynamically-colored icons with the appropriate entry
     * setting.
     *
     * @param {array} iconsToUpdate - The colorized icons to update.
     */
    updateColoredIcons(iconsToUpdate = ["backgroundColor", "borderColor"]) {
        if (iconsToUpdate.includes("backgroundColor")) {
            this.actionButtons.showBackgroundColorModal.style.setProperty(
                "--color-icon-fill-background-picker",
                this.settings.treatment.backgroundColor
            );
        }

        if (iconsToUpdate.includes("borderColor")) {
            this.actionButtons.showBorderColorModal.style.setProperty(
                "--color-icon-fill-border-picker",
                this.settings.treatment.borderColor
            );
        }
    }

    /**
     * Toggles the open state of this entry's settings drawer.
     *
     * @param {boolean|null} shouldBeOpen - Whether to force the drawer to its open state.
     */
    toggleSettingsDrawer(shouldBeOpen = null) {
        // Set the drawer's new state, preferring the passed state but falling
        // back to the opposite of its current state.
        this.settingsDrawerIsOpen =
            shouldBeOpen !== null ? shouldBeOpen : !this.settingsDrawerIsOpen;

        // Update the title text of the drawer's action button.
        this.actionButtons.toggleSettingsDrawer.title = this
            .settingsDrawerIsOpen
            ? "Hide settings"
            : "Show settings";
    }

    /**
     * Removes this entry's UI from the popup interface, deletes its runtime
     * data, and saves the updated data to storage.
     */
    delete() {
        this.element.remove();

        addonData.runtime.tailoringEntries.splice(this.index, 1);
        addonData.runtime.tailoringEntryObjects.splice(this.index, 1);

        saveTailoringEntries();
    }
}

module.exports = TailoringEntry;
