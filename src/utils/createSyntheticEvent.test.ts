import { describe, expect, it, vi } from "vitest";

import { createChangeEvent, createHTMLSelectElementSubsetTarget, createInputEvent, retargetDomEventHandlers } from "./createSyntheticEvent";

describe("createSyntheticEvent", () => {
    it("creates a select target for a multiple value", () => {
        const target = createHTMLSelectElementSubsetTarget({ value: ["a", "b"], name: "choices" });
        const selectedValues: string[] = [];
        for (const option of target.selectedOptions) {
            selectedValues.push(option.value);
        }

        expect(target.value).toBe("a");
        expect(target.name).toBe("choices");
        expect(target.selectedOptions[0]?.value).toBe("a");
        expect(target.selectedOptions[1]?.value).toBe("b");
        expect(target.selectedOptions.item(0)?.value).toBe("a");
        expect(selectedValues).toEqual(["a", "b"]);
    });

    it("tracks default prevention and propagation", () => {
        const target = createHTMLSelectElementSubsetTarget({ value: "a" });
        const event = createChangeEvent(target);

        event.preventDefault();
        event.stopPropagation();

        expect(event.defaultPrevented).toBe(true);
        expect(event.isDefaultPrevented()).toBe(true);
        expect(event.isPropagationStopped()).toBe(true);
        expect(event.nativeEvent.returnValue).toBe(false);
    });

    it("creates change and input events with the expected values", () => {
        const target = createHTMLSelectElementSubsetTarget({ value: "a" });

        expect(createChangeEvent(target)).toMatchObject({ type: "change", target });
        expect(createInputEvent(target, { data: "a" })).toMatchObject({ type: "input", target, data: "a" });
    });

    it("retargets DOM handlers to the select-compatible target", () => {
        const target = createHTMLSelectElementSubsetTarget({ value: "a" });
        const onClick = vi.fn();
        const handlers = retargetDomEventHandlers(target, { onClick });
        const sourceTarget = createHTMLSelectElementSubsetTarget({ value: "source" });

        handlers.onClick?.(createChangeEvent(sourceTarget) as never);

        expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ target, currentTarget: target }));
    });
});
