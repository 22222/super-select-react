import path from "node:path";
import { fileURLToPath } from "node:url";
import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sidebarPath = fileURLToPath(new URL("./sidebars.js", import.meta.url));
const websiteCustomCssPath = fileURLToPath(new URL("./src/css/custom.css", import.meta.url));
const githubRepository = process.env.GITHUB_REPOSITORY ?? "";
const [githubOwner = "super-select", githubRepositoryName = "super-select"] = githubRepository.split("/");
const defaultLocalUrl = "http://127.0.0.1";
const siteUrl = process.env.DOCS_SITE_URL ?? defaultLocalUrl;
const baseUrl = process.env.DOCS_BASE_URL ?? "/";

const config: Config = {
    title: "Super Select",
    tagline: "SuperSelect component documentation",
    favicon: "img/logo.svg",

    url: siteUrl,
    baseUrl,

    organizationName: githubOwner,
    projectName: githubRepositoryName,

    onBrokenLinks: "throw",
    markdown: {
        hooks: {
            onBrokenMarkdownLinks: "throw",
        },
    },

    i18n: {
        defaultLocale: "en",
        locales: ["en"],
    },

    presets: [
        [
            "classic",
            {
                docs: {
                    routeBasePath: "/",
                    sidebarPath,
                },
                blog: false,
                pages: false,
                theme: {
                    customCss: [path.resolve(__dirname, "../src/super-select.css"), websiteCustomCssPath],
                },
            },
        ],
    ],
    plugins: [
        function superSelectLocalSourceAlias() {
            return {
                name: "super-select-local-source-alias",
                configureWebpack() {
                    return {
                        resolve: {
                            alias: {
                                "super-select-react$": path.resolve(__dirname, "../src/index.ts"),
                            },
                        },
                    };
                },
            };
        },
    ],

    themeConfig: {
        navbar: {
            title: "Super Select",
            logo: {
                alt: "Super Select logo",
                src: "img/logo.svg",
            },
        },
        footer: {
            links: [
                { label: "Documentation", to: "/getting-started" },
                { label: "Github", to: "https://github.com/22222/super-select-react" },
            ],
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
        },
    },
};

export default config;
