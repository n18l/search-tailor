import browser from "webextension-polyfill";
import Sortable from "sortablejs";
import Tippy from "tippy.js";
import { defaultUserData } from "./addon/data";
import { qs, qsa, getRandomTidbit, logError } from "./addon/functions";
import TailoringEntry from "./classes/TailoringEntry";

/**
 * Namespace for popup-related properties & methods.
 */
const popup = {
    element: qs("main#popup-content"),

    /**
     * Initializes the background colour of the treatment colour hints to the
     * user's currently saved value. This value is set as a custom property on
     * the popup since it's shared among all entries.
     *
     * @param {Object} userData The user's current data.
     */
    initializeColorHintBackground(userData) {
        this.element.style.setProperty(
            "--popup-entry-treatment-base",
            userData.colorHintBackground
        );
    },

    /**
     * Initializes the tooltips for the popup's title bar actions.
     */
    initializeTitleBar() {
        // Get references to relevant title bar elements.
        const titleBar = qs(".js-title-bar");
        const titleLogo = qs(".js-title-logo", titleBar);
        const titleLogoVersion = qs(".js-logo-tooltip-version", titleLogo);
        const titleLogoTidbit = qs(".js-logo-tooltip-tidbit", titleLogo);
        const titleTooltipTargets = qsa("[data-tippy]", titleBar);
        const openOptionsPageButton = qs(
            '[data-click-action="openOptionsPage"]',
            titleBar
        );

        // Update on-load text content.
        const extensionVersion = browser.runtime.getManifest().version;
        titleLogoVersion.textContent = `v${extensionVersion}`;
        titleLogoTidbit.textContent = getRandomTidbit();

        // Set up all tooltips with HTML contents.
        Tippy(qsa("[data-tippy-html]"), {
            content: reference => qs("[data-tippy-contents]", reference),
            offset: [0, 5],
            placement: "bottom",
            onCreate: instance => {
                qs("[data-tippy-contents]", instance.popper).style.display =
                    "block";
            },
        });

        // Set up all other title bar tooltips.
        Tippy(titleTooltipTargets, {
            content: element => element.getAttribute("aria-label"),
            offset: [0, 5],
            placement: "bottom",
        });

        // Open the options page on click.
        openOptionsPageButton.addEventListener("click", () =>
            browser.runtime.openOptionsPage()
        );
    },

    /**
     * Initializes a Tailoring Entry UI for each existing entry setting object
     * in the user data, adding it to the popup.
     *
     * @param {Object} userData The user's current data.
     */
    initializeTailoringEntries(userData) {
        TailoringEntry.objects = userData.tailoringEntries.map(
            entrySettings => new TailoringEntry(entrySettings)
        );
    },

    /**
     * Attaches event handlers.
     */
    initializeActionBar() {
        // Get the action bar and individual action buttons.
        const actionBar = qs(".js-action-bar");
        const addEntryButton = qs('[data-click-action="addEntry"]', actionBar);

        // Add a new Tailoring Entry.
        addEntryButton.addEventListener("click", () => {
            TailoringEntry.objects.push(new TailoringEntry(null, true, true));
        });
    },

    /**
     * Whether one of the popup's entries is currently being dragged.
     */
    get draggingActive() {
        return !!this.element.dataset.draggingActive;
    },

    set draggingActive(newDraggingState) {
        if (newDraggingState) {
            this.element.dataset.draggingActive = true;
            return;
        }

        delete this.element.dataset.draggingActive;
    },

    /**
     * Enables drag & drop sorting of Tailoring Entries within this popup UI.
     */
    enableEntrySorting() {
        return new Sortable(document.querySelector(".js-entry-container"), {
            handle: ".js-sort-handle",
            animation: 150,
            forceFallback: true,
            onUpdate(event) {
                // Remove the entry from it's old position in the object array,
                // capturing a copy of it as we do so.
                const movedEntry = TailoringEntry.objects.splice(
                    event.oldIndex,
                    1
                )[0];

                // Add the entry back into the object array at its new position.
                TailoringEntry.objects.splice(event.newIndex, 0, movedEntry);

                TailoringEntry.save("entry-order");
            },
            // Indicate dragging state on the body element for styling purposes.
            onStart: () => {
                this.draggingActive = true;
            },
            onChoose: () => {
                this.draggingActive = true;
            },
            onEnd: () => {
                this.draggingActive = false;
            },
            onUnchoose: () => {
                this.draggingActive = false;
            },
        });
    },

    /**
     * Initializes the addon's popup UI.
     */
    initialize(userData) {
        this.initializeColorHintBackground(userData);
        this.initializeTitleBar();
        this.initializeTailoringEntries(userData);
        this.initializeActionBar();
        this.enableEntrySorting();
    },
};

// Get the current user data, then initialize the popup UI.
browser.storage.sync
    .get({
        tailoringEntries: defaultUserData.tailoringEntries,
        colorHintBackground: defaultUserData.colorHintBackground,
    })
    .then(userData => popup.initialize(userData))
    .catch(logError);
