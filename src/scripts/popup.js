const addonData = require("./addonData");
const addonFunctions = require("./addonFunctions");
const TailoringGroup = require("./TailoringGroup");
const TailoringEntry = require("./TailoringEntry");

/**
 * Creates a Tailoring Group for each existing treatment in the user data, adding
 * it to the current working list of all Tailoring Groups.
 */
function initializeGroups() {
    addonData.local.tailoringTreatments.forEach(tailoringTreatment => {
        addonData.local.tailoringGroups[
            tailoringTreatment.id
        ] = new TailoringGroup(tailoringTreatment);
    });

    console.log(addonData.local.tailoringGroups);
}

/**
 * Creates a Tailoring Entry for each existing entry in the user data, adding it
 * to the entry list of the Tailoring Group to which it belongs.
 */
function initializeEntries() {
    addonData.local.tailoredDomains.forEach(tailoredDomain => {
        addonData.local.tailoringGroups[tailoredDomain.treatment].entries.push(
            new TailoringEntry(tailoredDomain)
        );
    });
}

/**
 * Initializes the addon's popup UI.
 */
function initializePopup() {
    initializeGroups();
    initializeEntries();
}

// Get the current user data, then initialize the popup UI.
addonFunctions.getUserData().then(() => initializePopup());
