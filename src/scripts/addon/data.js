/**
 * Configuration data needed by the addon at runtime.
 */

/**
 * The external URL where configuration data for the addon is stored, allowing
 * for granular updates that don't require a new addon version.
 */
const remoteConfigUrl =
    "https://api.github.com/gists/dfd714ab2a99bddb1e2e15999423055e";

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
    _dataFormat: "v1",
    colorHintBackground: "#ffffff",
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
    `The term for a stegosaurus' tail spikes, "thagomizer", was coined by cartoonist Gary Larson in his comic The Far Side.`,
];

module.exports = {
    remoteConfigUrl,
    defaultTreatment,
    defaultUserData,
    links,
    tidbits,
};
