/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
    docsSidebar: [
        "getting-started",
        {
            type: "category",
            label: "Modes",
            link: {
                type: "doc",
                id: "modes",
            },
            collapsed: false,
            items: ["modal-select", "option-list-select", "toggle-button-select", "native-select"],
        },
        "option-sources",
        "configuration",
        "accessibility",
        "customization",
        {
            type: "category",
            label: "UI Component Libraries",
            link: {
                type: "doc",
                id: "ui-component-libraries",
            },
            collapsed: false,
            items: [
                "customization-bootstrap",
                "customization-ant-design",
                "customization-chakra-ui",
                "customization-mantine",
                "customization-material-ui",
                "customization-shadcn-ui",
            ],
        },
    ],
};

module.exports = sidebars;
