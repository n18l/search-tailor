const Sortable = require("sortablejs");
const addonData = require("./addonData");
const addonFunctions = require("./addonFunctions");

function isValidJson(json) {
    try {
        JSON.parse(json);
        return true;
    } catch (e) {
        return false;
    }
}

function generateID(maxRandomInt = 100000) {
    const currentTimestamp = Date.now();
    const randomInt = Math.floor(Math.random() * Math.floor(maxRandomInt));

    return `${currentTimestamp}-${randomInt}`;
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
        browser.storage.sync
            .get(addonData.defaultUserData)
            .then(storageData => {
                // Create a local, formatted copy of the current Tailored Domain settings.
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
                    ].checked = this.currentSearchEngines[input.name].enabled;
                });
            }, addonFunctions.logError);
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
                this.currentSearchEngines[e.target.name].enabled =
                    e.target.checked;

                browser.storage.sync
                    .set({ searchEngines: this.currentSearchEngines })
                    .then(null, addonFunctions.logError);
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
                .set(JSON.parse(this.inputs.jsonImport.value))
                .then(null, addonFunctions.logError);
        });
    }
}

const tailoringTemplateTemplate = document.querySelector(
    "template#tailoring-template"
);

/* Class representing an entry in the list of tailored domains. */
class TailoringTemplate {
    /**
     * Initialize the list entry.
     * @param {object} parentTailoringTemplateList - The list object to add this entry to.
     * @param {string} [tailoringTemplateSettings] - An object containing the settings to use for this entry.
     */
    constructor(
        parentTailoringTemplateList,
        tailoringTemplateSettings = {
            id: generateID(),
            label: "",
            backgroundColor:
                addonData.defaultUserData.tailoringTemplates[0].backgroundColor,
            backgroundOpacity:
                addonData.defaultUserData.tailoringTemplates[0]
                    .backgroundOpacity,
            borderColor:
                addonData.defaultUserData.tailoringTemplates[0].borderColor,
            borderOpacity:
                addonData.defaultUserData.tailoringTemplates[0].borderOpacity,
        }
    ) {
        this.parentList = parentTailoringTemplateList;
        this.element = document
            .importNode(tailoringTemplateTemplate.content, true)
            .querySelector(".js-tailoring-template");
        this.idInput = this.element.querySelector(".js-template-id-input");
        this.labelInput = this.element.querySelector(
            ".js-template-label-input"
        );
        this.backgroundColorInput = this.element.querySelector(
            ".js-template-background-color-input"
        );
        this.backgroundOpacityInput = this.element.querySelector(
            ".js-template-background-opacity-input"
        );
        this.borderColorInput = this.element.querySelector(
            ".js-template-border-color-input"
        );
        this.borderOpacityInput = this.element.querySelector(
            ".js-template-border-opacity-input"
        );

        this.defineActions();
        this.bindEvents();

        if (tailoringTemplateSettings.id) {
            this.idInput.value = tailoringTemplateSettings.id;
        }

        if (tailoringTemplateSettings.label) {
            this.labelInput.value = tailoringTemplateSettings.label;
        }

        if (tailoringTemplateSettings.backgroundColor) {
            this.backgroundColorInput.value =
                tailoringTemplateSettings.backgroundColor;
        }

        if (tailoringTemplateSettings.backgroundOpacity) {
            this.backgroundOpacityInput.value =
                tailoringTemplateSettings.backgroundOpacity;
            this.backgroundColorInput.style.opacity =
                tailoringTemplateSettings.backgroundOpacity;
        }

        if (tailoringTemplateSettings.borderColor) {
            this.borderColorInput.value = tailoringTemplateSettings.borderColor;
        }

        if (tailoringTemplateSettings.borderOpacity) {
            this.borderOpacityInput.value =
                tailoringTemplateSettings.borderOpacity;
            this.borderColorInput.style.opacity =
                tailoringTemplateSettings.borderOpacity;
        }

        const newBackgroundColor = addonFunctions.hexToHSL(
            tailoringTemplateSettings.backgroundColor,
            true,
            tailoringTemplateSettings.backgroundOpacity
        );
        this.element.style.backgroundColor = newBackgroundColor;

        const newBorderColor = addonFunctions.hexToHSL(
            tailoringTemplateSettings.borderColor,
            true,
            tailoringTemplateSettings.borderOpacity
        );
        this.element.style.borderColor = newBorderColor;

        this.parentList.element.appendChild(this.element);
        this.labelInput.focus();
    }

    /**
     * Get the value of the entry as an object.
     */
    get value() {
        return {
            id: this.idInput.value,
            label: this.labelInput.value,
            backgroundColor: this.backgroundColorInput.value,
            backgroundOpacity: this.backgroundOpacityInput.value,
            borderColor: this.borderColorInput.value,
            borderOpacity: this.borderOpacityInput.value,
        };
    }

    /**
     * Identify and assign the entry's action buttons.
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
        this.labelInput.addEventListener("change", () =>
            this.parentList.syncToStorage()
        );

        this.labelInput.addEventListener("input", () =>
            this.parentList.validateEntries(
                () => this.parentList.enableNewEntries(),
                () => this.parentList.disableNewEntries()
            )
        );

        this.actionButtons.setBackgroundColor.addEventListener("click", () =>
            this.backgroundColorInput.click()
        );

        this.actionButtons.setBorderColor.addEventListener("click", () =>
            this.borderColorInput.click()
        );

        this.backgroundColorInput.addEventListener("input", e => {
            const newBackgroundColor = addonFunctions.hexToHSL(
                e.target.value,
                true,
                this.backgroundOpacityInput.value
            );
            this.element.style.backgroundColor = newBackgroundColor;
        });

        this.backgroundColorInput.addEventListener("change", () =>
            this.parentList.syncToStorage()
        );

        this.backgroundOpacityInput.addEventListener("change", () =>
            this.parentList.syncToStorage()
        );

        this.backgroundOpacityInput.addEventListener("input", e => {
            const newBackgroundColor = addonFunctions.hexToHSL(
                this.backgroundColorInput.value,
                true,
                e.target.value
            );
            this.element.style.backgroundColor = newBackgroundColor;
        });

        this.borderColorInput.addEventListener("change", () =>
            this.parentList.syncToStorage()
        );

        this.borderColorInput.addEventListener("input", e => {
            const newBorderColor = addonFunctions.hexToHSL(
                e.target.value,
                true,
                this.borderOpacityInput.value
            );
            this.element.style.borderColor = newBorderColor;
        });

        this.borderOpacityInput.addEventListener("change", () =>
            this.parentList.syncToStorage()
        );

        this.borderOpacityInput.addEventListener("input", e => {
            const newBorderColor = addonFunctions.hexToHSL(
                this.borderColorInput.value,
                true,
                e.target.value
            );
            this.element.style.borderColor = newBorderColor;
        });

        this.actionButtons.deleteTemplate.addEventListener("click", () =>
            this.delete()
        );
    }

    /**
     * Reset the entry to its default state.
     */
    reset() {
        const defaultTailoringTemplate =
            addonData.defaultUserData.tailoringTemplates[0];

        this.idInput.value = defaultTailoringTemplate.id;
        this.labelInput.value = defaultTailoringTemplate.label;
        this.backgroundColorInput.value =
            defaultTailoringTemplate.backgroundColor;
        this.backgroundOpacityInput.value =
            defaultTailoringTemplate.backgroundOpacity;
        this.borderColorInput.value = defaultTailoringTemplate.borderColor;
        this.borderOpacityInput.value = defaultTailoringTemplate.borderOpacity;
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
        const validityRequirements = [
            this.idInput.value !== "",
            this.labelInput.value !== "",
            this.backgroundColorInput.value !== "",
            this.borderColorInput.value !== "",
        ];

        return !validityRequirements.includes(false);
    }
}

/** Class representing the interactive list of tailored domains. */
class TailoringTemplateList {
    /**
     * Initialize the list UI.
     * @param {object} entryListElement - The HTML element representing the list.
     */
    constructor(entryListElement) {
        this.entries = [];
        this.element = entryListElement;
        this.previewColorInput = document.querySelector(
            ".js-template-preview-color-input"
        );
        this.setPreviewColorButton = document.querySelector(
            '[data-click-action="setPreviewColor"]'
        );
        this.addTemplateButton = document.querySelector(
            '[data-click-action="addTemplate"]'
        );

        this.bindEvents();

        browser.storage.sync
            .get({
                tailoringTemplates:
                    addonData.defaultUserData.tailoringTemplates,
                tailoringTemplatePreviewColor:
                    addonData.defaultUserData.tailoringTemplatePreviewColor,
            })
            .then(storageData => {
                this.populate(storageData.tailoringTemplates);
                this.previewColorInput.value =
                    storageData.tailoringTemplatePreviewColor;
                this.element.style.backgroundColor =
                    storageData.tailoringTemplatePreviewColor;
            }, addonFunctions.logError);
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

            if (
                clickTarget &&
                clickTarget.dataset.clickAction === "addTemplate"
            ) {
                this.disableNewEntries();
                this.entries.push(new TailoringTemplate(this));
            }

            if (
                clickTarget &&
                clickTarget.dataset.clickAction === "setPreviewColor"
            ) {
                this.previewColorInput.click();
            }
        });

        this.previewColorInput.addEventListener("input", e => {
            this.element.style.backgroundColor = e.target.value;
        });

        this.previewColorInput.addEventListener("change", () =>
            this.syncToStorage()
        );
    }

    /**
     * Populate the list with existing extension data or an empty entry.
     * @param {object} storageData - Existing extension data passed by the browser.storage API.
     */
    populate(tailoringTemplates) {
        if (!tailoringTemplates || tailoringTemplates.length === 0) {
            this.disableNewEntries();
            this.entries.push(new TailoringTemplate(this));
        }

        tailoringTemplates.forEach(tailoringTemplateSettings =>
            this.entries.push(
                new TailoringTemplate(this, tailoringTemplateSettings)
            )
        );
    }

    /**
     * Prevent the addition of new entries by users.
     */
    disableNewEntries() {
        this.addTemplateButton.setAttribute("disabled", "");
    }

    /**
     * Allow the addition of new entries by users.
     */
    enableNewEntries() {
        this.addTemplateButton.removeAttribute("disabled");
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
        const validTailoringTemplates = this.entryValues.filter(
            entryValueSet => entryValueSet.domain !== ""
        );

        browser.storage.sync
            .set({
                tailoringTemplates: validTailoringTemplates,
                tailoringTemplatePreviewColor: this.previewColorInput.value,
            })
            .then(null, addonFunctions.logError);
    }
}

const optionsPanelElement = document.querySelector(
    "#search-tailor-options-panel"
);
const tailoringTemplateListElement = document.querySelector(
    ".tailoring-template-list"
);

const currentOptionsPanel = (function initOptionsPanel() {
    return new TailoredSearchOptionsPanel(optionsPanelElement);
})();

const currentTailoringTemplateList = (function initTailoringTemplatesList() {
    return new TailoringTemplateList(tailoringTemplateListElement);
})();

(function enableTailoringTemplatesListSorting() {
    return new Sortable(tailoringTemplateListElement, {
        handle: ".js-sort-handle",
        animation: 150,
        forceFallback: true,
        onUpdate(event) {
            currentTailoringTemplateList.reorderEntry(
                event.oldIndex,
                event.newIndex
            );
        },
    });
})();

// Listen for storage updates, updating options on change
browser.storage.onChanged.addListener(() =>
    currentOptionsPanel.populateOptions()
);
