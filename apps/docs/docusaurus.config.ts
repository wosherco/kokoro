import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";
import tailwindPlugin from "./plugins/taliwind-config";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  plugins: [tailwindPlugin],
  title: "Kokoro",
  tagline: "Integrate, Centralize, Empower AI",
  favicon: "favicon.ico",

  // Set the production url of your site here
  url: "https://docs.kokoro.ws",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "throw",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: "https://github.com/wosherco/kokoro/tree/main/apps/docs/",
          routeBasePath: "/", // Serve docs at root path
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/kokoro-social-card.jpg",
    navbar: {
      title: "Kokoro Docs",
      logo: {
        alt: "Kokoro Logo",
        src: "/android-chrome-192x192.png",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "installationSidebar",
          position: "left",
          label: "Introduction",
        },
        {
          type: "docSidebar",
          sidebarId: "integrationsSidebar",
          position: "left",
          label: "Integrations",
        },
        {
          type: "docSidebar",
          sidebarId: "apiSidebar",
          position: "left",
          label: "Kokoro API",
        },
        {
          href: "https://github.com/wosherco/kokoro",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Documentation",
          items: [
            {
              label: "Introduction",
              to: "/introduction/getting-started",
            },
            {
              label: "Integrations",
              to: "/integrations",
            },
            {
              label: "API Reference",
              to: "/api",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/wosherco/kokoro",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Kokoro. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
