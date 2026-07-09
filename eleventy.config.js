const { HtmlBasePlugin } = require("@11ty/eleventy");

module.exports = function (eleventyConfig) {
  // Rewrites absolute internal URLs when the site is served from a sub-path
  // (e.g. GitHub Pages project sites). Set PATH_PREFIX="/repo-name/" in CI.
  eleventyConfig.addPlugin(HtmlBasePlugin);

  eleventyConfig.addPassthroughCopy("src/assets");

  // Don't render doc markdown inside assets (e.g. the merch photo README) as pages.
  eleventyConfig.ignores.add("src/assets/**/*.md");

  // Sveltia CMS admin: copy raw to /admin/ instead of templating it.
  eleventyConfig.ignores.add("src/admin/**");
  eleventyConfig.addPassthroughCopy("src/admin");

  // "June 2026" → "june-2026" etc., used for analytics labels
  eleventyConfig.addFilter("slugSafe", (value) =>
    String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  );

  // RFC 5545 TEXT escaping for calendar.ics values
  eleventyConfig.addFilter("icsText", (value) =>
    String(value).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,")
  );

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    pathPrefix: process.env.PATH_PREFIX || "/",
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
