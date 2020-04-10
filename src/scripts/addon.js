import addonData from "./addonData";
import { qs, qsa, getUserData } from "./addonFunctions";

/* Class representing a user's search that is eligible for tailoring. */
class TailoredSearch {
    constructor() {
        // Identify which of the predefined search engines was used for this
        // search, if any.
        this.searchEngine = addonData.searchEngines.find(searchEngine =>
            RegExp(searchEngine.matchPattern).test(window.location)
        );

        // Only proceed if this is a supported search engine.
        if (!this.searchEngine) {
            return;
        }

        // Only proceed if the user has this search engine enabled.
        const searchEngineIsEnabled = addonData.runtime.searchEngines.find(
            searchEngine => searchEngine.id === this.searchEngine.id
        ).enabled;

        if (!searchEngineIsEnabled) {
            return;
        }

        this.cacheData();

        // If this search engine loads results asynchronously, apply tailoring
        // when its results change. Otherwise, simply tailor on load.
        if (this.searchEngine.observe) {
            this.tailorOnMutation();
        } else {
            this.tailor();
        }

        // Reapply tailoring when sent a targeted change message. The message
        // denotes which entry IDs to apply changes for, allowing patch updates.
        browser.runtime.onMessage.addListener(message => {
            // Only proceed if this is a change message.
            if (!message.type.startsWith("change")) {
                return;
            }

            // Refresh the current user data and re-tailor the appropriate
            // search results.
            getUserData().then(() => {
                this.tailor(message.updatedEntryIDs);
            });
        });
    }

    /**
     * Caches immutable data for this tailored search.
     */
    cacheData() {
        // The element containing the list of search results.
        this.searchResultsContainer = qs(
            this.searchEngine.selectors.resultContainer
        );

        // The selector used to identify treatment panels.
        this.treatmentPanelSelector =
            ".treatment-panel, [data-treatment-panel]";
    }

    /**
     * Customizes all search results on the current page that match one of the
     * provided tailoring entries.
     *
     * @param {string[]} tailoringEntryIDs The IDs of the tailoring entries to apply tailoring for, defaulting to all.
     */
    tailor(tailoringEntryIDs = null) {
        this.applyEntryIdAttributes(tailoringEntryIDs);
        this.insertTreatmentPanels();
        this.updateTreatments(tailoringEntryIDs);
    }

    /**
     * The current search results.
     */
    get searchResults() {
        return Array.from(
            qsa(this.searchEngine.selectors.result, this.searchResultsContainer)
        );
    }

    /**
     * The currently tailored search results.
     */
    get tailoredSearchResults() {
        return Array.from(
            qsa("[data-tailoring-entry-id]", this.searchResultsContainer)
        );
    }

    /**
     * Observes mutations to this search's results container, tailoring the
     * results whenever they change.
     */
    tailorOnMutation() {
        // Disconnect any existing observers.
        if (this.searchObserver) this.searchObserver.disconnect();

        // Create a new observer to tailor currently-matching entries on
        // mutation.
        this.searchObserver = new MutationObserver(() => this.tailor());

        // Have the observer watch for changes to the current page's search
        // results.
        this.searchObserver.observe(this.searchResultsContainer, {
            childList: true,
        });
    }

    /**
     * Applies a data attribute to each search result matching the tailoring
     * entry that applies to it, if any.
     *
     * @param {string[]} tailoringEntryIDs The IDs of the tailoring entries to apply attributes for, defaulting to all.
     */
    applyEntryIdAttributes(tailoringEntryIDs = null) {
        // Apply IDs for all entries by default.
        let entriesToApply = addonData.runtime.tailoringEntries;

        // Apply IDs only to a specific entry if an ID is provided.
        if (tailoringEntryIDs) {
            entriesToApply = entriesToApply.filter(tailoringEntry =>
                tailoringEntryIDs.includes(tailoringEntry.id)
            );
        }

        // Get the search results matching each existing entry, and apply that
        // entry's ID to the result as a data attribute.
        entriesToApply.forEach(tailoringEntry => {
            // Combine all of this entry's listed domains into a single,
            // RegEx compatible string.
            const entryDomains = tailoringEntry.domains.join("|");

            // Create an array of all current search results that match this
            // entry.
            this.searchResults.forEach(result => {
                const thisResult = result;

                // Only proceed if this result matches the current tailoring
                // entry.
                const isMatchingResult = !entryDomains
                    ? false
                    : RegExp(`.*://.*.?${entryDomains}.*`).test(
                          qs(this.searchEngine.selectors.resultLink, thisResult)
                      );

                if (!isMatchingResult) {
                    // If this result no longer matches a tailoring entry,
                    // remove its entry ID attribute so it will be pruned.
                    if (
                        thisResult.dataset.tailoringEntryId ===
                        tailoringEntry.id
                    ) {
                        thisResult.dataset.tailoringEntryId = "";
                    }

                    return;
                }

                thisResult.dataset.tailoringEntryId = tailoringEntry.id;
            });
        });
    }

    /**
     * Creates and inserts treatment panel elements within each search result
     * that matches a tailoring entry.
     */
    insertTreatmentPanels() {
        // Identify all search results that are missing treatment panels.
        const resultsWithoutPanels = this.tailoredSearchResults.filter(
            searchResult => !qs(this.treatmentPanelSelector, searchResult)
        );

        resultsWithoutPanels.forEach(searchResult => {
            const newTreatmentDiv = document.createElement("div");

            // Some search engines apparently observe DOM mutations
            // and block the insertion of elements with classes into
            // search results (cough-BING-cough). In such cases, add a
            // data attribute to style against instead.
            if (this.searchEngine.styleViaAttribute) {
                newTreatmentDiv.dataset.treatmentPanel = "";
            } else {
                newTreatmentDiv.classList.add("treatment-panel");
            }

            searchResult.insertAdjacentElement("afterbegin", newTreatmentDiv);
        });
    }

    /**
     * Updates the current treatment of each search result that currently has a
     * tailoring entry ID, adding, changing, or removing it as appropriate.
     *
     * @param {string[]} tailoringEntryIDs The IDs of the tailoring entries to apply treatments for, defaulting to all.
     */
    updateTreatments(tailoringEntryIDs = null) {
        // Apply treatments to all tailored results by default.
        let searchResultsToTailor = this.tailoredSearchResults;

        // Limit treatment application when a specific entry ID is provided.
        if (tailoringEntryIDs) {
            searchResultsToTailor = searchResultsToTailor.filter(searchResult =>
                tailoringEntryIDs.includes(
                    searchResult.dataset.tailoringEntryId
                )
            );
        }

        searchResultsToTailor.forEach(searchResult => {
            const thisResult = searchResult;

            // Identify the tailoring entry that applies to this result.
            const tailoringEntry = addonData.runtime.tailoringEntries.find(
                entry => entry.id === thisResult.dataset.tailoringEntryId
            );

            // If this result has no applicable entry, remove any existing
            // alterations applied by the extension.
            if (!tailoringEntry) {
                delete thisResult.dataset.tailoringEntryId;
                thisResult.style.opacity = null;
                thisResult.style.display = null;
                qs(this.treatmentPanelSelector, thisResult).remove();
                return;
            }

            // If this result's treatment is set to an opacity of 0, screen the
            // result completely.
            if (tailoringEntry.treatment.opacity === 0) {
                thisResult.style.display = "none";
                return;
            }

            // Ensure this result element is visible and apply it's treatment's
            // opacity setting directly.
            thisResult.style.display = null;
            thisResult.style.opacity = tailoringEntry.treatment.opacity;

            const treatmentPanel = qs(this.treatmentPanelSelector, thisResult);

            // Apply the other treatment settings for this result to its
            // treatment panel.
            treatmentPanel.style.backgroundColor =
                tailoringEntry.treatment.backgroundColor;
            treatmentPanel.style.borderColor =
                tailoringEntry.treatment.borderColor;
        });
    }
}

getUserData().then(() => new TailoredSearch());
