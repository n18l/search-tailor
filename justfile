# `just` is a handy tool for saving and running project-specific commands. You
# can review the project's available commands at any time with `just --list`,
# and use them with `just <command>`.
#
# https://github.com/casey/just/blob/master/README.adoc

# Load our .env file for variable access
set dotenv-load := true
build_targets := "firefox chrome"

# Watches for updates to any important files, rebuilding on changes.
watch: clean
    #!/usr/bin/env bash
    set -euxo pipefail

    npx chokidar "src/manifest-*.json" -c "just build-manifest" --initial &
    npx chokidar "src/markup/**/*.pug" -c "just build-markup" --initial &
    npx chokidar "src/styles/**/*.scss" -c "just build-styles" --initial &
    npx chokidar "src/scripts/**/*.js" -c "just build-scripts; if [[ '{path}' == 'src/scripts/addon/data.js' ]]; then just build-markup; fi;" --initial &
    npx chokidar "src/assets" -c "just build-assets" --initial

# Loops through each target browser and runs the supplied command.
_for-each-target command:
    #!/usr/bin/env bash
    set -euxo pipefail

    build_targets=({{build_targets}})
    for target in "${build_targets[@]}"; do
        {{command}}
    done

# Removes all distribution files and recreates the directory structure.
clean:
    rm -rf dist/** && just _for-each-target 'mkdir -p dist/$target/{assets,markup,scripts,styles}'

# Builds all of the distribution files for each target browser.
build: clean
    just build-manifest & \
    just build-markup & \
    just build-styles & \
    just build-scripts & \
    just build-assets

# Directly copies manifest files to the appropriate `dist/` folder.
build-manifest:
    just _for-each-target 'cp src/manifest-$target.json dist/$target/manifest.json'

# Compiles .pug files to .html files, passing `src/scripts/addonData.js` for template data.
build-markup:
    just _for-each-target 'npx pug3 -O src/scripts/addon/data.js src/markup/*.pug --out dist/$target/markup'

# Compiles .scss files to .css files.
build-styles:
    just _for-each-target 'npx sass --update src/styles:dist/$target/styles --style expanded'

# Lints all .js files without exiting, so as not to interrupt watching.
_lint-scripts:
    npx eslint src/scripts/**/*.js; exit 0

# Bundles dependencies and transpiles each .js file directly within `src/scripts/`.
_bundle-scripts:
    just _for-each-target 'for i in src/scripts/*.js; \
        do npx browserify src/scripts/$(basename $i) > dist/$target/scripts/$(basename $i); \
    done'

# Lints and then bundles all .js files.
build-scripts:
    just _lint-scripts _bundle-scripts

# Rebuilds the assets for each target browser.
build-assets:
    just _for-each-target 'cp -r src/assets dist/$target'

# Creates an extension package for Firefox using the current distribution files.
package-fx:
    npx web-ext build \
        --source-dir=dist/firefox/ \
        --artifacts-dir=artifacts/firefox/ \
        --filename=search_tailor-{version}-fx.zip

# Creates an extension package for Chrome using the current distribution files.
package-ch:
    npx web-ext build \
        --source-dir=dist/chrome/ \
        --artifacts-dir=artifacts/chrome/ \
        --filename=search_tailor-{version}-ch.zip

# Creates an extension package for all target browsers using the current distribution files.
package:
    just package-fx & just package-ch

# Gets a signed extension installer for Firefox using the current distribution files.
sign-fx:
    npx web-ext sign \
        --api-key=$FIREFOX_ADDON_DEV_API_KEY \
        --api-secret=$FIREFOX_ADDON_DEV_API_SECRET

# Removes all dependency files, verifies their cached data, and freshly reinstalls them.
reinstall:
    rm -rf node_modules/** && npm cache verify && npm install
