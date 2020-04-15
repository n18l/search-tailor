import { workingCopy, defaultUserData, tidbits } from "./addonData";

/**
 * Queries for the first match of a given selector within a given element. A
 * convenience shorthand for the `Element.querySelector()` method.
 *
 * @param {string} selector - The selector to query.
 * @param {ParentNode} context - The node on which to perform the query.
 *
 * @returns {Element} The first element that matches the passed selector in the given context.
 */
export function qs(selector, context = document) {
    return context.querySelector(selector);
}

/**
 * Queries for all matches of a given selector within a given element. A
 * convenience shorthand for the `Element.querySelectorAll()` method.
 *
 * @param {string} selector - The selector to query.
 * @param {ParentNode} context - The node on which to perform the query.
 *
 * @returns {NodeListOf<Element>} All elements that match the passed selector in the given context.
 */
export function qsa(selector, context = document) {
    return context.querySelectorAll(selector);
}

/**
 * Generates a new unique tailoring entry ID.
 *
 * @param {Number} maxRandomInt The multiplication factor to apply to the random ID generation.
 */
export function generateTailoringEntryID(maxRandomInt = 100000) {
    const currentTimestamp = Date.now();
    const randomInt = Math.floor(Math.random() * Math.floor(maxRandomInt));

    return `${currentTimestamp}-${randomInt}`;
}

/**
 * Retrieves the addon's current user data using the browser storage API and
 * saves a local working copy. If the requested data isn't found, it falls
 * back to the addon's defined default values.
 *
 * @param {string[]} requestedStorageData The storage items to retrieve, defaulting to all.
 *
 * @returns {Promise} A Promise resolving to the data saved as the local working copy.
 */
export function getUserData(
    requestedStorageData = ["tailoringEntries", "searchEngines"]
) {
    const userDataPromise = new Promise((resolve, reject) => {
        browser.storage.sync
            .get(requestedStorageData)
            .then(storageData => {
                requestedStorageData.forEach(dataType => {
                    workingCopy[dataType] = [];

                    if (storageData[dataType] && storageData[dataType].length) {
                        workingCopy[dataType] = storageData[dataType];
                    } else {
                        workingCopy[dataType] = defaultUserData[dataType];
                    }
                });

                resolve(workingCopy);
            })
            .catch(error => reject(error));
    });

    return userDataPromise;
}

/**
 * Parses an HSLA-format color string and extracts the individual values,
 * returning them as an object.
 *
 * @param {string} hslaString The HSLA string from which to parse values.
 */
export function parseHSLAString(hslaString) {
    // Remove all whitespace from the HSLA string.
    const sanitizedHslaString = hslaString.replace(/\s/g, "");

    // Define a regular expression for capturing HSLA values.
    const hslaStringRegEx = /hsla\((\d*\.?\d+),(\d*\.?\d+%),(\d*\.?\d+%),(\d*\.?\d+)\)/;

    // Initialize return values.
    let hue = "0";
    let saturation = "0%";
    let lightness = "0%";
    let alpha = "1";

    // Parse the HSLA string and update return values with matches.
    [, hue, saturation, lightness, alpha] = sanitizedHslaString.match(
        hslaStringRegEx
    );

    return { hue, saturation, lightness, alpha };
}

/**
 * Retrieves the value of a CSS custom property set on the root of the page.
 *
 * @param {string} customProperty The name of the CSS custom property to retrieve.
 * @param {string} unitToStrip The expected unit of the property to attempt to remove.
 *
 * @returns {string|number|null} The custom property string value, as an int if a unit is stripped, or null if not found.
 */
export function getCustomPropertyValue(customProperty, unitToStrip = "") {
    const root = document.querySelector("html");
    const propertyValue = window
        .getComputedStyle(root)
        .getPropertyValue(customProperty);

    if (!propertyValue) {
        return null;
    }

    if (unitToStrip) {
        return +propertyValue.replace(unitToStrip, "");
    }

    return propertyValue;
}

/**
 * Logs an error.
 *
 * @param {*} error The error output to log.
 */
export function logError(error) {
    console.error(error);
}

/**
 * Determines whether a passed string is valid JSON.
 *
 * @param {string} json The JSON string to check for validity.
 *
 * @returns {boolean} Whether the passed string is valid JSON.
 */
export function isValidJson(json) {
    try {
        JSON.parse(json);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Save the current tailoring entries via the browser storage API.
 */
export function saveTailoringEntries(changeType, updatedEntryIDs = null) {
    // Get the settings of all existing entry objects. This is largely to make
    // sure we get them in the order represented in the popup UI.
    const entrySettings = workingCopy.tailoringEntryObjects.map(
        entryObject => entryObject.settings
    );

    // Record information about this change to communicate to the extension's
    // other scripts, allowing them to respond accordingly.
    const changeInfo = {
        type: `change:${changeType}`,
        updatedEntryIDs,
    };

    // Send a message about this change to each tab's content script.
    browser.tabs.query({}).then(tabs => {
        tabs.forEach(tab => browser.tabs.sendMessage(tab.id, changeInfo));
    });

    browser.storage.sync
        .set({ tailoringEntries: entrySettings })
        .then(null, logError);
}

/**
 * Save the current search engine settings via the browser storage API.
 */
export function saveSearchEngines() {
    // Record information about this change to communicate to the extension's
    // other scripts, allowing them to respond accordingly.
    const changeInfo = {
        type: `change:search-engines`,
    };

    // Send a message about this change to each tab's content script.
    browser.tabs.query({}).then(tabs => {
        tabs.forEach(tab => browser.tabs.sendMessage(tab.id, changeInfo));
    });

    browser.storage.sync
        .set({ searchEngines: workingCopy.searchEngines })
        .then(null, logError);
}

/**
 * Fetches a random informational tidbit.
 */
export function getRandomTidbit() {
    const randomTidbitIndex = Math.round(
        Math.random() * Math.floor(tidbits.length)
    );

    return tidbits[randomTidbitIndex];
}
