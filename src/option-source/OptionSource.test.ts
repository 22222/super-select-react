import { afterEach, describe, expect, it, vi } from "vitest";

import type { Option } from "../Option";
import { OptionSource } from "./OptionSource";
import { isOptionSourceErrorLike, OptionSourceError } from "./OptionSourceError";

function createOption(value: string): Option<string> {
    return {
        value,
        label: `Option ${value}`,
        data: `data-${value}`,
    };
}

describe("OptionSource concurrent consumers", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("does not mutate pages returned by the fetcher", async () => {
        const fetchedPage = Object.freeze({
            options: [createOption("a")],
            hasMore: true,
        });
        const source = new OptionSource<string>({ fetch: () => Promise.resolve(fetchedPage) });

        const result = await source.getOptionPage();

        expect(result).not.toBe(fetchedPage);
        expect(result.nextPage).toBeTypeOf("function");
        expect(fetchedPage).toEqual({ options: [createOption("a")], hasMore: true });
    });

    it("dedupes three concurrent default-page fetches into one network call", async () => {
        let resolveDefaultFetch: ((value: { options: Option<string>[] }) => void) | undefined;
        const defaultFetchPromise = new Promise<{ options: Option<string>[] }>((resolve) => {
            resolveDefaultFetch = resolve;
        });

        const fetcher = vi.fn((request: { values?: readonly string[] }) => {
            if (!request.values) {
                return defaultFetchPromise;
            }

            return Promise.resolve({ options: request.values.map((value) => createOption(value)) });
        });

        const source = new OptionSource<string>({
            fetch: fetcher,
        });

        const consumer1 = source.getOptionPage();
        const consumer2 = source.getOptionPage();
        const consumer3 = source.getOptionPage();

        await Promise.resolve();

        expect(fetcher).toHaveBeenCalledTimes(1);

        resolveDefaultFetch?.({
            options: [createOption("a"), createOption("b")],
        });

        const [result1, result2, result3] = await Promise.all([consumer1, consumer2, consumer3]);

        expect(result1.options.map((option) => option.value)).toEqual(["a", "b"]);
        expect(result2.options.map((option) => option.value)).toEqual(["a", "b"]);
        expect(result3.options.map((option) => option.value)).toEqual(["a", "b"]);
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it("merges overlapping concurrent resolveValues calls into one combined fetch", async () => {
        const fetcher = vi.fn((request: { values?: readonly string[] }) => {
            if (!request.values) {
                return Promise.resolve({ options: [] });
            }

            return Promise.resolve({ options: request.values.map((value) => createOption(value)) });
        });

        const source = new OptionSource<string>({ fetch: fetcher });

        const consumer1 = source.resolveValues(["a", "b"]);
        const consumer2 = source.resolveValues(["b", "c"]);
        const consumer3 = source.resolveValues(["c", "d"]);

        expect(fetcher).toHaveBeenCalledTimes(0);

        const [result1, result2, result3] = await Promise.all([consumer1, consumer2, consumer3]);

        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(fetcher).toHaveBeenNthCalledWith(1, expect.objectContaining({ values: undefined }));
        expect(fetcher).toHaveBeenNthCalledWith(2, expect.objectContaining({ values: ["a", "b", "c", "d"] }));

        expect(result1.map((option) => option.value)).toEqual(["a", "b"]);
        expect(result2.map((option) => option.value)).toEqual(["b", "c"]);
        expect(result3.map((option) => option.value)).toEqual(["c", "d"]);
    });

    it("loads default page first, then fetches only missing values", async () => {
        const fetcher = vi.fn((request: { values?: readonly string[] }) => {
            if (!request.values) {
                return Promise.resolve({
                    options: [createOption("a"), createOption("b")],
                });
            }

            return Promise.resolve({
                options: request.values.map((value) => createOption(value)),
            });
        });

        const source = new OptionSource<string>({
            fetch: fetcher,
        });

        const resultPromise = source.resolveValues(["b", "c", "d"]);
        const result = await resultPromise;

        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(fetcher).toHaveBeenNthCalledWith(1, expect.objectContaining({ values: undefined }));
        expect(fetcher).toHaveBeenNthCalledWith(2, expect.objectContaining({ values: ["c", "d"] }));
        expect(result.map((option) => option.value)).toEqual(["b", "c", "d"]);
    });

    it("skips extra value fetch when default page already contains all requested values", async () => {
        const fetcher = vi.fn((request: { values?: readonly string[] }) => {
            if (!request.values) {
                return Promise.resolve({
                    options: [createOption("a"), createOption("b"), createOption("c")],
                });
            }

            return Promise.resolve({
                options: request.values.map((value) => createOption(value)),
            });
        });

        const source = new OptionSource<string>({
            fetch: fetcher,
        });

        const resultPromise = source.resolveValues(["b", "c"]);
        const result = await resultPromise;

        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(result.map((option) => option.value)).toEqual(["b", "c"]);
    });

    it("loads every page when resolving selected values", async () => {
        const fetcher = vi.fn(({ values, offset = 0, limit = 2 }: { values?: readonly string[]; offset?: number; limit?: number }) => {
            const matchingOptions = (values ?? []).map((value) => createOption(value));
            return Promise.resolve({
                options: matchingOptions.slice(offset, offset + limit),
                hasMore: offset + limit < matchingOptions.length,
            });
        });
        const source = new OptionSource<string>({ fetch: fetcher, noCache: true });

        const result = await source.resolveValues(["a", "b", "c"]);

        expect(result.map((option) => option.value)).toEqual(["a", "b", "c"]);
        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(fetcher).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                values: ["a", "b", "c"],
                offset: 2,
                after: expect.objectContaining({ value: "b" }),
            }),
        );
    });

    it("stops resolving selected values when a page makes no progress", async () => {
        let fetchCount = 0;
        const fetcher = vi.fn(() => {
            fetchCount += 1;
            if (fetchCount > 2) {
                throw new Error("Selected-value pagination did not stop");
            }
            return Promise.resolve({ options: [createOption("a")], hasMore: true });
        });
        const source = new OptionSource<string>({ fetch: fetcher, noCache: true });

        const result = await source.resolveValues(["a", "b"]);

        expect(result.map((option) => option.value)).toEqual(["a"]);
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it("lets the caller cancel a stale in-flight search via AbortSignal", async () => {
        const fetcher = vi.fn((request: { search?: string; signal?: AbortSignal }) => {
            if (request.search === "a") {
                return new Promise<{ options: Option<string>[] }>((_resolve, reject) => {
                    request.signal?.addEventListener("abort", () => {
                        reject(new DOMException("The operation was aborted.", "AbortError"));
                    });
                });
            }

            return Promise.resolve({
                options: [createOption("ab")],
            });
        });

        const source = new OptionSource<string>({ fetch: fetcher });
        const firstController = new AbortController();

        const first = source.getOptionPage({ search: "a", signal: firstController.signal });
        await Promise.resolve();
        const second = source.getOptionPage({ search: "ab" });
        firstController.abort();

        await expect(first).rejects.toMatchObject({ name: "AbortError" });
        await expect(second).resolves.toMatchObject({
            options: [expect.objectContaining({ value: "ab" })],
        });
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it("runs fetches sequentially across multiple consumers (only one active at a time)", async () => {
        let activeFetches = 0;
        let maxActiveFetches = 0;

        const fetcher = vi.fn(
            () =>
                new Promise<{ options: Option<string>[] }>((resolve) => {
                    activeFetches += 1;
                    maxActiveFetches = Math.max(maxActiveFetches, activeFetches);
                    // Resolve synchronously so the chain progresses as fast as possible
                    activeFetches -= 1;
                    resolve({ options: [createOption("ok")] });
                }),
        );

        const source = new OptionSource<string>({ fetch: fetcher });

        const [first, second] = await Promise.all([source.getOptionPage({ search: "one" }), source.getOptionPage({ search: "two" })]);

        expect(first.options[0].value).toBe("ok");
        expect(second.options[0].value).toBe("ok");
        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(maxActiveFetches).toBe(1);
    });

    it("wraps fetch errors in OptionSourceError and keeps the original cause", async () => {
        const networkError = new Error("Network failed");
        const fetcher = vi.fn(() => Promise.reject(networkError));
        const source = new OptionSource<string>({ fetch: fetcher });

        // Attach the rejection handler in the same tick to avoid unhandled rejection warnings
        const result = source.getOptionPage({ search: "abc" });
        await expect(result).rejects.toMatchObject({
            name: "OptionSourceError",
            message: "Network failed",
            cause: networkError,
        });
    });

    it("keeps user-defined error metadata when fetch throws an OptionSourceError-like object", async () => {
        const fetcher = vi.fn(() =>
            Promise.reject({
                message: "Rate limited",
                httpStatus: 429,
                userMessage: "Too many requests. Please wait and retry.",
            }),
        );
        const source = new OptionSource<string>({ fetch: fetcher });

        const result = source.getOptionPage({ search: "abc" });
        await expect(result).rejects.toMatchObject({
            name: "OptionSourceError",
            message: "Rate limited",
            httpStatus: 429,
            code: "rate-limited",
            userMessage: "Too many requests. Please wait and retry.",
        });
    });

    it("does not override explicit code when both code and httpStatus are provided", async () => {
        const fetcher = vi.fn(() =>
            Promise.reject({
                message: "Fetch failed",
                httpStatus: 500,
                code: "network",
            }),
        );
        const source = new OptionSource<string>({ fetch: fetcher });

        const result = source.getOptionPage({ search: "abc" });
        await expect(result).rejects.toMatchObject({
            name: "OptionSourceError",
            message: "Fetch failed",
            httpStatus: 500,
            code: "network",
        });
    });

    it("recognizes OptionSourceError-like values via type guard", async () => {
        const fetcher = vi.fn(() => Promise.reject({ message: "Unauthorized", httpStatus: 401 }));
        const source = new OptionSource<string>({ fetch: fetcher });

        const result = source.getOptionPage({ search: "abc" });
        await expect(result).rejects.toSatisfy((error: unknown) => {
            if (!isOptionSourceErrorLike(error)) {
                return false;
            }

            return error.message === "Unauthorized";
        });
    });

    it("calls fetch for default-page query when no defaultQuery is configured", async () => {
        const fetcher = vi.fn(() => Promise.resolve({ options: [createOption("direct-default-page")] }));
        const source = new OptionSource<string>({ fetch: fetcher });

        const result = await source.getOptionPage();

        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(result.options.map((option) => option.value)).toEqual(["direct-default-page"]);
    });

    it("preserves pagination when serving a smaller page from the default-page cache", async () => {
        const allOptions = [createOption("a"), createOption("b"), createOption("c"), createOption("d")];
        const fetcher = vi.fn(({ offset = 0, limit = allOptions.length }: { offset?: number; limit?: number }) =>
            Promise.resolve({
                options: allOptions.slice(offset, offset + limit),
                hasMore: offset + limit < allOptions.length,
            }),
        );
        const source = new OptionSource<string>({ fetch: fetcher });

        await source.getOptionPage();
        const firstPage = await source.getOptionPage({ limit: 2 });

        expect(firstPage.options.map((option) => option.value)).toEqual(["a", "b"]);
        expect(firstPage.hasMore).toBe(true);
        expect(firstPage.nextPage).toBeDefined();

        const secondPage = await firstPage.nextPage?.();
        expect(secondPage?.options.map((option) => option.value)).toEqual(["c", "d"]);
        expect(secondPage?.hasMore).toBe(false);
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it("fetches an empty default page once per request without caching it", async () => {
        const fetcher = vi.fn(() => Promise.resolve({ options: [] }));
        const source = new OptionSource<string>({ fetch: fetcher });

        await expect(source.getOptionPage()).resolves.toMatchObject({ options: [] });
        await expect(source.getOptionPage()).resolves.toMatchObject({ options: [] });

        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it("does not fetch options when resolving an empty value list", async () => {
        const fetcher = vi.fn(() => Promise.resolve({ options: [] }));
        const source = new OptionSource<string>({ fetch: fetcher });

        await expect(source.resolveValues([])).resolves.toEqual([]);

        expect(fetcher).not.toHaveBeenCalled();
    });

    it("cancels the default-page request used to resolve selected values", async () => {
        let resolveDefaultFetch: ((value: { options: Option<string>[] }) => void) | undefined;
        let defaultFetchSignal: AbortSignal | undefined;
        const fetcher = vi.fn((request: { values?: readonly string[]; signal?: AbortSignal }) => {
            if (request.values) {
                return Promise.resolve({ options: request.values.map((value) => createOption(value)) });
            }

            defaultFetchSignal = request.signal;
            return new Promise<{ options: Option<string>[] }>((resolve) => {
                resolveDefaultFetch = resolve;
            });
        });
        const source = new OptionSource<string>({ fetch: fetcher });
        const controller = new AbortController();

        const result = source.resolveValues(["a"], controller.signal);
        await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
        controller.abort();

        expect(defaultFetchSignal?.aborted).toBe(true);
        resolveDefaultFetch?.({ options: [] });
        await expect(result).rejects.toMatchObject({ name: "AbortError" });
    });

    it("does not read or populate caches in a no-cache copy", async () => {
        let revision = 0;
        const fetcher = vi.fn((request: { values?: readonly string[] }) => {
            revision += 1;
            const values = request.values ?? ["default"];
            return Promise.resolve({
                options: values.map((value) => ({
                    ...createOption(value),
                    label: `Option ${value} revision ${revision}`,
                })),
            });
        });
        const source = new OptionSource<string>({ fetch: fetcher });

        await expect(source.getOptionPage()).resolves.toMatchObject({
            options: [expect.objectContaining({ label: "Option default revision 1" })],
        });

        const noCacheSource = source.withNoCache();
        await expect(noCacheSource.getOptionPage()).resolves.toMatchObject({
            options: [expect.objectContaining({ label: "Option default revision 2" })],
        });
        await expect(noCacheSource.getOptionPage()).resolves.toMatchObject({
            options: [expect.objectContaining({ label: "Option default revision 3" })],
        });
        await expect(noCacheSource.resolveValues(["a"])).resolves.toMatchObject([
            expect.objectContaining({ label: "Option a revision 4" }),
        ]);
        await expect(noCacheSource.resolveValues(["a"])).resolves.toMatchObject([
            expect.objectContaining({ label: "Option a revision 5" }),
        ]);

        expect(noCacheSource.getCachedOptions()).toBeUndefined();
        expect(fetcher).toHaveBeenCalledTimes(5);
    });

    it("propagates resolveValues fetch failures to all queued consumers", async () => {
        const networkError = new Error("Lookup failed");
        const fetcher = vi.fn((request: { values?: readonly string[] }) => {
            if (request.values) {
                return Promise.reject(networkError);
            }

            return Promise.resolve({ options: [] });
        });

        const source = new OptionSource<string>({ fetch: fetcher });

        const consumer1 = source.resolveValues(["a", "b"]);
        const consumer2 = source.resolveValues(["b", "c"]);
        const consumer3 = source.resolveValues(["d"]);

        const allConsumers = Promise.allSettled([consumer1, consumer2, consumer3]);

        const results = await allConsumers;

        expect(fetcher).toHaveBeenCalledTimes(2);
        const rejectedResults = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");

        expect(rejectedResults).toHaveLength(3);
        for (const result of rejectedResults) {
            expect(result.reason).toBeInstanceOf(OptionSourceError);
            expect(result.reason.cause).toBe(networkError);
        }
    });
});
