import TailoredSearch from "./TailoredSearch";

// Get the current user data, then initialize a tailored search within this tab.
browser.storage.sync
    .get(["tailoringEntries", "searchEngines"])
    .then(userData => new TailoredSearch(userData));
