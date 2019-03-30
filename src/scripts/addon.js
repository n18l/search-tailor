const searchEngines = {
    google: {
        resultContainer: ".srg",
        result: ".rc",
        resultLink: ".r > a",
    },

    duckduckgo: {
        resultContainer: ".results",
        result: ".result",
        resultLink: ".result__a",
    },

    bing: {
        resultContainer: "#b_results",
        result: ".b_algo",
        resultLink: ".b_algo h2 a",
    },

    yahoo: {
        resultContainer: "#web > ol",
        result: ".algo",
        resultLink: ".algo .ac-algo",
    },
};

function filter(searchEngine, tailoredDomains) {
    document
        .querySelectorAll(".spotlight")
        .forEach(el => el.classList.remove("spotlight"));

    document.querySelectorAll(searchEngine.result).forEach(result => {
        const resultLink = result.querySelector(searchEngine.resultLink);

        if (!resultLink) return;

        tailoredDomains.forEach(tailoredDomain => {
            if (
                RegExp(`.*://.*.?${tailoredDomain.domain}.*`).test(resultLink)
            ) {
                result.classList.add(tailoredDomain.treatment);
            }
        });
    });
}

function initialize(items) {
    if (RegExp(".*://.*.?duckduckgo.com/.*").test(window.location)) {
        filter(searchEngines.duckduckgo, items.tailoredDomains);
        // Start observing the target node for configured mutations
        new MutationObserver(() =>
            filter(searchEngines.duckduckgo, items.tailoredDomains)
        ).observe(
            document.querySelector(searchEngines.duckduckgo.resultContainer),
            {
                childList: true,
            }
        );
    }

    if (RegExp(".*://.*.?bing.com/search.*").test(window.location)) {
        filter(searchEngines.bing, items.tailoredDomains);
    }

    if (RegExp(".*://.*.?google.com/search.*").test(window.location)) {
        filter(searchEngines.google, items.tailoredDomains);
    }

    if (RegExp(".*://search.yahoo.com/search.*").test(window.location)) {
        filter(searchEngines.yahoo, items.tailoredDomains);
    }
}

function onError(error) {
    console.log(error);
}

browser.runtime.onMessage.addListener(request => {
    if (request.command === "reinitialize") {
        browser.storage.sync.get("tailoredDomains").then(initialize, onError);
    }
});

(function runtime() {
    /**
     * Check and set a global guard variable.
     * If this content script is injected into the same page again,
     * it will do nothing next time.
     */

    if (window.hasRun) {
        return;
    }
    window.hasRun = true;

    browser.storage.sync.get("tailoredDomains").then(initialize, onError);
})();

// function getStyle(themeInfo) {
//     if (themeInfo.colors) {
//         console.log("accent color : " + themeInfo.colors.accentcolor);
//         console.log("toolbar : " + themeInfo.colors.toolbar);
//     } else {
//         console.log('no themeinfo');
//     }

//     console.log('getStyle ran');
//     // document.querySelector('#popup-content').append(JSON.stringify(themeInfo));
// }

// async function getCurrentThemeInfo() {
//     console.log(browser);
//     var themeInfo = await browser.theme.getCurrent();
//     getStyle(themeInfo);
// }
