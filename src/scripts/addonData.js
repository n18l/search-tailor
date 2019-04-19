/* eslint-disable no-unused-vars */

/**
 * Configuration data needed by the addon at runtime.
 */

const addonData = {
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
        searchEngines: {
            google: {
                enabled: false,
            },
            duckduckgo: {
                enabled: true,
            },
            bing: {
                enabled: true,
            },
            yahoo: {
                enabled: true,
            },
        },
    },
};
