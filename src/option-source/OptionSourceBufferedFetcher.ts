import type { OptionSourceFetcher, OptionSourceFetchRequest, OptionSourceFetchResponse } from "./OptionSourceFetcher";

type OptionSourceQuery<TData = unknown> = Omit<OptionSourceFetchRequest<TData>, "signal">;

interface PendingQueryRunSubscriber<TData> {
    query: OptionSourceQuery<TData>;
    signal?: AbortSignal;
    aborted: boolean;
}

interface PendingQueryRun<TData> {
    query: OptionSourceFetchRequest<TData>;
    promise: Promise<OptionSourceFetchResponse<TData>>;
    abortController: AbortController;
    subscribers: Set<PendingQueryRunSubscriber<TData>>;
    started: boolean;
}

/**
 * An internal class that buffers and deduplicates fetch requests for an OptionSource.
 */
export class OptionSourceBufferedFetcher<TData = unknown> {
    private readonly fetcher: OptionSourceFetcher<TData>;
    private runChain: Promise<void> = Promise.resolve();
    private pendingQueryRuns: PendingQueryRun<TData>[] = [];

    public constructor(fetcher: OptionSourceFetcher<TData>) {
        this.fetcher = fetcher;
    }

    public fetch(query: OptionSourceFetchRequest<TData> | undefined): Promise<OptionSourceFetchResponse<TData>> {
        const callerSignal = query?.signal;
        const normalizedQuery: OptionSourceQuery<TData> = {
            ...query,
            values: query?.values ? [...query.values] : undefined,
        };

        for (let pendingQueryRunIndex = 0; pendingQueryRunIndex < this.pendingQueryRuns.length; pendingQueryRunIndex++) {
            const request = this.pendingQueryRuns[pendingQueryRunIndex];
            const leftValues = request.query.values;
            const rightValues = normalizedQuery.values;

            let sameValues = false;
            if (leftValues === rightValues) {
                sameValues = true;
            } else if (leftValues && rightValues && leftValues.length === rightValues.length) {
                sameValues = true;
                for (let i = 0; i < leftValues.length; i++) {
                    if (leftValues[i] !== rightValues[i]) {
                        sameValues = false;
                        break;
                    }
                }
            }

            const isExactDuplicate =
                request.query.search === normalizedQuery.search &&
                request.query.offset === normalizedQuery.offset &&
                request.query.after === normalizedQuery.after &&
                request.query.limit === normalizedQuery.limit &&
                sameValues;
            if (isExactDuplicate) {
                return this.createSubscriberPromise(request, normalizedQuery, callerSignal);
            }

            const requestIsValuesOnly =
                !!request.query.values &&
                !request.query.search &&
                request.query.offset === undefined &&
                request.query.after === undefined &&
                request.query.limit === undefined;
            const queryIsValuesOnly =
                !!normalizedQuery.values &&
                !normalizedQuery.search &&
                normalizedQuery.offset === undefined &&
                normalizedQuery.after === undefined &&
                normalizedQuery.limit === undefined;

            if ((pendingQueryRunIndex > 0 || !request.started) && requestIsValuesOnly && queryIsValuesOnly) {
                const mergedValues = Array.from(
                    new Set([...(request.query.values as readonly string[]), ...(normalizedQuery.values as readonly string[])]),
                );
                if (mergedValues.length !== (request.query.values as readonly string[]).length) {
                    request.query = { values: mergedValues };
                }
                return this.createSubscriberPromise(request, normalizedQuery, callerSignal);
            }
        }

        const abortController = new AbortController();
        const pendingRequest: PendingQueryRun<TData> = {
            query: normalizedQuery,
            promise: Promise.resolve({ options: [] }),
            abortController,
            subscribers: new Set(),
            started: false,
        };

        const promise = this.runSequentially(() => {
            pendingRequest.started = true;
            return this.fetcher({ ...pendingRequest.query, signal: abortController.signal });
        });
        pendingRequest.promise = promise;

        this.pendingQueryRuns.push(pendingRequest);

        const cleanup = (): void => {
            const index = this.pendingQueryRuns.findIndex((request) => request.promise === promise);
            if (index >= 0) {
                this.pendingQueryRuns.splice(index, 1);
            }
        };
        promise.then(cleanup, cleanup);

        return this.createSubscriberPromise(pendingRequest, normalizedQuery, callerSignal);
    }

    private createSubscriberPromise(
        request: PendingQueryRun<TData>,
        query: OptionSourceQuery<TData>,
        signal: AbortSignal | undefined,
    ): Promise<OptionSourceFetchResponse<TData>> {
        const subscriber: PendingQueryRunSubscriber<TData> = {
            query,
            signal,
            aborted: false,
        };

        request.subscribers.add(subscriber);

        let abortListener: (() => void) | undefined;
        const abortPromise = new Promise<never>((_, reject) => {
            if (!signal) {
                return;
            }

            abortListener = () => {
                subscriber.aborted = true;
                this.abortUnderlyingRequestIfUnused(request);
                reject(new DOMException("The operation was aborted.", "AbortError"));
            };

            if (signal.aborted) {
                abortListener();
                return;
            }

            signal.addEventListener("abort", abortListener, { once: true });
        });

        const resultPromise = (signal ? Promise.race([request.promise, abortPromise]) : request.promise)
            .then((result) => this.filterResultForSubscriber(result, subscriber.query))
            .finally(() => {
                request.subscribers.delete(subscriber);
                if (signal && abortListener) {
                    signal.removeEventListener("abort", abortListener);
                }
                this.abortUnderlyingRequestIfUnused(request);
            });

        return resultPromise;
    }

    private filterResultForSubscriber(
        result: OptionSourceFetchResponse<TData>,
        query: OptionSourceQuery<TData>,
    ): OptionSourceFetchResponse<TData> {
        if (!query.values || query.search || query.offset !== undefined || query.after !== undefined || query.limit !== undefined) {
            return result;
        }

        const requestedValues = new Set(query.values);
        const requestedOrder = new Map(query.values.map((value, index) => [value, index]));

        return {
            ...result,
            options: result.options
                .filter((option) => requestedValues.has(option.value))
                .sort((left, right) => (requestedOrder.get(left.value) ?? 0) - (requestedOrder.get(right.value) ?? 0)),
        };
    }

    private abortUnderlyingRequestIfUnused(request: PendingQueryRun<TData>): void {
        if (request.subscribers.size === 0) {
            request.abortController.abort();
            return;
        }

        const allSubscribersAborted = Array.from(request.subscribers).every((subscriber) => subscriber.aborted);
        if (allSubscribersAborted) {
            request.abortController.abort();
        }
    }

    private runSequentially<T>(task: () => Promise<T>): Promise<T> {
        const run = this.runChain.then(task, task);
        this.runChain = run.then(
            () => undefined,
            () => undefined,
        );
        return run;
    }
}
