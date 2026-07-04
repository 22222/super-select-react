import { createElement, Fragment } from "react";
import { describe, expect, it } from "vitest";

import { parseChildOptions } from "./parseChildOptions";

describe("parseChildOptions", () => {
    it("parses text options without duplicating the text as rich children", () => {
        expect(parseChildOptions(createElement("option", { value: "a" }, "Option A"))).toEqual([
            {
                value: "a",
                label: "Option A",
                children: undefined,
                disabled: false,
                hidden: false,
                data: undefined,
            },
        ]);
    });

    it("keeps rich option children while deriving their plain-text label", () => {
        const children = createElement("span", null, "Rich ", createElement("strong", null, "option"));
        const [option] = parseChildOptions(createElement("option", { value: "rich" }, children));

        expect(option).toMatchObject({ value: "rich", label: "Rich option" });
        expect(option.children).toBe(children);
    });

    it("ignores other valid select children", () => {
        const options = parseChildOptions([
            createElement("button", { key: "button" }, createElement("selectedcontent")),
            createElement("option", { key: "option", value: "a" }, "Option A"),
        ]);

        expect(options.map((option) => option.value)).toEqual(["a"]);
    });

    it("parses options inside fragments", () => {
        const options = parseChildOptions(
            createElement(
                Fragment,
                null,
                createElement("option", { value: "a" }, "Option A"),
                createElement(Fragment, null, createElement("option", { value: "b" }, "Option B")),
            ),
        );

        expect(options.map((option) => option.value)).toEqual(["a", "b"]);
    });

    it("parses option groups, attributes, and data attributes", () => {
        const options = parseChildOptions(
            createElement(
                "optgroup",
                { label: "Group" },
                createElement("option", { value: "a", disabled: true, hidden: true, "data-rank": 1 }, "Option A"),
            ),
        );

        expect(options).toEqual([
            {
                value: "a",
                label: "Option A",
                children: undefined,
                groupLabel: "Group",
                disabled: true,
                hidden: true,
                data: { rank: 1 },
            },
        ]);
    });

    it("keeps only the first option for each value", () => {
        const options = parseChildOptions([
            createElement("option", { key: "first", value: "a" }, "First"),
            createElement("option", { key: "second", value: "a" }, "Second"),
        ]);

        expect(options.map((option) => option.label)).toEqual(["First"]);
    });
});
