import type { Option } from "../Option";
import type { OptionSourcePage, OptionSourcePageQuery } from "./OptionSourceLike";

/**
 * An internal class that handles caching for an OptionSource.
 */
export class OptionCache<TData = unknown> {
    private defaultQueryData: { options: Option<TData>[]; limit: number | undefined; hasMore: boolean | undefined } | undefined;
    private readonly cacheByValue = new Map<string, Option<TData>>();

    public getAll(): Option<TData>[] {
        const optionMap = new Map<string, Option<TData>>();
        if (this.defaultQueryData) {
            for (const option of this.defaultQueryData.options) {
                optionMap.set(option.value, option);
            }
        }
        for (const option of this.cacheByValue.values()) {
            optionMap.set(option.value, option);
        }
        return Array.from(optionMap.values());
    }

    public getByValue(value: string): Option<TData> | undefined {
        let option = this.cacheByValue.get(value);
        if (!option && this.defaultQueryData) {
            option = this.defaultQueryData.options.find((o) => o.value === value);
        }
        return option;
    }

    public hasDefault(): boolean {
        return !!this.defaultQueryData;
    }

    public getByPageQuery(query: OptionSourcePageQuery<TData> | undefined): OptionSourcePage<TData> | undefined {
        if (!this.defaultQueryData) {
            return undefined;
        }

        if (query && (query.search || (query.offset && query.offset > 0) || query.after)) {
            return undefined;
        }

        let options = this.defaultQueryData.options;
        let hasMore = this.defaultQueryData.hasMore;
        if (query?.limit !== undefined) {
            if (this.defaultQueryData.limit !== undefined && this.defaultQueryData.limit < query.limit) {
                return undefined;
            }
            if (query.limit < options.length) {
                options = options.slice(0, query.limit);
                hasMore = true;
            }
        }

        return { options, hasMore };
    }

    public tryResolveValues(values: readonly string[]): {
        options: Option<TData>[] | undefined;
        missingValues: readonly string[] | undefined;
    } {
        if (!values || (this.cacheByValue.size === 0 && !this.defaultQueryData)) {
            return { options: undefined, missingValues: values };
        }

        const options: Option<TData>[] = [];
        const missingValues: string[] = [];
        for (const value of values) {
            const option = this.getByValue(value);
            if (option) {
                options.push(option);
            } else {
                missingValues.push(value);
            }
        }
        return { options, missingValues };
    }

    public set(options: readonly Option<TData>[]): void {
        if (!options) {
            return;
        }

        // Cache items until capacity is reached
        const MAX_VALUE_CACHE_SIZE = 1000;
        for (const option of options) {
            if (this.cacheByValue.size >= MAX_VALUE_CACHE_SIZE) {
                break;
            }
            this.cacheByValue.set(option.value, option);
        }
    }

    public setQueryResult(queryResult: OptionSourcePage<TData>, query: OptionSourcePageQuery<TData> | undefined): boolean {
        const isDefaultQuery = !query || (!query.search && !query.offset && !query.after);
        if (isDefaultQuery && queryResult.options && queryResult.options.length > 0) {
            this.defaultQueryData = { options: queryResult.options, hasMore: queryResult.hasMore, limit: query?.limit };
            return true;
        }
        return false;
    }

    public clear(): void {
        this.defaultQueryData = undefined;
        this.cacheByValue.clear();
    }
}
