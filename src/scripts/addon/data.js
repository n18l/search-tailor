/**
 * Configuration data needed by the addon at runtime.
 */

/**
 * Search engine-specific data to guide the application of tailoring
 * templates to search results pages.
 */
const searchEngines = [
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
];

/**
 * The treatment settings to apply when creating a new tailoring entry.
 */
const defaultTreatment = {
    backgroundColor: "hsla(120,60%,85%,1)",
    borderColor: "hsla(120,50%,60%,1)",
    opacity: 1,
};

/**
 * The default user data to apply to users who have no preexisting settings.
 */
const defaultUserData = {
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
};

/**
 * External links relevant to the extension.
 */
const links = {
    documentation: "https://github.com/nbrombal/search-tailor",
    issues: "https://github.com/nbrombal/search-tailor/issues",
    reviews: "#",
    support: {
        githubSponsors: "https://github.com/sponsors/nbrombal",
        paypal: "https://www.paypal.me/nbrombal",
        squareCash: "https://cash.app/$nbrombal",
    },
};

/**
 * Fun facts displayed in the tooltip of logo in the title bar.
 */
const tidbits = [
    `The majority of Canada's population lives south of Seattle.`,
    `Killer whales are a natural predator of moose.`,
    `It takes up to three years for a pineapple to grow.`,
    `There's only one country between Finland and North Korea.`,
    `The ampersand is a shorthand combination of "et", which is Latin for "and".`,
    `Oxford University is older than the Aztec civilization.`,
    `Canada has an island-in-a-lake-on-an-island-in-a-lake-on-an-island.`,
    `Nobody born after 1935 has walked on the moon.`,
    `The closest US state to Africa is Maine.`,
    `The order of a freshly-shuffled deck of cards is likely to only ever exist once.`,
];

module.exports = {
    searchEngines,
    defaultTreatment,
    defaultUserData,
    links,
    tidbits,
};
