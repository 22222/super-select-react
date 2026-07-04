import { describe, expect, it } from "vitest";

import { normalizeSelectValue } from "./normalizeSelectValue";

describe("normalizeSelectValue", () => {
    it("normalizes scalar values", () => {
        expect(normalizeSelectValue("value")).toEqual(["value"]);
        expect(normalizeSelectValue(42)).toEqual(["42"]);
    });

    it("normalizes arrays without changing their order", () => {
        expect(normalizeSelectValue(["one", "two", "three"])).toEqual(["one", "two", "three"]);
    });

    it("treats empty and missing values as no selection", () => {
        expect(normalizeSelectValue("")).toEqual([]);
        expect(normalizeSelectValue(null)).toEqual([]);
        expect(normalizeSelectValue(undefined)).toEqual([]);
    });
});
