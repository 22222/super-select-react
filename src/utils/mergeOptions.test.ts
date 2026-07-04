import { describe, expect, it } from "vitest";

import { mergeOptions } from "./mergeOptions";

describe("mergeOptions", () => {
    it("preserves order while removing duplicate values", () => {
        const staticOptions = [
            { value: "a", label: "Static A" },
            { value: "a", label: "Duplicate A" },
            { value: "b", label: "Static B" },
        ];
        const asyncOptions = [
            { value: "b", label: "Async B" },
            { value: "c", label: "Async C" },
        ];

        expect(mergeOptions(staticOptions, asyncOptions)).toEqual([
            { value: "a", label: "Static A" },
            { value: "b", label: "Static B" },
            { value: "c", label: "Async C" },
        ]);
    });

    it("does not modify either input array", () => {
        const staticOptions = [{ value: "a", label: "A" }];
        const asyncOptions = [{ value: "b", label: "B" }];

        mergeOptions(staticOptions, asyncOptions);

        expect(staticOptions).toEqual([{ value: "a", label: "A" }]);
        expect(asyncOptions).toEqual([{ value: "b", label: "B" }]);
    });
});
