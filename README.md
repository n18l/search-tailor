<div align="center">
    <img src="src/assets/icons/icon.svg" alt="The Search Tailor icon" width="128" />
</div>

# Search Tailor

Search Tailor is a browser extension for tailoring your search results. Find what you need quickly and easily by making sites stand out, blend in, or disappear!

## Frequently Asked Questions

> ### What does Search Tailor do?

Search Tailor allows you to alter the appearance of text search results based on the websites they link to. For example, you can add a background or border colour to results from your favourite websites; lower the opacity of results from websites you want to see less of; or hide results entirely from sites you don't care for.

> ### How does Search Tailor work?

Search Tailor provides a popup interface where you can associate specific websites with options like a background colour, border colour, or opacity value. Each one of these settings is called a "treatment", and controls the way search results that link to that website should look when the extension sees them appear in a text search.

When you perform a text search, Search Tailor will compare the website URL of each search result against your list of treatments. If it finds a match, it will alter the associated search result based on your settings. That's it!

> ### Where does Search Tailor work?

Search Tailor is currently compatible with the latest versions of [Firefox](https://www.mozilla.org/en-US/firefox/browsers/) and [Chrome](https://www.google.com/chrome/), and can alter text search results that appear on the following domains:

-   `google.com/search`
-   `duckduckgo.com`
-   `bing.com/search`
-   `search.yahoo.com/search`

This list has been kept fairly conservative in an effort to limit the permissions requested of each user, as each domain constitutes a seperate permission. If you'd like Search Tailor to work for a different search provider, please [check out the project's issues](https://github.com/nbrombal/search-tailor/releases) to see if we're working on it or to submit a request!

> ### Why did you create Search Tailor?

I'm web developer by trade, and I spend a lot of time searching for answers to technical questions. Over time, I've noticed a pattern in the websites I prefer to get results from based on the kind of question I'm asking. I made Search Tailor so I could colour-code my search results to match specific websites common to my searches, allowing me to quickly scan for the right type of resource for the problem I'm solving.

> ### Does Search Tailor store my search history or the websites I visit?

No, Search Tailor doesn't store or transmit any information about your internet activity. The only thing stored by the extension is your configuration, which is not shared with anyone.

> ### When will Search Tailor be available in the Firefox Add-on directory and Chrome Web Store?

As soon as possible! Search Tailor is a side project, so updates to it are dependent on how much free time I happen to have. In the meantime, feel free to install a pre-release version and star this repo to get update notifications.

## Pre-release Installation

Search Tailor is still under development, but don't let that stop you from taking it for a spin: You can always find the latest available version over on the [Releases page](https://github.com/nbrombal/search-tailor/releases), complete with change notes and the necessary installation files for both Firefox and Chrome. Once Search Tailor graduates to version 1, it will be released on the Firefox Add-on directory and Chrome Web Store.

_Note: Always be sure that you trust an extension before installing it by one of the methods below._

### Firefox

To manually install a pre-release version in Firefox:

1. Visit the [Releases page](https://github.com/nbrombal/search-tailor/releases) and find the version you'd like to install.
2. Expand the "Assets" detail pane and download the `xpi` file.
3. Open a Firefox window.
4. Find and drag your downloaded `xpi` file onto the Firefox window.
5. Review the extension's permissions and accept them if you're comfortable.

### Chrome

To manually install a pre-release version in Chrome:

1. Visit the [Releases page](https://github.com/nbrombal/search-tailor/releases) and find the version you'd like to install.
2. Expand the "Assets" detail pane and download the file ending in `ch.zip`.
3. Find and unzip your downloaded `zip` file.
4. In Chrome, visit [chrome://extensions/](chrome://extensions/).
5. Enable "Developer mode" using the switch in the page's upper-right corner.
6. Select "Load unpacked" from the buttons that should now be displayed near the top left of the page.
7. Find and select your unzipped folder.
