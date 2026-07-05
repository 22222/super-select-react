import type React from "react";
import { useMemo } from "react";

import { createOptionSource, type OptionSourceFetcher, type OptionSourceInit, type OptionSourceLike } from "./option-source";

/**
 * Creates and memoizes an option source from a fetcher, configuration object, or existing option source.
 * The option source will only be recreated when one of the optional `deps` has changed.
 */
export function useOptionSource<TData = unknown>(
    init: OptionSourceLike<TData> | OptionSourceInit<TData> | OptionSourceFetcher<TData>,
    deps: React.DependencyList = [],
): OptionSourceLike<TData> {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
    return useMemo(() => createOptionSource(init), deps);
}
