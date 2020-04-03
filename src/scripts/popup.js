const addonData = require("./addonData");
const addonFunctions = require("./addonFunctions");
const TailoringGroup = require("./TailoringGroup");
const TailoringEntryV1 = require("./TailoringEntryV1");

/**
 * Namespace for popup-related properties & methods.
 */
const popup = {
    /**
     * Creates a Tailoring Group for each existing treatment in the user data,
     * adding it to the current working list of all Tailoring Groups.
     */
    initializeGroups() {
        addonData.local.tailoringTreatments.forEach(tailoringTreatment => {
            addonData.local.tailoringGroups.push(
                new TailoringGroup(tailoringTreatment)
            );
        });
    },

    /**
     * Creates a Tailoring Entry for each existing entry in the user data,
     * adding it to the entry list of the Tailoring Group to which it belongs.
     */
    initializeEntries() {
        addonData.local.tailoringEntries.forEach(tailoringEntry => {
            addonFunctions
                .getTailoringGroupByTreatmentID(tailoringEntry.treatment)
                .entries.push(new TailoringEntryV1(tailoringEntry));
        });
    },

    /**
     * Attaches event handlers.
     */
    bindEvents() {
        // Get the action bar and individual action buttons.
        const actionBar = document.querySelector(".js-action-bar");
        const addTreatmentButton = actionBar.querySelector(
            '[data-click-action="addTreatment"]'
        );

        // Add new entry groups.
        addTreatmentButton.addEventListener("click", () => {
            addonData.local.tailoringGroups.push(new TailoringGroup());
        });
    },

    /**
     * Initializes the addon's popup UI.
     */
    initialize() {
        // this.initializeGroups();
        // this.initializeEntries();
        // this.bindEvents();
    },
};

// Get the current user data, then initialize the popup UI.
addonFunctions.getUserData().then(() => popup.initialize());
