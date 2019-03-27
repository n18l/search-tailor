const presets = [
    [
        "@babel/env",
        {
            targets: "last 2 Firefox versions",
        },
    ],
];

const generatorOpts = {
    minified: true,
    comments: false,
}

module.exports = { presets, generatorOpts };