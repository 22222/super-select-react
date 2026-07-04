import type { Option } from "../Option";
import { OptionCache } from "./OptionCache";
import { OptionSourceBufferedFetcher } from "./OptionSourceBufferedFetcher";
import { convertToOptionSourceError } from "./OptionSourceError";
import type { OptionSourceFetcher, OptionSourceFetchRequest } from "./OptionSourceFetcher";
import type { OptionSourceLike, OptionSourcePage, OptionSourcePageQuery } from "./OptionSourceLike";

/**
 * Parameters for constructing an OptionSource.
 */
export interface OptionSourceInit<TData = unknown> {
    /**
     * The function used to asynchronously fetch options.
     */
    fetch: OptionSourceFetcher<TData>;

    /**
     * If true, this will not use or populate a cache of options.
     * This is most useful if your fetch function has its own cache system or if the fetch is fast and efficient enough that caching is not needed.
     */
    noCache?: boolean;
}

/**
 * A source of asynchronously fetched options.
 */
export class OptionSource<TData = unknown> implements OptionSourceLike<TData> {
    private readonly innerFetcher: OptionSourceFetcher<TData>;
    private readonly fetcher: OptionSourceBufferedFetcher<TData>;
    private readonly cache?: OptionCache<TData>;

    /**
     * Constructs a new OptionSource from a config object.
     */
    public constructor(init: OptionSourceInit<TData>) {
        this.innerFetcher = init.fetch;
        this.fetcher = new OptionSourceBufferedFetcher(this.innerFetcher);
        this.cache = init.noCache ? undefined : new OptionCache();
    }

    /**
     * Gets a page of options for the specified query.
     */
    public async getOptionPage(query?: OptionSourcePageQuery<TData>): Promise<OptionSourcePage<TData>> {
        if (this.cache) {
            const cacheResult = this.cache.getByPageQuery(query);
            if (cacheResult) {
                return { ...cacheResult, nextPage: this.createFetchNextPage(cacheResult, query) };
            }
        }

        try {
            const queryResult: OptionSourcePage<TData> = await this.fetcher.fetch(query);
            if (this.cache) {
                this.cache.setQueryResult(queryResult, query);
            }
            return { ...queryResult, nextPage: this.createFetchNextPage(queryResult, query) };
        } catch (err) {
            throw convertToOptionSourceError(err);
        }
    }

    private createFetchNextPage(
        result: OptionSourcePage<TData>,
        query: OptionSourcePageQuery<TData> | undefined,
    ): OptionSourcePage<TData>["nextPage"] {
        if (!result || result.hasMore !== true) {
            return undefined;
        }

        const nextOffset = (query?.offset ?? 0) + result.options.length;
        const nextAfter = result.options.length > 0 ? result.options[result.options.length - 1] : undefined;
        const nextQuery: OptionSourcePageQuery<TData> = {
            search: query?.search,
            offset: nextOffset,
            after: nextAfter,
            limit: query?.limit,
        };
        return (options?: { limit?: number; signal?: AbortSignal }) =>
            this.getOptionPage({
                ...nextQuery,
                limit: options?.limit ?? nextQuery.limit,
                signal: options?.signal,
            });
    }

    /**
     * Resolves options for the specified values.
     */
    public async resolveValues(values: readonly string[], signal?: AbortSignal): Promise<Option<TData>[]> {
        if (!values || values.length === 0) {
            return [];
        }
        const uniqueValues = Array.from(new Set(values));
        let remainingValues: readonly string[] | undefined = uniqueValues;
        let optionsFromCache: Option<TData>[] | undefined;
        if (this.cache) {
            if (!this.cache.hasDefault()) {
                try {
                    const defaultQueryResult: OptionSourcePage<TData> = await this.fetcher.fetch({ signal });
                    this.cache.setQueryResult(defaultQueryResult, undefined);
                } catch (err) {
                    if (signal?.aborted) {
                        throw convertToOptionSourceError(err);
                    }
                    // A values-only request may still resolve the labels when the default page fails.
                }
            }

            const { options, missingValues } = this.cache.tryResolveValues(remainingValues);
            if (options) {
                optionsFromCache = options;
                remainingValues = missingValues;
            }
        }

        const newOptions: Option<TData>[] = [];
        if (remainingValues && remainingValues.length > 0) {
            const unresolvedValues = new Set(remainingValues);
            let query: OptionSourceFetchRequest<TData> = { values: remainingValues, signal };
            while (unresolvedValues.size > 0) {
                let queryResult: OptionSourcePage<TData>;
                try {
                    queryResult = await this.fetcher.fetch(query);
                } catch (err) {
                    throw convertToOptionSourceError(err);
                }

                const pageOptions = queryResult.options;
                let resolvedValueCount = 0;
                for (const option of pageOptions) {
                    if (unresolvedValues.delete(option.value)) {
                        newOptions.push(option);
                        resolvedValueCount++;
                    }
                }
                if (queryResult.hasMore !== true || resolvedValueCount === 0) {
                    break;
                }

                query = {
                    values: remainingValues,
                    offset: (query.offset ?? 0) + pageOptions.length,
                    after: pageOptions[pageOptions.length - 1],
                    signal,
                };
            }

            if (this.cache) {
                this.cache.set(newOptions);
            }
        }

        const optionsByValue = new Map([...(optionsFromCache ?? []), ...newOptions].map((option) => [option.value, option]));
        return uniqueValues.flatMap((value) => {
            const option = optionsByValue.get(value);
            return option ? [option] : [];
        });
    }

    /**
     * Returns all currently cached options.
     */
    public getCachedOptions(): Option<TData>[] | undefined {
        return this.cache?.getAll();
    }

    /**
     * Clears all cached options.
     */
    public clearCache(): void {
        this.cache?.clear();
    }

    /**
     * Returns an equivalent option source that does not use caching.
     */
    public withNoCache(): OptionSource<TData> {
        if (!this.cache) {
            return this;
        }
        return new OptionSource({
            fetch: this.innerFetcher,
            noCache: true,
        });
    }
}
