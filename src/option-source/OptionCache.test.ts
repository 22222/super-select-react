import { beforeEach, describe, expect, it } from "vitest";

import type { Option } from "../Option";
import { OptionCache } from "./OptionCache";

describe("OptionCache", () => {
    let cache: OptionCache<string>;

    beforeEach(() => {
        cache = new OptionCache();
    });

    describe("basic operations", () => {
        it("should cache and retrieve options", () => {
            const option: Option<string> = { value: "a", label: "Option A", data: "data-a" };
            cache.set([option]);

            expect(cache.getByValue("a")).toEqual(option);
        });

        it("should return undefined for missing values", () => {
            expect(cache.getByValue("missing")).toBeUndefined();
        });

        it("should clear all cached options", () => {
            const options = [
                { value: "a", label: "A", data: "data-a" },
                { value: "b", label: "B", data: "data-b" },
            ];
            cache.set(options);

            expect(cache.getByValue("a")).toBeDefined();
            cache.clear();
            expect(cache.getByValue("a")).toBeUndefined();
        });

        it("should return all cached options", () => {
            const options = [
                { value: "a", label: "A", data: "data-a" },
                { value: "b", label: "B", data: "data-b" },
            ];
            cache.set(options);

            const all = cache.getAll();
            expect(all).toHaveLength(2);
            expect(all.map((o) => o.value).sort()).toEqual(["a", "b"]);
        });
    });

    describe("query filtering", () => {
        it("should cache default page queries", () => {
            const option: Option<string> = { value: "default-item", label: "Default", data: "data" };
            cache.setQueryResult({ options: [option] }, {});
            expect(cache.hasDefault()).toBe(true);
            expect(cache.getByPageQuery(undefined)?.options.map((o) => o.value)).toEqual(["default-item"]);
        });

        it("should store value-cache entries for value lookups", () => {
            const option: Option<string> = { value: "x", label: "X", data: "data-x" };
            cache.set([option]);
            expect(cache.getByValue("x")?.value).toBe("x");
        });

        it("should not return default query cache for search queries", () => {
            const option: Option<string> = { value: "default-item", label: "Default", data: "data" };
            cache.setQueryResult({ options: [option] }, undefined);
            expect(cache.getByPageQuery({ search: "query" })).toBeUndefined();
        });

        it("should not return default query cache for offset queries", () => {
            const option: Option<string> = { value: "default-item", label: "Default", data: "data" };
            cache.setQueryResult({ options: [option] }, undefined);
            expect(cache.getByPageQuery({ offset: 10 })).toBeUndefined();
        });

        it("should not return default query cache for cursor queries", () => {
            const option: Option<string> = { value: "default-item", label: "Default", data: "data" };
            cache.setQueryResult({ options: [option] }, undefined);
            expect(cache.getByPageQuery({ after: { value: "cursor", label: "Cursor", data: "data-cursor" } })).toBeUndefined();
        });

        it("should return the default query cache when query is undefined", () => {
            const option: Option<string> = { value: "default-item", label: "Default", data: "data" };
            cache.setQueryResult({ options: [option] }, undefined);
            expect(cache.getByPageQuery(undefined)?.options.map((o) => o.value)).toEqual(["default-item"]);
        });
    });

    describe("capacity management", () => {
        it("should stop caching when capacity is reached", () => {
            const options: Option<string>[] = [];
            for (let i = 0; i < 1000; i++) {
                options.push({ value: `opt${i}`, label: `Option ${i}`, data: `data-${i}` });
            }
            cache.set(options);

            // All 1000 should be cached
            expect(cache.getByValue("opt999")?.value).toBe("opt999");
            expect(cache.getAll().length).toBe(1000);

            // Adding one more should not cache
            const extra: Option<string> = { value: "opt1000", label: "Over", data: "data-1000" };
            cache.set([extra]);
            expect(cache.getByValue("opt1000")).toBeUndefined();
            expect(cache.getAll().length).toBe(1000);
        });

        it("should cache partial batches when capacity is reached", () => {
            const options: Option<string>[] = [];
            // Fill to 998
            for (let i = 0; i < 998; i++) {
                options.push({ value: `opt${i}`, label: `Option ${i}`, data: `data-${i}` });
            }
            cache.set(options);

            // Add 5 more; should cache 2 (up to 1000), not all 5
            const batch = [
                { value: "opt998", label: "Option 998", data: "data-998" },
                { value: "opt999", label: "Option 999", data: "data-999" },
                { value: "opt1000", label: "Over 1", data: "data-1000" },
                { value: "opt1001", label: "Over 2", data: "data-1001" },
                { value: "opt1002", label: "Over 3", data: "data-1002" },
            ];
            cache.set(batch);

            expect(cache.getByValue("opt998")?.value).toBe("opt998");
            expect(cache.getByValue("opt999")?.value).toBe("opt999");
            expect(cache.getByValue("opt1000")).toBeUndefined();
            expect(cache.getByValue("opt1001")).toBeUndefined();
            expect(cache.getByValue("opt1002")).toBeUndefined();
            expect(cache.getAll().length).toBe(1000);
        });
    });

    describe("single option vs array", () => {
        it("should accept a single option wrapped as array", () => {
            const option: Option<string> = { value: "single", label: "Single", data: "data" };
            cache.set([option]);
            expect(cache.getByValue("single")?.value).toBe("single");
        });

        it("should accept an array of options", () => {
            const options = [
                { value: "a", label: "A", data: "data-a" },
                { value: "b", label: "B", data: "data-b" },
            ];
            cache.set(options);
            expect(cache.getByValue("a")?.value).toBe("a");
            expect(cache.getByValue("b")?.value).toBe("b");
        });

        it("should handle empty array", () => {
            cache.set([]);
            expect(cache.getAll().length).toBe(0);
        });
    });

    describe("values resolution", () => {
        it("should split resolved options and missing values", () => {
            cache.set([
                { value: "a", label: "A", data: "data-a" },
                { value: "b", label: "B", data: "data-b" },
            ]);

            const result = cache.tryResolveValues(["a", "c"]);
            expect(result.options?.map((option) => option.value)).toEqual(["a"]);
            expect(result.missingValues).toEqual(["c"]);
        });
    });
});
