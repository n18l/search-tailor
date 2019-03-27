const searchEngines = {
    google: {
        resultContainer: '.srg',
        result: '.rc',
        resultLink: '.r > a',
    },

    duckduckgo: {
        resultContainer: '.results',
        result: '.result',
        resultLink: '.result__a',
    },

    bing: {
        resultContainer: '#b_results',
        result: '.b_algo',
        resultLink: '.b_algo h2 a',
    },

    yahoo: {
        resultContainer: '#web > ol',
        result: '.algo',
        resultLink: '.algo .ac-algo',
    }
};

browser.runtime.onMessage.addListener(request => {
    if (request.command === 'reinitialize') {
        browser.storage.sync.get('filteredDomains')
            .then(initialize, onError);
    }
});

const filteredDomains = [];

function filter(searchEngine, filteredDomains) {
    document.querySelectorAll('.spotlight').forEach(el => el.classList.remove('spotlight'));

    document.querySelectorAll(searchEngine.result).forEach(result => {
        const resultLink = result.querySelector(searchEngine.resultLink);

        if (!resultLink) return;

        filteredDomains.forEach(filteredDomain => {

            if (RegExp(`.*://.*.?${filteredDomain.domain}.*`).test(resultLink)) {
                result.classList.add(filteredDomain.action);
            }
        });

    });
}

function initialize(items) {
    
    if (RegExp('.*://.*.?duckduckgo.com/.*').test(window.location)) {
        filter(searchEngines.duckduckgo, items.filteredDomains)
        // Start observing the target node for configured mutations
        new MutationObserver(() => filter(searchEngines.duckduckgo, items.filteredDomains))
            .observe(document.querySelector(searchEngines.duckduckgo.resultContainer), {
                childList: true
            });
    }

    if (RegExp('.*://.*.?bing.com/search.*').test(window.location)) {
        filter(searchEngines.bing, items.filteredDomains);
    }

    if (RegExp('.*://.*.?google.com/search.*').test(window.location)) {
        filter(searchEngines.google, items.filteredDomains);
    }

    if (RegExp('.*://search.yahoo.com/search.*').test(window.location)) {
        filter(searchEngines.yahoo, items.filteredDomains);
    }
}

function onError(error) {
    console.log(error)
}

(function () {
    /**
     * Check and set a global guard variable.
     * If this content script is injected into the same page again,
     * it will do nothing next time.
     */

    if (window.hasRun) {
        return;
    }
    window.hasRun = true;

    browser.storage.sync.get('filteredDomains')
        .then(initialize, onError);
})();


function getStyle(themeInfo) {
    if (themeInfo.colors) {
        console.log("accent color : " + themeInfo.colors.accentcolor);
        console.log("toolbar : " + themeInfo.colors.toolbar);
    } else {
        console.log('no themeinfo');
    }

    console.log('getStyle ran');
    // document.querySelector('#popup-content').append(JSON.stringify(themeInfo));
}

async function getCurrentThemeInfo() {
    console.log(browser);
    var themeInfo = await browser.theme.getCurrent();
    getStyle(themeInfo);
}