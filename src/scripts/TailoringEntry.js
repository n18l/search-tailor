const TokenField = require("tokenfield");
const addonData = require("./addonData");
const addonFunctions = require("./addonFunctions");

function qs(selector, context = document) {
    return context.querySelector(selector);
}

function qsa(selector, context = document) {
    return context.querySelectorAll(selector);
}

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
    constructor(
        tailoringEntry = {
            id: null,
            domains: [],
            treatment: null,
        },
        focusInput = false
    ) {
        // Save a reference to the settings this entry is based on.
        this.settings = tailoringEntry;

        this.cacheData();
        this.defineActions();
        this.enableTokenField();
        this.bindEvents();

        // Add this entry's current domains to the domain input field.
        if (this.settings.domains.length > 0) {
            this.domainInput.value = this.settings.domains.join("|");
        }

        // Add this entry's UI to the container element.
        qs(".js-entry-container").appendChild(this.element);

        // Focus this entry's domain input if desired.
        if (focusInput) {
            this.domainInput.focus();
        }
    }

    /**
     * Caches immutable data for this entry.
     */
    cacheData() {
        this.elementTemplate = qs("template#tailoring-entry");

        this.element = qs(
            ".js-entry",
            document.importNode(this.elementTemplate.content, true)
        );

        this.domainInput = qs(".js-entry-domain-input", this.element);
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
     *
     */
    enableTokenField() {
        this.tokenField = new TokenField({
            el: this.domainInput,
            setItems: this.settings.domains.map(d => ({ id: d, name: d })),
        });

        this.tokenField.on("change", () => {
            const domainArray = this.tokenField.getItems().map(i => i.name);

            this.settings.domains = domainArray;

            addonFunctions.saveTailoringEntries();
        });
    }

    /**
     * Attaches event handlers.
     */
    bindEvents() {
        // Save all entries when the domain input changes to a valid value, or
        // disable dragging when it changes to an invalid one.
        // this.domainInput.addEventListener("change", e => {
        //     if (e.target.validity.valid) {
        //         addonFunctions.saveTailoringEntries();
        //     } else {
        //         this.element.dataset.dragDisabled = true;
        //     }
        // });

        // Check the validity of the domain input on change, issuing an
        // 'invalid' event when not passing constraints.
        // this.domainInput.addEventListener('input', e => {
        //     e.target.checkValidity();
        // });

        // Disallow spaces within the domain input.
        this.domainInput.addEventListener("keypress", e => {
            if (e.key === " ") e.preventDefault();
        });

        this.actionButtons.deleteEntry.addEventListener("click", () =>
            this.delete()
        );
    }

    /**
     * Retrieves the index of this entry among all current entries.
     */
    get index() {
        return addonData.runtime.tailoringEntries.indexOf(this);
    }

    /**
     * Removes this entry from the popup UI and deletes its settings object from
     * storage.
     */
    delete() {
        addonData.runtime.tailoringEntries.splice(this.index, 1);

        this.element.remove();

        addonFunctions.saveTailoringEntries();
    }
}

module.exports = TailoringEntry;
