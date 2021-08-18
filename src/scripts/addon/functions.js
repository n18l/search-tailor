import browser from "webextension-polyfill";
import { remoteConfigUrl, tidbits } from "./data";

/**
 * Logs any provided values to the console for debugging purposes. The output is
 * only visible when the appropriate localStorage value is set.
 *
 * @param {...any} logItems Items to log to the console.
 */
export function log(...logItems) {
    if (localStorage.getItem(`search-tailor:debug`) !== `1`) {
        return;
    }

    // eslint-disable-next-line no-console
    console.log(`[Search Tailor]`, ...logItems);
}

/**
 * Logs an error, throwing to end execution if necessary.
 *
 * @param {any}     error       The error output to log.
 * @param {boolean} shouldThrow Whether the error should end execution.
 */
export function logError(error, shouldThrow = false) {
    if (shouldThrow) {
        throw new Error(`[Search Tailor] ${error}`);
    }

    console.error(`[Search Tailor]`, error);
}

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
 * Parses an HSLA-format color string and extracts the individual values,
 * returning them as an object.
 *
 * @param {string} hslaString The HSLA string from which to parse values.
 */
export function parseHSLAString(hslaString) {
    // Remove all whitespace from the HSLA string.
    const sanitizedHslaString = hslaString.replace(/\s/g, "");

    // Define a regular expression for capturing HSLA values.
    const hslaStringRegEx =
        /hsla\((\d*\.?\d+),(\d*\.?\d+%),(\d*\.?\d+%),(\d*\.?\d+)\)/;

    // Initialize return values.
    let hue = "0";
    let saturation = "0%";
    let lightness = "0%";
    let alpha = "1";

    // Parse the HSLA string and update return values with matches.
    [, hue, saturation, lightness, alpha] =
        sanitizedHslaString.match(hslaStringRegEx);

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
 * Retrieves configuration data for the extension from a remote source, where it
 * can be more quickly updated independently of the larger release cycle.
 *
 * @returns {object} The current configuration data for the extension.
 */
export async function getRemoteConfigData() {
    // Get any existing stored configuration values.
    const storedConfigData = await browser.storage.local.get({
        configETag: "",
        configFiles: null,
    });

    const storedConfigETag = storedConfigData.configETag;
    const storedConfigFiles = storedConfigData.configFiles;
    let updatedConfigData = null;

    if (!storedConfigFiles) {
        // We have no existing configuration data; get a fresh set.
        log(`We have no existing configuration data; get a fresh set.`);

        const configFilesResponse = await fetch(remoteConfigUrl).catch(
            logError
        );

        if (!configFilesResponse) {
            log(`Couldn't get fresh data; we're kind of hosed.`);
            return storedConfigData;
        }

        updatedConfigData = {
            configETag: configFilesResponse.headers.get("ETag"),
            configFiles: (await configFilesResponse.json()).files,
        };
    } else {
        // We have some existing data; check to see if it's current.
        log(`We have some existing data; check to see if it's current.`);

        const configFilesResponse = await fetch(remoteConfigUrl, {
            headers: {
                "If-None-Match": storedConfigETag,
            },
        }).catch(logError);

        if (!configFilesResponse) {
            log(`Couldn't check our data; use our existing data for now.`);
            return storedConfigData;
        }

        log(`GitHub responded:`, configFilesResponse);

        switch (configFilesResponse.status) {
            case 200:
                // GitHub responded with some fresh files to use.
                log(`GitHub responded with some fresh files to use.`);

                updatedConfigData = {
                    configETag: configFilesResponse.headers.get("ETag"),
                    configFiles: (await configFilesResponse.json()).files,
                };
                break;
            case 304:
                // GitHub responded that our data is current.
                log(`GitHub responded that our data is current.`);
                break;
            default:
                // GitHub responded with... something else.
                log(`GitHub responded with... something else.`);
        }
    }

    if (updatedConfigData) {
        // Store our fresh config data.
        log(`Store our fresh config data:`, updatedConfigData);

        browser.storage.local.set(updatedConfigData).catch(logError);
    }

    return updatedConfigData || storedConfigData;
}

/**
 * Retrieves the JSON contents of the specified remotely-stored configuration
 * file.
 *
 * @param {string} filename The name of the JSON configuration file.
 *
 * @returns {any} The parsed JSON configuration data.
 */
export async function getRemoteConfig(filename) {
    const { configFiles } = await getRemoteConfigData();

    if (!configFiles) {
        logError(`Couldn't retrieve configuration files!`, true);
    }

    const requestedConfigJson = configFiles[`${filename}.json`].content;
    const requestedConfigObject = JSON.parse(requestedConfigJson);

    return requestedConfigObject;
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
 * Sends a message to all of the extension's active content scripts notifying
 * them of a change.
 *
 * @param {String}   changeType A simple description of the type of change.
 * @param {String[]} updatedIDs The IDs of specific tailoring entries to apply updates for, defaulting to all.
 */
export function sendChangeNotification(changeType, updatedIDs = null) {
    // Record information about this change to communicate to the extension's
    // other scripts, allowing them to respond accordingly.
    const changeInfo = {
        type: `change:${changeType}`,
        updatedIDs,
    };

    // Identify any tabs where a content script should be running based on the
    // matches defined in the manifest.
    const manifest = browser.runtime.getManifest();
    const { matches } = manifest.content_scripts[0];
    const getContentScriptTabs = browser.tabs.query({ url: matches });

    // Send the change message to any active content scripts.
    getContentScriptTabs
        .then((tabs) => tabs.map((tab) => browser.tabs.connect(tab.id)))
        .then((ports) => ports.forEach((port) => port.postMessage(changeInfo)))
        .catch(logError);
}

/**
 * Fetches a random informational tidbit.
 */
export function getRandomTidbit() {
    const randomTidbitIndex = Math.floor(Math.random() * tidbits.length);

    return tidbits[randomTidbitIndex];
}
