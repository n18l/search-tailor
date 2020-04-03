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
    },

    /**
     * Search engine-specific data to guide the application of tailoring
     * templates to search results pages.
     */
    searchEngines: [
        {
            name: "Google",
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
            name: "DuckDuckGo",
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
            name: "Bing",
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
            name: "Yahoo!",
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
        backgroundColor: "hsla(120,75%,35%,0.25)",
        borderColor: "hsla(120,100%,25%,0.35)",
        opacity: 1,
    },

    /**
     * The default user data to apply to users who have no preexisting settings.
     */
    defaultUserData: {
        tailoringEntries: [
            {
                id: "1577836800000-00001",
                domains: ["css-tricks.com", "stackoverflow.com"],
                treatment: {
                    backgroundColor: "hsla(120,75%,35%,0.25)",
                    borderColor: "hsla(120,100%,25%,0.35)",
                    opacity: 1,
                },
            },
            {
                id: "1577836800000-00002",
                domains: ["w3schools.com"],
                treatment: {
                    backgroundColor: "hsla(240,75%,35%,0.25)",
                    borderColor: "hsla(240,100%,25%,0.35)",
                    opacity: 0.5,
                },
            },
            {
                id: "1577836800000-00003",
                domains: ["geeksforgeeks"],
                treatment: {
                    backgroundColor: "hsla(240,75%,35%,0.25)",
                    borderColor: "hsla(240,100%,25%,0.35)",
                    opacity: 0,
                },
            },
        ],
        searchEngines: {
            Google: {
                enabled: true,
            },
            DuckDuckGo: {
                enabled: true,
            },
            Bing: {
                enabled: true,
            },
            "Yahoo!": {
                enabled: true,
            },
        },
    },
};

module.exports = addonData;
