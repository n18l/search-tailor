function logError(error) {
    console.error(error);
}

function isValidJson(json) {
    try {
        JSON.parse(json);
        return true;
    } catch (e) {
        return false;
    }
}

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
     * Identify and assign the option panel's inputs.
     */
    defineInputs() {
        this.inputs = {};
        const inputs = this.element.querySelectorAll(".js-option-input");

        inputs.forEach(input => {
            this.inputs[input.name || input.getAttribute("name")] = input;
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
        browser.storage.sync.get("tailoredDomains").then(storageData => {
            // Output the current Tailored Domains to the JSON Export field.
            this.currentJSONExport = JSON.stringify(
                storageData.tailoredDomains,
                null,
                4
            );
            this.inputs.jsonExport.value = this.currentJSONExport;
            this.inputs.jsonExport.style.height = `${
                this.inputs.jsonExport.scrollHeight
            }px`;
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

        // Clear the contents of the JSON Import textarea.
        this.actionButtons.clearJSON.addEventListener("click", () => {
            this.inputs.jsonImport.value = "";
        });

        // Update the active Tailored Domains with user-supplied data.
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
                .set({ tailoredDomains: JSON.parse(currentImportContent) })
                .then(null, logError);
        });
    }
}

const currentOptionsPanel = (function initOptionsPanel() {
    return new TailoredSearchOptionsPanel(
        document.querySelector("#search-tailor-options-panel")
    );
})();

// Listen for storage updates, updating options on change
browser.storage.onChanged.addListener(() =>
    currentOptionsPanel.populateOptions()
);
