/**
 * Configuration data needed by the addon at runtime.
 */
const addonData = {
    /**
     * A working copy of the addon's loaded data.
     */
    local: {
        /**
         * A full list of all current TailoringGroup objects.
         */
        tailoringGroups: [],
    },

    runtime: {
        tailoringEntries: [],
        tailoringEntryObjects: [],
        searchEngines: [],
    },

    /**
     * Search engine-specific data to guide the application of tailoring
     * templates to search results pages.
     */
    searchEngines: [
        {
            id: "google",
            matchPattern: ".*://.*.?google.com/search.*",
            selectors: {
                resultContainer: "#search",
                result: ".rc",
                resultLink: ".r > a",
            },
            observe: false,
            styleViaAttribute: false,
        },
        {
            id: "duckduckgo",
            matchPattern: ".*://.*.?duckduckgo.com/.*",
            selectors: {
                resultContainer: ".results",
                result: ".result",
                resultLink: ".result__a",
            },
            observe: true,
            styleViaAttribute: false,
        },
        {
            id: "bing",
            matchPattern: ".*://.*.?bing.com/search.*",
            selectors: {
                resultContainer: "#b_results",
                result: ".b_algo",
                resultLink: ".b_algo h2 a",
            },
            observe: false,
            styleViaAttribute: true,
        },
        {
            id: "yahoo",
            matchPattern: ".*://search.yahoo.com/search.*",
            selectors: {
                resultContainer: "#web > ol",
                result: ".algo",
                resultLink: ".algo .ac-algo",
            },
            observe: false,
            styleViaAttribute: false,
        },
    ],

    /**
     * The tailoring treatment settings to apply when creating a new group.
     */
    defaultTreatmentSettings: {
        id: null,
        label: "New Treatment",
        backgroundColor: "hsla(120,75%,35%,0.25)",
        borderColor: "hsla(120,100%,25%,0.35)",
    },

    /**
     * The tailoring treatment settings to apply when creating a new group.
     */
    defaultTreatment: {
        backgroundColor: "hsla(120,60%,85%,1)",
        borderColor: "hsla(120,50%,60%,1)",
        opacity: 1,
    },

    /**
     * The default user data to apply to users who have no preexisting settings.
     */
    defaultUserData: {
        tailoringEntries: [
            {
                id: "1577836800000-00001",
                domains: ["wikipedia.org"],
                treatment: {
                    backgroundColor: "hsla(120,60%,85%,1)",
                    borderColor: "hsla(120,50%,60%,1)",
                    opacity: 1,
                },
            },
        ],
        searchEngines: [
            {
                id: "google",
                label: "Google",
                enabled: true,
            },
            {
                id: "duckduckgo",
                label: "DuckDuckGo",
                enabled: true,
            },
            {
                id: "bing",
                label: "Bing",
                enabled: true,
            },
            {
                id: "yahoo",
                label: "Yahoo!",
                enabled: true,
            },
        ],
    },
};

module.exports = addonData;
