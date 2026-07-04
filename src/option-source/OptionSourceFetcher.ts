import type { Option } from "../Option";

/**
 * A function that asynchronously fetches options based on a request.
 */
export type OptionSourceFetcher<TData = unknown> = (request: OptionSourceFetchRequest<TData>) => Promise<OptionSourceFetchResponse<TData>>;

/**
 * A request to fetch options.
 */
export interface OptionSourceFetchRequest<TData = unknown> {
    /**
     * The values of the options to fetch.
     * This is used to resolve the labels of options when only their values are known.
     */
    values?: readonly string[];

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
     * For example, if a search query has been superseded by a new query as the user typed more characters.
     */
    signal?: AbortSignal;
}

/**
 * The response from fetching options.
 */
export interface OptionSourceFetchResponse<TData = unknown> {
    /**
     * The options matching the request query.
     */
    options: Option<TData>[];

    /**
     * True if there are more options matching the request query that were not included in this response.
     * If true, a subsequent request could be made to fetch the next page of results using offset-based or cursor-based pagination.
     */
    hasMore?: boolean;
}
