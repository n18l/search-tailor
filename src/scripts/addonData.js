/**
 * Configuration data needed by the addon at runtime.
 */
const addonData = {
    /**
     * A working copy of the addon's loaded data.
     */
    local: {
        /**
         * A full list of all current TailoringGroup objects, keyed by the ID of
         * the tailoring template they apply.
         */
        tailoringGroups: {},
    },
    treatmentTypes: [
        {
            id: "screen",
            label: "Screen",
        },
        {
            id: "suppress",
            label: "Suppress",
        },
        {
            id: "spotlight:default",
            label: "Spotlight",
        },
    ],
    searchEngines: [
        {
            name: "Google",
            matchPattern: ".*://.*.?google.com/search.*",
            selectors: {
                resultContainer: ".srg",
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

    defaultUserData: {
        tailoredDomains: [],
        tailoringTemplates: [
            {
                id: "screen",
                label: "Screen",
                backgroundColor: "#000000",
                backgroundOpacity: "0",
                borderColor: "#000000",
                borderOpacity: "0",
                contentOpacity: "0",
            },
            {
                id: "suppress",
                label: "Suppress",
                backgroundColor: "#000000",
                backgroundOpacity: "0",
                borderColor: "#000000",
                borderOpacity: "0",
                contentOpacity: ".5",
            },
            {
                id: "spotlight:default",
                label: "Default",
                backgroundColor: "#19E54C",
                backgroundOpacity: ".25",
                borderColor: "#007F00",
                borderOpacity: ".35",
                contentOpacity: "1",
            },
        ],
        tailoringTemplatePreviewColor: "#FFFFFF",
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
