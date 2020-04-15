import { defaultUserData } from "./addonData";
import TailoredSearch from "./TailoredSearch";

// Get the current user data, then initialize a tailored search within this tab.
browser.storage.sync
    .get(defaultUserData)
    .then(userData => new TailoredSearch(userData));
