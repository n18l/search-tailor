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
     * The default user data to apply to users who have no preexisting settings.
     */
    defaultUserData: {
        tailoringEntries: [],
        tailoringTreatments: [
            {
                id: "screen",
                label: "Screen",
                backgroundColor: "hsla(0,0%,0%,0)",
                borderColor: "hsla(0,0%,0%,0)",
            },
            {
                id: "suppress",
                label: "Suppress",
                backgroundColor: "hsla(0,0%,0%,0)",
                borderColor: "hsla(0,0%,0%,0)",
            },
            {
                id: "spotlight:default",
                label: "Favorites",
                backgroundColor: "hsla(120,75%,35%,0.25)",
                borderColor: "hsla(120,100%,25%,0.35)",
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
