import { defaultUserData } from "./addonData";
import { logError, isValidJson } from "./addonFunctions";

/* Class representing the extension options panel. */
class TailoredSearchOptionsPanel {
    /**
     * Initialize the options panel.
     * @param {object} optionsPanelElement - The HTML element representing options panel.
     */
    constructor(optionsPanelElement) {
        this.element = optionsPanelElement;
        this.defineInputs();
        this.defineActions();
        this.populateOptions();
        this.bindEvents();
    }

    /**
     * Identify and assign the option panel's inputs as local properties.
     */
    defineInputs() {
        this.inputs = {};
        const allInputs = this.element.querySelectorAll(".js-option-input");

        allInputs.forEach(input => {
            // Identify this input's name and group (if provided).
            const inputName = input.name;
            const { inputGroup } = input.dataset;

            if (inputGroup) {
                // If the input has a group, add it there, creating the group is necessary.
                this.inputs[inputGroup] = this.inputs[inputGroup] || [];
                this.inputs[inputGroup].push(input);
            } else {
                // Otherwise, simply add it under its own name.
                this.inputs[inputName] = input;
            }
        });
    }

    /**
     * Identify and assign the option panel's action buttons.
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
     * Populate the option fields with current extension data.
     */
    populateOptions() {
        browser.storage.sync.get(defaultUserData).then(storageData => {
            // Create a local, formatted copy of the current tailoring entry
            // settings.
            this.currentJSONExport = JSON.stringify(storageData, null, 4);

            // Populate the JSON Export field and resize it so it can be scrolled cleanly.
            this.inputs.jsonExport.value = this.currentJSONExport;
            this.inputs.jsonExport.style.height = `${
                this.inputs.jsonExport.scrollHeight
            }px`;

            // Create a local copy of the Search Engine settings.
            this.currentSearchEngines = storageData.searchEngines;

            // Set each Search Engine checkbox to match its "enabled" setting.
            this.inputs.enableSearchEngine.forEach((input, index) => {
                this.inputs.enableSearchEngine[
                    index
                ].checked = this.currentSearchEngines.find(
                    engine => engine.id === input.id
                ).enabled;
            });
        }, logError);
    }

    /**
     * Set the validation status of a given input to a custom message.
     */
    setInputValidation(inputName, message) {
        // Get the input and apply the message as a custom validity.
        const input = this.inputs[inputName];
        input.setCustomValidity(message);
        // Get the input's wrapper and update the validation attribute with the custom validity value.
        const inputWrapper = input.closest("[data-validation-message]");
        inputWrapper.dataset.validationMessage = input.validationMessage;
    }

    /**
     * Attach event handlers.
     */
    bindEvents() {
        // Update and sync the search engine settings when checking/unchecking a search engine.
        this.inputs.enableSearchEngine.forEach(input => {
            input.addEventListener("input", e => {
                this.currentSearchEngines.find(
                    engine => engine.id === e.target.id
                ).enabled = e.target.checked;

                browser.storage.sync
                    .set({ searchEngines: this.currentSearchEngines })
                    .then(null, logError);
            });
        });

        // Automatically adjust the JSON Export textarea's height.
        this.inputs.jsonExport.addEventListener("input", () => {
            this.inputs.jsonExport.style.height = `${
                this.inputs.jsonExport.scrollHeight
            }px`;
        });

        // Reset the validity of the JSON Import textarea.
        this.inputs.jsonImport.addEventListener("input", () => {
            this.setInputValidation("jsonImport", "");
        });

        // Copy the contents of the JSON Export textarea to the clipboard.
        this.actionButtons.copyJSON.addEventListener("click", () => {
            this.inputs.jsonExport.select();
            document.execCommand("copy");
            this.actionButtons.copyJSON.focus();
        });

        // Reset extension data to the default values.
        this.actionButtons.resetData.addEventListener("click", () => {
            browser.storage.sync
                .set(JSON.parse(JSON.stringify(defaultUserData)))
                .then(null, logError);
        });

        // Clear the contents of the JSON Import textarea.
        this.actionButtons.clearJSON.addEventListener("click", () => {
            this.inputs.jsonImport.value = "";
        });

        // Update the active tailoring entries with user-supplied data.
        this.actionButtons.importJSON.addEventListener("click", () => {
            // Reset any active validation messages.
            this.setInputValidation("jsonImport", "");

            // If user-supplied data is invalid, set a message and bail out.
            if (!isValidJson(this.inputs.jsonImport.value)) {
                this.setInputValidation(
                    "jsonImport",
                    "Invalid JSON! Please try again."
                );
                return;
            }

            // Otherwise, update the current extension data with the valid JSON.
            browser.storage.sync
                .set(JSON.parse(this.inputs.jsonImport.value))
                .then(null, logError);
        });
    }
}

const optionsPanelElement = document.querySelector(
    "#search-tailor-options-page"
);

const currentOptionsPanel = (function initOptionsPanel() {
    return new TailoredSearchOptionsPanel(optionsPanelElement);
})();

// Listen for storage updates, updating options on change
browser.storage.onChanged.addListener(() =>
    currentOptionsPanel.populateOptions()
);
