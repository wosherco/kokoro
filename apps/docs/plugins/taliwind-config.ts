import type { PluginConfig } from "@docusaurus/types";

const tailwindPlugin: PluginConfig = (context, options) => ({
  name: "tailwind-plugin",
  configurePostCss(postcssOptions) {
    postcssOptions.plugins = [
      require("postcss-import"),
      require("tailwindcss"),
      require("autoprefixer"),
    ];
    return postcssOptions;
  },
});

export default tailwindPlugin;
