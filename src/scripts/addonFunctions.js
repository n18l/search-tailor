/**
 * Functions used by multiple scripts in the addon.
 */

const addonFunctions = {
    /**
     * Apply the settings from a particular tailoring template to the
     * appropriate attributes of an HTML element.
     * @param {object} tailoringTemplate - The tailoring template to apply styles from.
     * @param {object} elementToStyle - The HTML element to apply the template's properties to.
     * @param {bool} applyTitle - Whether or not to also apply the template's label as the element's title attribute.
     */
    applyTailoringTemplateStyles(
        tailoringTemplate,
        elementToStyle,
        applyTitle = false
    ) {
        const element = elementToStyle;

        // Convert opacity values (which are stored as numbers between 0 and 1)
        // into hex equivalents.
        const backgroundOpacityHexString = Math.round(
            255 * tailoringTemplate.backgroundOpacity
        ).toString(16);
        const borderOpacityHexString = Math.round(
            255 * tailoringTemplate.borderOpacity
        ).toString(16);

        // Style the supplied element with 8-character hex notation.
        element.style.backgroundColor = `${
            tailoringTemplate.backgroundColor
        }${backgroundOpacityHexString}`;
        element.style.borderColor = `${
            tailoringTemplate.borderColor
        }${borderOpacityHexString}`;

        if (applyTitle) {
            element.title = tailoringTemplate.label;
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
};

module.exports = addonFunctions;
