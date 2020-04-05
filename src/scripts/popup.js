import Sortable from "sortablejs";
import addonData from "./addonData";
import { getUserData, saveTailoringEntries } from "./addonFunctions";
import TailoringEntry from "./TailoringEntry";

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
     * Initializes a Tailoring Entry UI for each existing entry setting object
     * in the user data, adding it to the popup.
     */
    initializeTailoringEntries() {
        addonData.runtime.tailoringEntryObjects = addonData.runtime.tailoringEntries.map(
            entrySettings => new TailoringEntry(entrySettings)
        );
    },

    /**
     * Attaches event handlers.
     */
    bindEvents() {
        // Get the action bar and individual action buttons.
        const actionBar = document.querySelector(".js-action-bar");
        const addEntryButton = actionBar.querySelector(
            '[data-click-action="addEntry"]'
        );

        // Add a new Tailoring Entry.
        addEntryButton.addEventListener("click", () => {
            addonData.runtime.tailoringEntryObjects.push(
                new TailoringEntry(null, true)
            );
        });
    },

    /**
     * Enables drag & drop sorting of Tailoring Entries within this popup UI.
     */
    enableEntrySorting() {
        return new Sortable(document.querySelector(".js-entry-container"), {
            handle: ".js-sort-handle",
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

                saveTailoringEntries();
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
        this.bindEvents();

        document.querySelector("body").dataset.isLoading = false;
    },
};

// Get the current user data, then initialize the popup UI.
getUserData().then(() => popup.initialize());
