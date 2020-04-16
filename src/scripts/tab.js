import { defaultUserData } from "./addon/data";
import TailoredSearch from "./classes/TailoredSearch";

let currentTailoredSearch = null;

// Get the current user data, then initialize a tailored search within this tab.
browser.storage.sync.get(defaultUserData).then(userData => {
    currentTailoredSearch = new TailoredSearch(userData);
});

// Reapply tailoring when sent a targeted change message. The message denotes
// which entry IDs to apply changes for, allowing patch updates.
browser.runtime.onMessage.addListener(message => {
    // Only proceed if this is a change message.
    if (!message.type.startsWith("change")) {
        return;
    }

    // Refresh the current user data and reapply tailoring for the appropriate
    // search results.
    browser.storage.sync.get(defaultUserData).then(updatedUserData => {
        currentTailoredSearch.userData = updatedUserData;
        currentTailoredSearch.tailor(message.updatedEntryIDs);
    });
});
