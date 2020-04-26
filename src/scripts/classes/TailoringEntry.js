import browser from "webextension-polyfill";
import TokenField from "tokenfield";
import Tippy from "tippy.js";
import ColorPicker from "vanilla-picker";
import throttle from "lodash.throttle";
import { logError, defaultTreatment } from "../addon/data";
import {
    qs,
    qsa,
    generateTailoringEntryID,
    getCustomPropertyValue,
    parseHSLAString,
    sendChangeNotification,
} from "../addon/functions";

/**
 * The interactive representation of a tailoring entry.
 */
class TailoringEntry {
    /**
     * Initializes this tailoring entry interface.
     *
     * @param {Object}  tailoringEntry The treatment settings object to use to initialize this entry's interface.
     * @param {boolean} focusInput     Whether to focus this entry's domain input after insertion.
     * @param {boolean} showSettings   Whether to insert this entry with its settings drawer open.
     */
    constructor(
        tailoringEntry = null,
        focusInput = false,
        showSettings = false
    ) {
        // Determine if this is a new entry based on whether or not a treatment
        // settings object was passed for initialization
        this.isNew = !tailoringEntry;

        // Save a reference to the settings this entry is based on, or create
        // a default settings object is none are provided.
        this.settings = tailoringEntry || {
            id: generateTailoringEntryID(),
            domains: [],
            treatment: Object.assign({}, defaultTreatment),
        };

        this.cacheData();
        this.defineActions();
        this.initializeOpacityInput();
        this.initializeColorInputs();
        this.initializeTooltips();
        this.bindEvents();
        this.updateColoredIcons();
        this.insert(focusInput, showSettings, this.isNew);
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

        // The toggle and input elements for this entry's opacity value.
        this.opacityToggle = qs(".js-entry-opacity-toggle", this.element);
        this.opacityRange = qs(".js-entry-opacity-input", this.element);

        // Elements related to this entry's color-picking modals.
        this.pickerElements = {
            template: qs("template#picker").innerHTML,
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
     * Initializes the input that controls the domains to which this entry's
     * treatment settings should apply.
     */
    initializeDomainInput() {
        // Initialize a new TokenField to use for the domain input field.
        // @see https://github.com/KaneCohen/tokenfield
        this.tokenField = new TokenField({
            el: this.domainInput,
            setItems: this.settings.domains.map(d => ({ id: d, name: d })),
            addItemOnBlur: true,
        });

        // Save all entries when the domain tokens change. Note that this uses
        // the NodeJS Event API as implemented by the TokenField library.
        // @see https://nodejs.org/api/events.html#events_emitter_on_eventname_listener
        this.tokenField.on("change", () => {
            // Get the raw TokenField values as an array of strings and apply it
            // to this entry's settings object.
            const domainArray = this.tokenField.getItems().map(i => i.name);
            this.settings.domains = domainArray;

            TailoringEntry.save("entry-domains");
        });

        // Save a reference to the TokenField's actual text input element.
        this.tokenFieldInput = qs(".tokenfield-input", this.element);

        // Respond to keyboard events in the TokenField.
        this.tokenFieldInput.addEventListener("keydown", e => {
            // Disallow spaces within the TokenField's input.
            if (e.key === " ") e.preventDefault();
        });
    }

    /**
     * Initializes the input that controls the opacity value of this entry's
     * treatment settings.
     */
    initializeOpacityInput() {
        // Initialize this entry's opacity slider to its set value.
        this.opacityRange.value = this.settings.treatment.opacity;

        // Create a special informational tooltip that displays this entry's
        // current opacity value.
        this.opacityRangeTooltip = new Tippy(this.opacityRange, {
            content: this.opacityTooltipValue,
            hideOnClick: false,
            offset: [0, 5],
            placement: "bottom",
        });
    }

    /**
     * Initializes the colorization toggle and background/border color picker
     * inputs for this entry.
     */
    initializeColorInputs() {
        // Get the current background and border alpha values.
        const currentBackgroundAlpha = parseHSLAString(
            this.settings.treatment.backgroundColor
        ).alpha;
        const currentBorderAlpha = parseHSLAString(
            this.settings.treatment.borderColor
        ).alpha;

        // If both alpha values are at zero, assume colorization is disabled.
        if (currentBackgroundAlpha === "0" && currentBorderAlpha === "0") {
            this.colorizationEnabled = false;
        }

        // Initialize this entry's background color picker.
        this.backgroundPicker = new ColorPicker({
            color: this.settings.treatment.backgroundColor,
            parent: this.pickerElements.background,
            popup: false,
            template: this.pickerElements.template,
        });

        this.backgroundPicker.onChange = throttle(
            newColor =>
                this.setTreatmentProperty(
                    "backgroundColor",
                    newColor.hslaString
                ),
            500
        );

        this.backgroundPicker.onDone = () => {
            this.backgroundColorModalIsVisible = false;
        };

        // Save a reference to the background picker's input element.
        this.pickerElements.backgroundInput = qs(
            ".picker_editor input",
            this.pickerElements.background
        );

        // Initialize this entry's border color picker.
        this.borderPicker = new ColorPicker({
            color: this.settings.treatment.borderColor,
            parent: this.pickerElements.border,
            popup: false,
            template: this.pickerElements.template,
        });

        this.borderPicker.onChange = throttle(
            newColor =>
                this.setTreatmentProperty("borderColor", newColor.hslaString),
            500
        );

        this.borderPicker.onDone = () => {
            this.borderColorModalIsVisible = false;
        };

        // Save a reference to the border picker's input element.
        this.pickerElements.borderInput = qs(
            ".picker_editor input",
            this.pickerElements.border
        );
    }

    /**
     * Initializes tooltips for this entry.
     */
    initializeTooltips() {
        this.tooltipTargets = qsa("[data-tippy]", this.element);

        Tippy(this.tooltipTargets, {
            content: reference => reference.getAttribute("aria-label"),
            offset: [0, 5],
            placement: "bottom",
        });
    }

    /**
     * Attaches event handlers.
     */
    bindEvents() {
        // Open and close this entry's settings drawer.
        this.actionButtons.toggleSettingsDrawer.addEventListener("click", () =>
            this.toggleSettingsDrawer()
        );

        // Scroll this entry's settings drawer into view when it opens.
        this.settingsDrawer.addEventListener("transitionend", e => {
            // Only respond to changes in height.
            if (e.propertyName !== "height") {
                return;
            }

            // Only proceed if the drawer was opened.
            if (!this.settingsDrawerIsOpen) {
                return;
            }

            // Calculate how far from the bottom of the entry container to
            // scroll to ensure that this settings drawer is not obscured by the
            // floating action bar when opened.
            const drawerBottom = this.settingsDrawer.getBoundingClientRect()
                .bottom;
            const distanceToContainerBottom =
                this.container.clientHeight - drawerBottom;
            const actionBarHeight = getCustomPropertyValue(
                "--action-bar-height",
                "px"
            );
            const actionBarPadding = getCustomPropertyValue(
                "--action-bar-padding",
                "px"
            );
            const actionBarOffset = actionBarHeight + actionBarPadding * 2;
            const scrollAmount = actionBarOffset - distanceToContainerBottom;

            if (scrollAmount <= 0) {
                return;
            }

            this.container.scrollBy({
                top: scrollAmount,
                behavior: "smooth",
            });
        });

        // Toggle the opacity setting for this entry's treatment between
        // minimum/maximum values on click.
        this.opacityToggle.addEventListener("click", () => {
            const newRangeValue = this.opacityRange.value === "0" ? "100" : "0";

            // Update the range input's value and programmatically trigger an
            // input event.
            this.opacityRange.value = newRangeValue;
            this.opacityRange.dispatchEvent(new Event("input"));
        });

        // Update the opacity setting for this entry's treatment on input.
        this.opacityRange.addEventListener(
            "input",
            throttle(e => {
                this.settings.treatment.opacity = +e.target.value;

                // Insert the current value into the input's tooltip.
                this.opacityRangeTooltip.setContent(this.opacityTooltipValue);

                // Update the toggle button to display an appropriate icon.
                this.opacityToggle.dataset.opacityOn = +e.target.value > 0;

                TailoringEntry.save("entry-opacity", [this.settings.id]);
            }, 500)
        );

        // Toggle this entry's colorization setting on click.
        this.actionButtons.toggleColorization.addEventListener("click", () => {
            this.colorizationEnabled = !this.colorizationEnabled;
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

        // When the hide/show animation begins for this entry's background color
        // picker modal, move focus in and out of it and adjust the z-index of
        // the entry container to prevent conflicts with the action bar.
        this.pickerElements.backgroundModal.addEventListener(
            "animationstart",
            e => {
                if (e.animationName === "fadeModalIn") {
                    this.pickerElements.backgroundInput.focus();
                    this.container.style.zIndex = 2;
                }

                if (e.animationName === "fadeModalOut") {
                    this.actionButtons.showBackgroundColorModal.focus();
                }
            }
        );

        // Readjust the z-index of this entry's container after its background
        // color picker modal is hidden.
        this.pickerElements.backgroundModal.addEventListener(
            "animationend",
            e => {
                if (e.animationName === "fadeModalOut") {
                    this.container.style.zIndex = 1;
                    delete e.target.dataset.animate;
                }
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

        // When the hide/show animation begins for this entry's border color
        // picker modal, move focus in and out of it and adjust the z-index of
        // the entry container to prevent conflicts with the action bar.
        this.pickerElements.borderModal.addEventListener(
            "animationstart",
            e => {
                if (e.animationName === "fadeModalIn") {
                    this.pickerElements.borderInput.focus();
                    this.container.style.zIndex = 2;
                }

                if (e.animationName === "fadeModalOut") {
                    this.actionButtons.showBorderColorModal.focus();
                }
            }
        );

        // Readjust the z-index of this entry's container after its border color
        // picker modal is hidden.
        this.pickerElements.borderModal.addEventListener("animationend", e => {
            if (e.animationName === "fadeModalOut") {
                this.container.style.zIndex = 1;
                delete e.target.dataset.animate;
            }
        });

        // Delete this entry on click.
        this.actionButtons.deleteEntry.addEventListener("click", () =>
            this.delete()
        );
    }

    /**
     * The index of this entry among all current entries.
     */
    get index() {
        return TailoringEntry.objects.indexOf(this);
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
     * The current state of this entry's colorization setting. Disabling
     * colorization simply sets the alpha transparency of the existing
     * border/background colors to 0. This "removes" the coloring but preserves
     * the HSL values so they can be reenabled later.
     */
    get colorizationEnabled() {
        return (
            this.actionButtons.toggleColorization.dataset
                .colorizationEnabled === "true"
        );
    }

    set colorizationEnabled(newState) {
        this.actionButtons.toggleColorization.dataset.colorizationEnabled = newState;

        // Disable the background/border color picker buttons.
        this.actionButtons.showBackgroundColorModal.disabled = !newState;
        this.actionButtons.showBorderColorModal.disabled = !newState;

        // Determine the new alpha value to apply to this entry's background and
        // border colors. Disabling colorization simply sets the alpha values of
        // the existing colors to 0, preserving their other values.
        const alpha = newState === true ? 1 : 0;

        if (this.backgroundPicker) {
            // Update the alpha value of this entry's background color to the
            // appropriate value.
            const currentBackgroundColor = this.settings.treatment
                .backgroundColor;
            const bkg = parseHSLAString(currentBackgroundColor);
            this.backgroundPicker.setColor(
                `hsla(${bkg.hue},${bkg.saturation},${bkg.lightness},${alpha})`
            );
        }

        if (this.borderPicker) {
            // Update the alpha value of this entry's border color to the
            // appropriate value.
            const currentBorderColor = this.settings.treatment.borderColor;
            const bdr = parseHSLAString(currentBorderColor);
            this.borderPicker.setColor(
                `hsla(${bdr.hue},${bdr.saturation},${bdr.lightness},${alpha})`
            );
        }
    }

    /**
     * The current state of this entry's border color modal.
     */
    set backgroundColorModalIsVisible(newModalState) {
        this.pickerElements.backgroundModal.dataset.animate = newModalState
            ? "in"
            : "out";
    }

    /**
     * The current state of this entry's background color modal.
     */
    set borderColorModalIsVisible(newModalState) {
        this.pickerElements.borderModal.dataset.animate = newModalState
            ? "in"
            : "out";
    }

    /**
     * The current value of this entry's opacity tooltip.
     */
    get opacityTooltipValue() {
        let tooltip = this.opacityRange.getAttribute("aria-label");
        const roundedOpacityValue = Math.round(this.opacityRange.value * 100);

        if (roundedOpacityValue === 0) {
            tooltip += ` (results hidden)`;
        } else {
            tooltip += ` (${roundedOpacityValue}%)`;
        }

        return tooltip;
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

        TailoringEntry.save(`entry-${property}`, [this.settings.id]);
    }

    /**
     * Synchronizes any dynamically-colored icons with the appropriate entry
     * setting.
     *
     * @param {array} iconsToUpdate - The colorized icons to update.
     */
    updateColoredIcons(iconsToUpdate = ["backgroundColor", "borderColor"]) {
        if (iconsToUpdate.includes("backgroundColor")) {
            this.element.style.setProperty(
                "--color-treatment-background",
                this.settings.treatment.backgroundColor
            );
        }

        if (iconsToUpdate.includes("borderColor")) {
            this.element.style.setProperty(
                "--color-treatment-border",
                this.settings.treatment.borderColor
            );
        }
    }

    /**
     * Inserts this entry into the popup interface.
     *
     * @param {boolean} focusInput Whether to focus this entry's domain input after insertion.
     * @param {boolean} showSettings Whether to insert this entry with its settings drawer open.
     * @param {boolean} animateIn Whether to animate the insertion of this entry.
     */
    insert(focusInput = false, showSettings = false, animateIn = false) {
        // Open this entry's settings drawer if desired.
        if (showSettings) {
            this.toggleSettingsDrawer(true);
        }

        // Animate the entry's insertion if desired.
        if (animateIn) {
            // Listen for the end of the insertion animation to remove the
            // animation attribute.
            this.element.addEventListener("animationend", e => {
                // Only proceed if this was the insertion animation.
                if (e.animationName !== "insertEntry") {
                    return;
                }

                delete this.element.dataset.isBeingInserted;
            });

            // Apply a data attribute to trigger the insertion animation.
            this.element.dataset.isBeingInserted = true;
        }

        // Add this entry's UI to the container element.
        this.container.appendChild(this.element);

        // Initialize the domain input and bind its events after insertion to
        // avoid issues with its automatic resizing in Chrome.
        this.initializeDomainInput();

        // Focus this entry's domain input if desired.
        if (focusInput) {
            this.tokenFieldInput.focus({ preventScroll: true });
            this.element.scrollIntoView({ behavior: "smooth" });
        }
    }

    /**
     * Toggles the open state of this entry's settings drawer.
     *
     * @param {boolean|null} shouldBeOpen - Whether to force the drawer to its open state.
     */
    toggleSettingsDrawer(shouldBeOpen = null) {
        // Determine the drawer's new state, preferring the passed state but
        // falling back to the opposite of its current state.
        const newOpenSetting =
            shouldBeOpen !== null ? shouldBeOpen : !this.settingsDrawerIsOpen;

        // If opening the drawer, close all others first.
        if (newOpenSetting === true) {
            TailoringEntry.closeAllSettingsDrawers();
        }

        this.settingsDrawerIsOpen = newOpenSetting;
    }

    /**
     * Removes this entry's UI and data.
     */
    delete() {
        // Listen for the end of the deletion animation before actually removing
        // the element from the DOM.
        this.element.addEventListener("animationend", e => {
            // Only proceed if this was the deletion animation.
            if (e.animationName !== "deleteEntry") {
                return;
            }

            this.element.remove();
        });

        // Get and apply this entry's height in-line for animation purposes.
        const entryHeight = this.element.getBoundingClientRect().height;
        this.element.style.setProperty(
            "--popup-entry-height",
            `${entryHeight}px`
        );

        // Apply a data attribute to trigger the deletion animation.
        this.element.dataset.isBeingDeleted = true;

        // Delete this entry's data and save the update to storage.
        TailoringEntry.objects.splice(this.index, 1);
        TailoringEntry.save("entry-deletion");
    }

    /**
     * Retrieves an array of settings objects for all the current Tailoring
     * Entry objects that make up the popup UI.
     */
    static get rawValues() {
        return TailoringEntry.objects.map(o => o.settings);
    }

    /**
     * Saves the raw values of all current tailoring entries in the popup UI
     * back to the extension's storage.
     *
     * @param {String}   changeType A simple description of the type of change.
     * @param {String[]} updatedIDs The IDs of specific tailoring entries to apply updates for, defaulting to all.
     */
    static save(changeType, updatedIDs = null) {
        browser.storage.sync
            .set({ tailoringEntries: TailoringEntry.rawValues })
            .then(() => sendChangeNotification(changeType, updatedIDs))
            .catch(logError);
    }

    /**
     * Closes all settings drawers.
     */
    static closeAllSettingsDrawers() {
        TailoringEntry.objects.forEach(entryObject => {
            const thisEntry = entryObject;

            thisEntry.settingsDrawerIsOpen = false;
        });
    }
}

/**
 * Represents a static list of all current Tailoring Entry objects.
 */
TailoringEntry.objects = [];

module.exports = TailoringEntry;
