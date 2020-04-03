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
     * Initializes a token field to act as the input for this entry's domains.
     *
     * @see https://github.com/KaneCohen/tokenfield
     */
    enableTokenField() {
        // Initialize a new TokenField on the domain input field.
        this.tokenField = new TokenField({
            el: this.domainInput,
            setItems: this.settings.domains.map(d => ({ id: d, name: d })),
        });

        // Save a reference to the TokenField's actual text input element.
        this.tokenFieldInput = qs(".tokenfield-input", this.element);
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

            addonFunctions.saveTailoringEntries();
        });

        // Disallow spaces within the TokenField's input.
        this.tokenFieldInput.addEventListener("keypress", e => {
            if (e.key === " ") e.preventDefault();
        });

        // Delete entries on click.
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
        addonData.runtime.tailoringEntryObjects.splice(this.index, 1);

        this.element.remove();

        addonFunctions.saveTailoringEntries();
    }
}

module.exports = TailoringEntry;
