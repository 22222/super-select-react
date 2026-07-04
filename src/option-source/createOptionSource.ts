import { OptionSource, type OptionSourceInit } from "./OptionSource";
import type { OptionSourceFetcher } from "./OptionSourceFetcher";
import type { OptionSourceLike } from "./OptionSourceLike";

/**
 * Creates an option source from a fetcher, configuration object, or existing option source.
 */
export function createOptionSource<TData = unknown>(
    init: OptionSourceLike<TData> | OptionSourceInit<TData> | OptionSourceFetcher<TData>,
): OptionSourceLike<TData> {
    if (typeof init === "function") {
        return new OptionSource<TData>({ fetch: init });
    }
    if (isOptionSourceLike(init)) {
        return init;
    }
    if (isOptionSourceInit(init)) {
        return new OptionSource<TData>(init);
    }
    throw new Error("Invalid option source init.");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isOptionSourceLike(value: unknown): value is OptionSourceLike<any> {
    if (!value || typeof value !== "object") {
        return false;
    }
    return (
        "getOptionPage" in value &&
        typeof value.getOptionPage === "function" &&
        "resolveValues" in value &&
        typeof value.resolveValues === "function"
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isOptionSourceInit(value: unknown): value is OptionSourceInit<any> {
    if (!value || typeof value !== "object") {
        return false;
    }
    return "fetch" in value && typeof value.fetch === "function";
}
