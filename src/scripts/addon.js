import addonData from "./addonData";
import addonFunctions from "./addonFunctions";

/* Class representing a user's search that is eligible for tailoring. */
class TailorableSearch {
    /**
     * Create a new Tailorable Search, attached to the current window.
     * @param {object} searchWindow - The window object of the tab containing a
     * valid search.
     */
    constructor(searchWindow) {
        this.document = searchWindow.document;

        // Identify which of the predefined search engines we're targeting,
        // returning if one isn't found.
        this.searchEngine = addonData.searchEngines.find(searchEngine =>
            RegExp(searchEngine.matchPattern).test(searchWindow.location)
        );

        if (!this.searchEngine) return false;

        this.tailorResults();
    }

    /**
     * Get the current search result container.
     */
    get searchResultsContainer() {
        return this.document.querySelector(
            this.searchEngine.selectors.resultContainer
        );
    }

    /**
     * Get all current search results.
     */
    get searchResults() {
        return this.searchResultsContainer.querySelectorAll(
            this.searchEngine.selectors.result
        );
    }

    /**
     * Get all current search results that have a treatment applied to them.
     */
    get tailoredResults() {
        return this.searchResultsContainer.querySelectorAll(
            "[data-tailoring-treatment]"
        );
    }

    /**
     * Remove all treatments from the current search results.
     */
    resetTailoring() {
        this.tailoredResults.forEach(tailoredResult =>
            tailoredResult.removeAttribute("data-tailoring-treatment")
        );
    }

    /**
     * Get the current user-defined list of tailoring entries, then apply fresh
     * treatments to matching search results.
     */
    tailorResults() {
        this.resetTailoring();

        /**
         * Apply the appropriate treatment to each result that matches an entry
         * from the user-defined list of tailoring entries.
         *
         * @param {object} storageData - Freshly retrieved data from the extension's synchronized storage.
         */
        const applyTailoringTreatments = storageData => {
            if (!storageData.searchEngines[this.searchEngine.name].enabled)
                return;

            // If this search engine loads results asynchronously, watch its
            // results container for changes.
            if (this.searchEngine.observe) this.setUpObserver();

            // Cache the current search results.
            const currentSearchResults = Array.from(this.searchResults);

            // Filter the search results against each user-defined tailoring
            // entry, applying treatments to matching results.
            storageData.tailoringEntries.forEach(tailoringEntry => {
                // Combine all of this entry's listed domains into a single,
                // RegEx compatible string.
                const entryDomains = tailoringEntry.domains.join("|");

                // Only proceed if there are entry domains to match against.
                if (!entryDomains) {
                    return;
                }

                // Create an array of all current search results that match this
                // entry.
                const matchingResults = currentSearchResults.filter(result =>
                    RegExp(`.*://.*.?${entryDomains}.*`).test(
                        result.querySelector(
                            this.searchEngine.selectors.resultLink
                        )
                    )
                );

                matchingResults.forEach(matchingResult => {
                    const thisResult = matchingResult;

                    // If this entry's treatment is set to an opacity of 0,
                    // screen it completely.
                    if (tailoringEntry.treatment.opacity === 0) {
                        thisResult.dataset.tailoringTreatment = "screen";
                        return;
                    }

                    thisResult.dataset.tailoringTreatment = "spotlight";

                    // Apply this entry's opacity setting inline.
                    thisResult.style.opacity = tailoringEntry.treatment.opacity;

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

                    addonFunctions.applyTailoringTreatmentToElement(
                        tailoringEntry.treatment,
                        newTreatmentDiv
                    );

                    const existingTreatmentDiv = thisResult.querySelector(
                        ".treatment-panel, [data-treatment-panel]"
                    );

                    if (existingTreatmentDiv) {
                        thisResult.replaceChild(
                            newTreatmentDiv,
                            existingTreatmentDiv
                        );
                    } else {
                        thisResult.insertAdjacentElement(
                            "afterbegin",
                            newTreatmentDiv
                        );
                    }
                });
            });
        };

        browser.storage.sync
            .get(addonData.defaultUserData)
            .then(applyTailoringTreatments, addonFunctions.logError);
    }

    /**
     * Observe mutations to this search page's results container, tailoring the
     * results appropriately whenever they change.
     */
    setUpObserver() {
        // Disconnect any existing observers.
        if (this.searchObserver) this.searchObserver.disconnect();

        // Create a new observer to tailor currently-matching entries on
        // mutation.
        this.searchObserver = new MutationObserver(() => this.tailorResults());

        // Have the observer watch for changes to the current page's search
        // results.
        this.searchObserver.observe(this.searchResultsContainer, {
            childList: true,
        });
    }
}

const currentSearch = (function initAddon() {
    /**
     * Check and set a global guard variable.
     * If this content script is injected into the same page again, it will do
     * nothing next time.
     */

    if (window.hasRun) return null;

    window.hasRun = true;

    return new TailorableSearch(window);
})();

// Listen for storage updates, retailoring on change
browser.storage.onChanged.addListener(() => currentSearch.tailorResults());
