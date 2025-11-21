// CommonJS PostCSS config — Webpack/PostCSS expect CJS format
// This file ensures Next's webpack/postcss-loader can read the config.

module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
