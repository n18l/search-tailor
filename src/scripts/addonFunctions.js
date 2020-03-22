const addonData = require("./addonData");

/**
 * Functions used by multiple scripts in the addon.
 */
const addonFunctions = {
    /**
     * Apply the settings from a particular tailoring treatment to the
     * appropriate attributes of an HTML element.
     * @param {object} tailoringTreatment - The tailoring treatment to apply styles from.
     * @param {object} elementToStyle - The HTML element to apply the treatment's properties to.
     * @param {bool} applyTitle - Whether or not to also apply the treatment's label as the element's title attribute.
     */
    applyTailoringTreatmentToElement(
        tailoringTreatment,
        elementToStyle,
        applyTitle = false
    ) {
        const element = elementToStyle;

        // Convert opacity values (which are stored as numbers between 0 and 1)
        // into hex equivalents.
        const backgroundOpacityHexString = Math.round(
            255 * tailoringTreatment.backgroundOpacity
        ).toString(16);
        const borderOpacityHexString = Math.round(
            255 * tailoringTreatment.borderOpacity
        ).toString(16);

        // Style the supplied element with 8-character hex notation.
        element.style.backgroundColor = `${
            tailoringTreatment.backgroundColor
        }${backgroundOpacityHexString}`;
        element.style.borderColor = `${
            tailoringTreatment.borderColor
        }${borderOpacityHexString}`;

        if (applyTitle) {
            element.title = tailoringTreatment.label;
        }
    },

    /**
     * Converts a given hex color string value into HSL (Hue, Saturation,
     * Lightness) values, either as an array or a CSS-compatible string.
     * @param {string} hexString - The hex value to be converted.
     * @param {boolean} returnAsString - Whether or not to return the converted value as a CSS-compatible string. Defaults to false.
     * @param {integer} [alphaValue] - An optional alpha value to apply when outputting as a string, between 0 and 1 inclusive. Defaults to 1.
     */
    hexToHSL(hexString, returnAsString = false, alphaValue = 1) {
        if (!hexString) {
            return console.error(
                "hexToHSL function requires a valid hex string."
            );
        }

        const r = parseInt(hexString.substr(1, 2), 16) / 255;
        const g = parseInt(hexString.substr(3, 2), 16) / 255;
        const b = parseInt(hexString.substr(5, 2), 16) / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);

        let hue;
        let saturation;
        const lightness = (max + min) / 2;

        if (max === min) {
            hue = 0;
            saturation = 0;
        } else {
            const delta = max - min;

            switch (max) {
                case r:
                    hue = (g - b) / delta + (g < b ? 6 : 0);
                    break;
                case g:
                    hue = (b - r) / delta + 2;
                    break;
                case b:
                    hue = (r - g) / delta + 4;
                    break;
                default:
                    break;
            }

            hue = Math.round(hue / (6 / 360));
            saturation =
                lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
        }

        if (returnAsString) {
            return `hsla(${hue}, ${saturation * 100}%, ${lightness *
                100}%, ${alphaValue})`;
        }

        return [hue, saturation, lightness];
    },

    /**
     * Logs an error.
     *
     * @param {*} error The error output to log.
     */
    logError(error) {
        console.error(error);
    },

    /**
     * Synchronize the list's current entries with the browser.storage API,
     * then reinitialize the addon in any tabs affected by the extension.
     */
    syncTailoredDomainsToStorage() {
        let allEntryValues = [];

        addonData.local.tailoringGroups.forEach(tailoringGroup => {
            allEntryValues = allEntryValues.concat(tailoringGroup.entryValues);
        });

        const validTailoredDomains = allEntryValues.filter(
            entryValues => entryValues.domain !== ""
        );

        browser.storage.sync
            .set({ tailoredDomains: validTailoredDomains })
            .then(null, addonFunctions.logError);
    },

    /**
     * Retrieves the data of the tailoring treatment using the provided ID.
     *
     * @param {String} treatmentID The ID of the treatment to retrieve.
     *
     * @returns {Object|undefined} The requested tailoring treatment, or undefined if not found.
     */
    getTailoringTreatmentByID(treatmentID) {
        return addonData.local.tailoringTreatments.find(
            treatment => treatment.id === treatmentID
        );
    },

    /**
     * Retrieves the TailoringGroup object with the provided treatment ID.
     *
     * @param {String} treatmentID The treatment ID to search against
     *
     * @returns {TailoringGroup} The TailoringGroup with the matching treatment ID, or undefined if none.
     */
    getTailoringGroupByTreatmentID(treatmentID) {
        return addonData.local.tailoringGroups.find(
            tailoringGroup => tailoringGroup.treatment.id === treatmentID
        );
    },

    /**
     * Retrieves the addon's current user data using the browser storage API and
     * saves a local working copy. If the requested data isn't found, it falls
     * back to the addon's defined default values.
     *
     * @returns {Promise} A Promise resolving to the data saved as the local working copy.
     */
    getUserData() {
        const requestedStorageData = ["tailoredDomains", "tailoringTreatments"];

        const userDataPromise = new Promise((resolve, reject) => {
            browser.storage.sync
                .get(requestedStorageData)
                .then(storageData => {
                    requestedStorageData.forEach(dataType => {
                        addonData.local[dataType] = [];

                        if (
                            storageData[dataType] &&
                            storageData[dataType].length
                        ) {
                            addonData.local[dataType] = storageData[dataType];
                        } else {
                            addonData.local[dataType] =
                                addonData.defaultUserData[dataType];
                        }
                    });

                    resolve(addonData.local);
                })
                .catch(error => reject(error));
        });

        return userDataPromise;
    },
};

module.exports = addonFunctions;
