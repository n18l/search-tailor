/* eslint-disable no-unused-vars */

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
};
