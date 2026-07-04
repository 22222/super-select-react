import { describe, expect, it, vi } from "vitest";

import { OptionSourceBufferedFetcher } from "./OptionSourceBufferedFetcher";
import type { OptionSourceFetchRequest, OptionSourceFetchResponse } from "./OptionSourceFetcher";

type Deferred<T> = {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason?: unknown) => void;
};

function createDeferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((innerResolve, innerReject) => {
        resolve = innerResolve;
        reject = innerReject;
    });

    return { promise, resolve, reject };
}

describe("OptionSourceBufferedFetcher", () => {
    it("drops duplicate pending requests into one network call", async () => {
        const deferred = createDeferred<OptionSourceFetchResponse<string>>();
        const fetcher = vi.fn(() => deferred.promise);
        const buffered = new OptionSourceBufferedFetcher<string>(fetcher);

        const first = buffered.fetch({ values: ["a", "b"] });
        const duplicate = buffered.fetch({ values: ["a", "b"] });

        await Promise.resolve();
        expect(fetcher).toHaveBeenCalledTimes(1);

        deferred.resolve({
            options: [
                { value: "a", label: "A" },
                { value: "b", label: "B" },
            ],
        });

        await expect(first).resolves.toEqual({
            options: [
                { value: "a", label: "A" },
                { value: "b", label: "B" },
            ],
        });
        await expect(duplicate).resolves.toEqual({
            options: [
                { value: "a", label: "A" },
                { value: "b", label: "B" },
            ],
        });
    });

    it("merges queued values-only requests into the queued pending query", async () => {
        const deferreds: Array<Deferred<OptionSourceFetchResponse<string>>> = [];
        const requests: OptionSourceFetchRequest<string>[] = [];

        const fetcher = vi.fn((request: OptionSourceFetchRequest<string>) => {
            requests.push({ ...request, values: request.values ? [...request.values] : undefined });
            const deferred = createDeferred<OptionSourceFetchResponse<string>>();
            deferreds.push(deferred);
            return deferred.promise;
        });

        const buffered = new OptionSourceBufferedFetcher<string>(fetcher);

        const first = buffered.fetch({ search: "first" });
        const second = buffered.fetch({ values: ["a", "b"] });
        const merged = buffered.fetch({ values: ["b", "c"] });

        await Promise.resolve();
        expect(fetcher).toHaveBeenCalledTimes(1);

        deferreds[0]?.resolve({ options: [{ value: "first", label: "First" }] });
        await first;
        await Promise.resolve();

        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(requests[1]?.values).toEqual(["a", "b", "c"]);

        deferreds[1]?.resolve({
            options: [
                { value: "a", label: "A" },
                { value: "b", label: "B" },
                { value: "c", label: "C" },
            ],
        });

        await expect(second).resolves.toMatchObject({
            options: [
                { value: "a", label: "A" },
                { value: "b", label: "B" },
            ],
        });
        await expect(merged).resolves.toMatchObject({
            options: [
                { value: "b", label: "B" },
                { value: "c", label: "C" },
            ],
        });
    });

    it("does not merge values-only requests into the currently running request", async () => {
        const deferreds: Array<Deferred<OptionSourceFetchResponse<string>>> = [];
        const fetcher = vi.fn(() => {
            const deferred = createDeferred<OptionSourceFetchResponse<string>>();
            deferreds.push(deferred);
            return deferred.promise;
        });

        const buffered = new OptionSourceBufferedFetcher<string>(fetcher);

        const first = buffered.fetch({ values: ["a"] });
        await Promise.resolve();
        const second = buffered.fetch({ values: ["b"] });

        expect(fetcher).toHaveBeenCalledTimes(1);

        deferreds[0]?.resolve({ options: [{ value: "a", label: "A" }] });
        await first;
        await Promise.resolve();

        expect(fetcher).toHaveBeenCalledTimes(2);

        deferreds[1]?.resolve({ options: [{ value: "b", label: "B" }] });
        await expect(second).resolves.toMatchObject({ options: [{ value: "b", label: "B" }] });
    });

    it("rejects only the aborted subscriber when a shared request still has active listeners", async () => {
        const fetcher = vi.fn((request: OptionSourceFetchRequest<string>) => {
            return new Promise<OptionSourceFetchResponse<string>>((resolve, reject) => {
                request.signal?.addEventListener("abort", () => reject(new DOMException("The operation was aborted.", "AbortError")), {
                    once: true,
                });
                queueMicrotask(() => {
                    resolve({ options: [{ value: "ab", label: "AB" }] });
                });
            });
        });

        const buffered = new OptionSourceBufferedFetcher<string>(fetcher);
        const firstController = new AbortController();
        const secondController = new AbortController();

        const first = buffered.fetch({ search: "ab", signal: firstController.signal });
        await Promise.resolve();
        const second = buffered.fetch({ search: "ab", signal: secondController.signal });

        firstController.abort();

        await expect(first).rejects.toMatchObject({ name: "AbortError" });
        await expect(second).resolves.toMatchObject({
            options: [{ value: "ab", label: "AB" }],
        });
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it("aborts the shared request once all subscribers have aborted", async () => {
        const fetcher = vi.fn(
            (request: OptionSourceFetchRequest<string>) =>
                new Promise<OptionSourceFetchResponse<string>>((_, reject) => {
                    request.signal?.addEventListener("abort", () => reject(new DOMException("The operation was aborted.", "AbortError")), {
                        once: true,
                    });
                }),
        );

        const buffered = new OptionSourceBufferedFetcher<string>(fetcher);
        const firstController = new AbortController();
        const secondController = new AbortController();

        const first = buffered.fetch({ search: "ab", signal: firstController.signal });
        const second = buffered.fetch({ search: "ab", signal: secondController.signal });

        await Promise.resolve();
        expect(fetcher).toHaveBeenCalledTimes(1);

        firstController.abort();
        await Promise.resolve();
        expect(fetcher.mock.calls[0]?.[0].signal?.aborted).toBe(false);

        secondController.abort();

        await expect(first).rejects.toMatchObject({ name: "AbortError" });
        await expect(second).rejects.toMatchObject({ name: "AbortError" });
        expect(fetcher.mock.calls[0]?.[0].signal?.aborted).toBe(true);
    });

    it("keeps a shared request alive when a non-abortable subscriber is still active", async () => {
        const fetcher = vi.fn((request: OptionSourceFetchRequest<string>) => {
            return new Promise<OptionSourceFetchResponse<string>>((resolve, reject) => {
                request.signal?.addEventListener("abort", () => reject(new DOMException("The operation was aborted.", "AbortError")), {
                    once: true,
                });
                queueMicrotask(() => {
                    resolve({ options: [{ value: "x", label: "X" }] });
                });
            });
        });

        const buffered = new OptionSourceBufferedFetcher<string>(fetcher);
        const abortable = new AbortController();

        const first = buffered.fetch({ search: "x" });
        await Promise.resolve();
        const second = buffered.fetch({ search: "x", signal: abortable.signal });

        abortable.abort();

        await expect(second).rejects.toMatchObject({ name: "AbortError" });
        await expect(first).resolves.toMatchObject({ options: [{ value: "x", label: "X" }] });
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it("immediately rejects a subscriber with an already-aborted signal without cancelling active subscribers", async () => {
        const fetcher = vi.fn((request: OptionSourceFetchRequest<string>) => {
            return new Promise<OptionSourceFetchResponse<string>>((resolve, reject) => {
                request.signal?.addEventListener("abort", () => reject(new DOMException("The operation was aborted.", "AbortError")), {
                    once: true,
                });
                queueMicrotask(() => {
                    resolve({ options: [{ value: "x", label: "X" }] });
                });
            });
        });

        const buffered = new OptionSourceBufferedFetcher<string>(fetcher);
        const alreadyAborted = new AbortController();
        alreadyAborted.abort();

        const first = buffered.fetch({ search: "x" });
        await Promise.resolve();
        const second = buffered.fetch({ search: "x", signal: alreadyAborted.signal });

        await expect(second).rejects.toMatchObject({ name: "AbortError" });
        await expect(first).resolves.toMatchObject({ options: [{ value: "x", label: "X" }] });
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it("filters and orders grouped options in values-only results per subscriber", async () => {
        const deferreds: Array<Deferred<OptionSourceFetchResponse<string>>> = [];
        const fetcher = vi.fn(() => {
            const deferred = createDeferred<OptionSourceFetchResponse<string>>();
            deferreds.push(deferred);
            return deferred.promise;
        });

        const buffered = new OptionSourceBufferedFetcher<string>(fetcher);

        const gate = buffered.fetch({ search: "gate" });
        const first = buffered.fetch({ values: ["b", "a"] });
        const second = buffered.fetch({ values: ["c"] });

        await Promise.resolve();
        expect(fetcher).toHaveBeenCalledTimes(1);

        deferreds[0]?.resolve({ options: [{ value: "gate", label: "Gate" }] });
        await gate;
        await Promise.resolve();
        expect(fetcher).toHaveBeenCalledTimes(2);

        deferreds[1]?.resolve({
            options: [
                { value: "a", label: "A", groupLabel: "G1" },
                { value: "b", label: "B", groupLabel: "G1" },
                { value: "c", label: "C", groupLabel: "G2" },
            ],
        });

        await expect(first).resolves.toMatchObject({
            options: [
                { value: "b", label: "B", groupLabel: "G1" },
                { value: "a", label: "A", groupLabel: "G1" },
            ],
        });
        await expect(second).resolves.toMatchObject({
            options: [{ value: "c", label: "C", groupLabel: "G2" }],
        });
    });

    it("runs fetch tasks sequentially", async () => {
        const deferreds: Array<Deferred<OptionSourceFetchResponse<string>>> = [];
        let activeRuns = 0;
        let maxActiveRuns = 0;

        const fetcher = vi.fn(() => {
            activeRuns += 1;
            maxActiveRuns = Math.max(maxActiveRuns, activeRuns);

            const deferred = createDeferred<OptionSourceFetchResponse<string>>();
            deferreds.push(deferred);
            return deferred.promise.finally(() => {
                activeRuns -= 1;
            });
        });

        const buffered = new OptionSourceBufferedFetcher<string>(fetcher);

        const first = buffered.fetch({ search: "one" });
        const second = buffered.fetch({ search: "two" });

        await Promise.resolve();
        expect(fetcher).toHaveBeenCalledTimes(1);

        deferreds[0]?.resolve({ options: [{ value: "one", label: "One" }] });
        await first;
        await Promise.resolve();

        expect(fetcher).toHaveBeenCalledTimes(2);
        deferreds[1]?.resolve({ options: [{ value: "two", label: "Two" }] });
        await second;

        expect(maxActiveRuns).toBe(1);
    });
});
