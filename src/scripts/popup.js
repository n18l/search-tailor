const addonData = require("./addonData");
const addonFunctions = require("./addonFunctions");
const TailoredDomainGroup = require("./TailoringGroup");
const TailoredDomainListEntry = require("./TailoringEntry");

/**
 * Creates a Tailoring Group for each existing template in the user data, adding
 * it to the current working list of all Tailoring Groups.
 */
function initializeGroups() {
    addonData.local.tailoringTemplates.forEach(tailoringTemplate => {
        addonData.local.tailoringGroups[
            tailoringTemplate.id
        ] = new TailoredDomainGroup(tailoringTemplate);
    });
}

/**
 * Creates a Tailoring Entry for each existing entry in the user data, adding it
 * to the entry list of the Tailoring Group to which it belongs.
 */
function initializeEntries() {
    addonData.local.tailoredDomains.forEach(tailoredDomain => {
        addonData.local.tailoringGroups[tailoredDomain.treatment].entries.push(
            new TailoredDomainListEntry(tailoredDomain)
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
