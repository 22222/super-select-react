import type React from "react";

import type { HTMLOptionElementSubset, HTMLOptionsCollectionSubset, HTMLSelectElementSubset } from "../SelectProps";

/**
 * Creates an event target containing the supported subset of an HTML select element.
 */
export function createHTMLSelectElementSubsetTarget(init: HTMLSelectElementSubsetInit): HTMLSelectElementSubsetTarget {
    const { value, disabled, ...targetBase } = init;

    const target: EventTarget & HTMLSelectElementSubset = {
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => true,
        ...generateHTMLSelectElementSubsetTargetValues(value),
        disabled: disabled ?? false,
        ...targetBase,
    };
    return target;
}

interface HTMLSelectElementSubsetInit extends Omit<HTMLSelectElementSubset, "value" | "selectedOptions"> {
    value?: string | readonly string[];
}

type HTMLSelectElementSubsetTarget = HTMLSelectElementSubset & EventTarget;

function generateHTMLSelectElementSubsetTargetValues(value: string | readonly string[] | undefined) {
    let targetValue: string;
    const selectedOptionElements: HTMLOptionElementSubset[] = [];
    if (typeof value === "string") {
        targetValue = value;
        selectedOptionElements.push({
            value,
            label: "",
            selected: true,
            disabled: false,
        });
    } else if (Array.isArray(value)) {
        targetValue = value[0] ?? "";
        selectedOptionElements.push(
            ...value.map((v) => ({
                value: v,
                label: "",
                selected: true,
                disabled: false,
            })),
        );
    } else {
        targetValue = "";
    }

    const selectedOptionsCollection: HTMLOptionsCollectionSubset = Object.assign(selectedOptionElements, {
        selectedIndex: selectedOptionElements.length > 0 ? 0 : -1,
        item: (i: number) => selectedOptionElements[i] ?? null,
        namedItem: () => null,
        length: selectedOptionElements.length,
        [Symbol.iterator]: selectedOptionElements[Symbol.iterator].bind(selectedOptionElements),
    });

    return { value: targetValue, selectedOptions: selectedOptionsCollection };
}

/**
 * Creates a React change event for a select element subset.
 */
export function createChangeEvent(
    target: HTMLSelectElementSubsetTarget,
): React.ChangeEvent<HTMLSelectElementSubset, HTMLSelectElementSubset> {
    const syntheticEvent = createSyntheticEvent("change", target);
    const changeEvent = syntheticEvent as React.ChangeEvent<HTMLSelectElementSubset, HTMLSelectElementSubset>;
    return changeEvent;
}

/**
 * Creates a React input event for a select element subset.
 */
export function createInputEvent(target: HTMLSelectElementSubsetTarget, init: { data: string }): React.InputEvent<HTMLSelectElementSubset> {
    const syntheticEvent = createSyntheticEvent("input", target);
    const nativeInputEvent = {
        ...syntheticEvent.nativeEvent,
        data: init.data,
        dataTransfer: null,
        detail: 0,
        inputType: "insertText",
        isComposing: false,
        view: null,
        which: 0,
        getTargetRanges: () => [] as StaticRange[],
        initUIEvent: () => undefined,
    } satisfies InputEvent;

    const inputEvent = {
        ...syntheticEvent,
        nativeEvent: nativeInputEvent,
        data: init.data,
    } satisfies React.InputEvent<HTMLSelectElementSubset>;

    return inputEvent;
}

/**
 * Creates a React invalid event for a select element subset.
 */
export function createInvalidEvent(target: HTMLSelectElementSubsetTarget): React.InvalidEvent<HTMLSelectElementSubset> {
    const syntheticEvent = createSyntheticEvent("invalid", target);
    const invalidEvent: React.InvalidEvent<HTMLSelectElementSubset> = syntheticEvent;
    return invalidEvent;
}

/**
 * Creates a React synthetic event for a select element subset.
 */
function createSyntheticEvent(type: string, target: HTMLSelectElementSubsetTarget): React.SyntheticEvent<HTMLSelectElementSubset> {
    let currentType = type;
    let defaultPrevented = false;
    let bubbles = true;
    let cancelable = true;

    const nativeEvent: Event = {
        get type() {
            return currentType;
        },
        currentTarget: target,
        target,
        get cancelable() {
            return cancelable;
        },
        get defaultPrevented() {
            return defaultPrevented;
        },
        preventDefault() {
            defaultPrevented = true;
        },
        get bubbles() {
            return bubbles;
        },
        stopPropagation() {
            bubbles = false;
        },
        eventPhase: Event.NONE,
        isTrusted: true,
        timeStamp: Date.now(),
        get cancelBubble() {
            return !bubbles;
        },
        set cancelBubble(value: boolean) {
            bubbles = !value;
        },
        composed: false,
        get returnValue() {
            return !defaultPrevented;
        },
        set returnValue(value: boolean) {
            defaultPrevented = !value;
        },
        srcElement: target,
        composedPath() {
            return [target];
        },
        initEvent(newType: string, newBubbles?: boolean, newCancelable?: boolean) {
            currentType = newType;
            bubbles = newBubbles ?? false;
            cancelable = newCancelable ?? true;
        },
        stopImmediatePropagation() {
            bubbles = false;
        },
        AT_TARGET: Event.AT_TARGET,
        BUBBLING_PHASE: Event.BUBBLING_PHASE,
        CAPTURING_PHASE: Event.CAPTURING_PHASE,
        NONE: Event.NONE,
    };
    const syntheticEvent: React.SyntheticEvent<HTMLSelectElementSubset> = {
        get type() {
            return currentType;
        },
        currentTarget: target,
        target,
        get cancelable() {
            return cancelable;
        },
        get defaultPrevented() {
            return defaultPrevented;
        },
        preventDefault() {
            defaultPrevented = true;
        },
        get bubbles() {
            return bubbles;
        },
        stopPropagation() {
            bubbles = false;
        },
        eventPhase: Event.NONE,
        isTrusted: true,
        timeStamp: nativeEvent.timeStamp,
        nativeEvent,
        isDefaultPrevented() {
            return defaultPrevented;
        },
        isPropagationStopped() {
            return !bubbles;
        },
        persist: () => undefined,
    };
    return syntheticEvent;
}

/**
 * Returns an event whose target and current target are replaced with the provided target.
 */
function retargetEvent<TTarget extends EventTarget = HTMLSelectElementSubsetTarget>(
    sourceEvent: React.SyntheticEvent<HTMLElement>,
    target: TTarget,
): React.SyntheticEvent<TTarget> {
    const retargetedEvent: React.SyntheticEvent<TTarget> = Object.create(sourceEvent);
    Object.defineProperties(retargetedEvent, {
        currentTarget: {
            get() {
                return target;
            },
        },
        target: {
            get() {
                return target;
            },
        },
    });

    return retargetedEvent;
}

/**
 * Retargets a collection of React DOM event handlers to the provided target.
 */
export function retargetDomEventHandlers<TSource, TElement extends HTMLElement>(
    target: TSource & EventTarget,
    handlers: Partial<React.DOMAttributes<TSource>>,
): Partial<React.DOMAttributes<TElement>> {
    const retargetedHandlers: Partial<React.DOMAttributes<TElement>> = {};
    for (const key of Object.keys(handlers) as Array<keyof React.DOMAttributes<TSource>>) {
        const handler = handlers[key];
        if (typeof handler !== "function") {
            continue;
        }

        retargetedHandlers[key] = ((sourceEvent: React.SyntheticEvent<HTMLElement>) => {
            (handler as (event: React.SyntheticEvent<TSource>) => void)(retargetEvent(sourceEvent, target));
        }) as never;
    }

    return retargetedHandlers;
}
