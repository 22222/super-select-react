import type React from "react";
import { useMemo } from "react";

import { createOptionSource, type OptionSourceFetcher, type OptionSourceInit, type OptionSourceLike } from "./option-source";

/**
 * Creates an option source with `createOptionSource`, keeping one source instance across renders
 * until `deps` changes (like `useMemo`).
 * Include a value in `deps` when a change to that value should discard cached options and reload,
 * including any prop or state that a fetch function reads.
 */
export function useOptionSource<TData = unknown>(
    init: OptionSourceLike<TData> | OptionSourceInit<TData> | OptionSourceFetcher<TData>,
    deps: React.DependencyList = [],
): OptionSourceLike<TData> {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
    return useMemo(() => createOptionSource(init), deps);
}
