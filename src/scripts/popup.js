const Sortable = require("sortablejs");
const addonData = require("./addonData");
const addonFunctions = require("./addonFunctions");
const TailoringGroup = require("./TailoringGroup");
const TailoringEntryV1 = require("./TailoringEntryV1");
const TailoringEntry = require("./TailoringEntry");

/**
 * Namespace for popup-related properties & methods.
 */
const popup = {
    /**
     * Creates a Tailoring Group for each existing treatment in the user data,
     * adding it to the current working list of all Tailoring Groups.
     */
    // initializeGroups() {
    //     addonData.local.tailoringTreatments.forEach(tailoringTreatment => {
    //         addonData.local.tailoringGroups.push(
    //             new TailoringGroup(tailoringTreatment)
    //         );
    //     });
    // },

    /**
     * Creates a Tailoring Entry for each existing entry in the user data,
     * adding it to the entry list of the Tailoring Group to which it belongs.
     */
    // initializeEntries() {
    //     addonData.local.tailoringEntries.forEach(tailoringEntry => {
    //         addonFunctions
    //             .getTailoringGroupByTreatmentID(tailoringEntry.treatment)
    //             .entries.push(new TailoringEntryV1(tailoringEntry));
    //     });
    // },

    /**
     * Creates a Tailoring Entry for each existing entry in the user data,
     * adding it to the entry list of the Tailoring Group to which it belongs.
     */
    initializeTailoringEntries() {
        addonData.runtime.tailoringEntryObjects = addonData.runtime.tailoringEntries.map(
            entrySettings => new TailoringEntry(entrySettings)
        );
    },

    /**
     * Attaches event handlers.
     */
    // bindEvents() {
    //     // Get the action bar and individual action buttons.
    //     const actionBar = document.querySelector(".js-action-bar");
    //     const addTreatmentButton = actionBar.querySelector(
    //         '[data-click-action="addTreatment"]'
    //     );

    //     // Add new entry groups.
    //     addTreatmentButton.addEventListener("click", () => {
    //         addonData.local.tailoringGroups.push(new TailoringGroup());
    //     });
    // },

    /**
     * Enables drag & drop sorting of Tailoring Entries within this popup UI.
     */
    enableEntrySorting() {
        return new Sortable(document.querySelector(".js-entry-container"), {
            handle: ".js-sort-handle",
            filter: "[data-drag-disabled='true']",
            animation: 150,
            onUpdate(event) {
                // Remove the entry from it's old position in the object array,
                // capturing a copy of it as we do so.
                const movedEntry = addonData.runtime.tailoringEntryObjects.splice(
                    event.oldIndex,
                    1
                )[0];

                // Add the entry back into the object array at its new position.
                addonData.runtime.tailoringEntryObjects.splice(
                    event.newIndex,
                    0,
                    movedEntry
                );

                addonFunctions.saveTailoringEntries();
            },
        });
    },

    /**
     * Initializes the addon's popup UI.
     */
    initialize() {
        // this.initializeGroups();
        // this.initializeEntries();
        this.initializeTailoringEntries();
        this.enableEntrySorting();
        // this.bindEvents();
    },
};

// Get the current user data, then initialize the popup UI.
addonFunctions.getUserData().then(() => popup.initialize());
