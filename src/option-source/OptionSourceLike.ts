import type { Option } from "../Option";

/**
 * Fetches options asynchronously from some source, such as an API or local storage.
 */
export interface OptionSourceLike<TData = unknown> {
    /**
     * Gets a page of options based on the specified query.
     */
    getOptionPage: (query?: OptionSourcePageQuery<TData>) => Promise<OptionSourcePage<TData>>;

    /**
     * Resolves options for the specified values.
     */
    resolveValues: (values: readonly string[], signal?: AbortSignal) => Promise<Option<TData>[]>;

    /**
     * If the source supports caching, returns all of the cached options.
     */
    getCachedOptions?: () => Option<TData>[] | undefined;

    /**
     * If the source supports caching, clears any cached options.
     */
    clearCache?: () => void;

    /**
     * Returns a copy of this source that does not use caching.
     * If the original source does not use caching, this may simply return itself.
     */
    withNoCache?: () => OptionSourceLike<TData>;
}

/**
 * A query for fetching a page of options.
 */
export interface OptionSourcePageQuery<TData = unknown> {
    /**
     * A free-text search query for filtering options.
     */
    search?: string;

    /**
     * The requested maximum number of options to return in the response.
     */
    limit?: number;

    /**
     * For offset-based pagination: the number of options to skip before starting to collect the result set.
     * This is only used for a subsequent request if the initial request returned a response with a "hasMore" value of true.
     */
    offset?: number;

    /**
     * For cursor-based pagination: the last option from the previous page of results.
     * This is only used for a subsequent request if the initial request returned a response with a "hasMore" value of true.
     */
    after?: Option<TData>;

    /**
     * A signal that can be used to indicate that the request is no longer needed.
     */
    signal?: AbortSignal;
}

/**
 * A page of options.
 */
export interface OptionSourcePage<TData = unknown> {
    /**
     * The options.
     */
    options: Option<TData>[];

    /**
     * True if there are more options for the query that were not included in this page,
     * false if there are no more options,
     * or undefined if we don't know whether there are more options.
     */
    hasMore?: boolean;

    /**
     * Fetches the next page of options for the same query.
     */
    nextPage?: (options?: { limit?: number; signal?: AbortSignal }) => Promise<OptionSourcePage<TData>>;
}
