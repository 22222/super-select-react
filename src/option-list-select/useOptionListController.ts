import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
    convertToOptionSourceError,
    type Option,
    type OptionSourceErrorLike,
    type OptionSourceLike,
    type OptionSourceResult,
} from "../option-source";
import type { SelectProps } from "../SelectProps";
import { mergeOptions } from "../utils/mergeOptions";
import { normalizeSelectValue } from "../utils/normalizeSelectValue";

export interface OptionListControllerInit {
    optionSource?: OptionSourceLike;
    staticOptions: Option[];
    searchMatcher?: (option: Option, search: string) => boolean;
    maxAdditionalPages?: number;
    value?: SelectProps["value"];
    defaultValue?: SelectProps["defaultValue"];
    multiple?: boolean;
    isOptionListActive?: boolean;
}

export interface OptionListControllerState {
    searchValue: string;
    selectedValues: string[];
    options: Option[];
    isOptionsPending: boolean;
    isSearching: boolean;
    isResolveValuesPending: boolean;
    optionsError: OptionSourceErrorLike | undefined;
    resolveValuesError: OptionSourceErrorLike | undefined;
    canLoadMore: boolean;
    hasMore: boolean;
    handleSelectedValuesChange: (values: string[]) => void;
    handleSearchChange: (value: string) => void;
    handleRetryOptions?: () => void;
    handleLoadMore: () => void;
}

const DEFAULT_MAX_ADDITIONAL_PAGES = 2;
const SEARCH_DEBOUNCE_MS = 250;

export function useOptionListController({
    optionSource,
    staticOptions,
    searchMatcher,
    maxAdditionalPages = DEFAULT_MAX_ADDITIONAL_PAGES,
    value,
    defaultValue,
    multiple,
    isOptionListActive = true,
}: OptionListControllerInit): OptionListControllerState {
    const shouldStartOptionsQuery = isOptionListActive && !!optionSource;
    const isValueControlled = value !== undefined;
    const [trackedSelectedValues, setTrackedSelectedValues] = useState<string[]>(() => {
        const startingValues = normalizeSelectValue(isValueControlled ? value : defaultValue);
        return multiple ? startingValues : startingValues.slice(0, 1);
    });
    const selectedValues = useMemo(() => {
        const normalizedValues = normalizeSelectValue(isValueControlled ? value : trackedSelectedValues);
        return multiple ? normalizedValues : normalizedValues.slice(0, 1);
    }, [isValueControlled, multiple, trackedSelectedValues, value]);

    const [searchValue, setSearchValue] = useState("");
    const [debouncedSearchValue, setDebouncedSearchValue] = useState<string | undefined>(() => (shouldStartOptionsQuery ? "" : undefined));
    const [optionsQueryState, setOptionsQueryState] = useState<OptionsQueryState>({
        items: [],
        result: undefined,
        error: undefined,
        isPending: shouldStartOptionsQuery,
        additionalPagesLoaded: 0,
        lastAttemptedQuery: shouldStartOptionsQuery
            ? {
                  search: undefined,
                  initiatedBySearch: false,
              }
            : undefined,
    });
    const [optionsRequestKey, setOptionsRequestKey] = useState(0);
    const [valuesToShowFirst, setValuesToShowFirst] = useState<string[]>(() => [...selectedValues]);
    const [resolvedSelectionState, setResolvedSelectionState] = useState<ResolvedSelectionState>({
        key: "",
        options: [],
        error: undefined,
    });
    const [isResolveValuesPending, setIsResolveValuesPending] = useState(false);

    const optionsRequestControllerRef = useRef<AbortController | undefined>(undefined);
    const paginationRequestControllerRef = useRef<AbortController | undefined>(undefined);
    const selectionRequestControllerRef = useRef<AbortController | undefined>(undefined);
    const knownOptionsByValueRef = useRef<Map<string, Option>>(new Map());
    const previousQueryActivationRef = useRef({ isOptionListActive, optionSource });

    const selectionValuesKey = useMemo(() => JSON.stringify(selectedValues), [selectedValues]);
    const isInitialOptionsPending =
        isOptionListActive &&
        !!optionSource &&
        debouncedSearchValue === undefined &&
        optionsQueryState.result === undefined &&
        optionsQueryState.error === undefined;
    const isSuccess = !isInitialOptionsPending && !optionsQueryState.isPending && optionsQueryState.error === undefined;
    const isError = optionsQueryState.error !== undefined;

    const handleSelectedValuesChange = useCallback(
        (nextValues: string[]) => {
            const normalizedValues = multiple ? nextValues : nextValues.slice(0, 1);

            if (!isValueControlled) {
                setTrackedSelectedValues(normalizedValues);
            }
        },
        [isValueControlled, multiple],
    );

    useEffect(() => {
        const previousQueryActivation = previousQueryActivationRef.current;
        const isActiveChanged = isOptionListActive !== previousQueryActivation.isOptionListActive;
        const isOptionSourceChanged = optionSource !== previousQueryActivation.optionSource;

        if (!isActiveChanged && !isOptionSourceChanged) {
            return;
        }

        previousQueryActivationRef.current = { isOptionListActive, optionSource };

        if (!isOptionListActive || isOptionSourceChanged) {
            optionsRequestControllerRef.current?.abort();
            optionsRequestControllerRef.current = undefined;
            paginationRequestControllerRef.current?.abort();
            paginationRequestControllerRef.current = undefined;
        }

        let cancelled = false;
        queueMicrotask(() => {
            if (cancelled) {
                return;
            }

            if (!isOptionListActive) {
                setOptionsQueryState((previous) => ({
                    ...previous,
                    isPending: false,
                }));
                return;
            }

            setSearchValue("");
            setValuesToShowFirst(selectedValues);
            setDebouncedSearchValue("");

            if (optionSource) {
                setOptionsQueryState((previous) => ({
                    ...previous,
                    items: [],
                    result: undefined,
                    error: undefined,
                    isPending: true,
                    additionalPagesLoaded: 0,
                    lastAttemptedQuery: {
                        search: undefined,
                        initiatedBySearch: false,
                    },
                }));
                return;
            }

            setOptionsQueryState((previous) => ({
                ...previous,
                error: undefined,
                isPending: false,
            }));
        });

        return () => {
            cancelled = true;
        };
    }, [isOptionListActive, optionSource, selectedValues]);

    useEffect(() => {
        if (!isOptionListActive) {
            return;
        }
        if (searchValue === debouncedSearchValue) {
            return;
        }

        const timer = window.setTimeout(() => {
            if (optionSource) {
                setOptionsQueryState((previous) => ({
                    ...previous,
                    isPending: true,
                    error: undefined,
                    lastAttemptedQuery: {
                        search: searchValue || undefined,
                        initiatedBySearch: true,
                    },
                }));
                setOptionsRequestKey((previous) => previous + 1);
            }
            setDebouncedSearchValue(searchValue);
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            window.clearTimeout(timer);
        };
    }, [debouncedSearchValue, isOptionListActive, optionSource, searchValue]);

    useEffect(() => {
        if (!isOptionListActive || !optionSource || debouncedSearchValue === undefined) {
            return;
        }

        let cancelled = false;
        optionsRequestControllerRef.current?.abort();
        const controller = new AbortController();
        optionsRequestControllerRef.current = controller;
        const query = debouncedSearchValue ? { search: debouncedSearchValue, signal: controller.signal } : { signal: controller.signal };
        optionSource
            .getOptionPage(query)
            .then((result) => {
                if (cancelled) {
                    return;
                }

                setOptionsQueryState((previous) => ({
                    ...previous,
                    items: result.options,
                    result,
                    error: undefined,
                    isPending: false,
                    additionalPagesLoaded: 0,
                }));
            })
            .catch((loadError: unknown) => {
                if (cancelled || controller.signal.aborted) {
                    return;
                }

                setOptionsQueryState((previous) => ({
                    ...previous,
                    items: [],
                    result: undefined,
                    isPending: false,
                    error: convertToOptionSourceError(loadError),
                }));
            });

        return () => {
            cancelled = true;
            controller.abort();
            if (optionsRequestControllerRef.current === controller) {
                optionsRequestControllerRef.current = undefined;
            }
        };
    }, [debouncedSearchValue, isOptionListActive, optionSource, optionsRequestKey]);

    const handleSearchChange = useCallback(
        (nextSearchValue: string) => {
            setValuesToShowFirst((previous) => {
                if (selectedValues.length === 0) {
                    return previous;
                }

                const nextSelectedValues = [...previous];
                const seenValues = new Set(previous);
                for (const selectedValue of selectedValues) {
                    if (seenValues.has(selectedValue)) {
                        continue;
                    }

                    seenValues.add(selectedValue);
                    nextSelectedValues.push(selectedValue);
                }

                return nextSelectedValues;
            });
            setSearchValue(nextSearchValue);
        },
        [selectedValues],
    );

    const handleRetryOptions = useCallback(() => {
        if (!optionSource || !isOptionListActive) {
            return;
        }

        setOptionsQueryState((previous) => ({
            ...previous,
            items: [],
            result: undefined,
            error: undefined,
            isPending: true,
            additionalPagesLoaded: 0,
            lastAttemptedQuery: {
                search: debouncedSearchValue,
                initiatedBySearch: !!previous.lastAttemptedQuery?.initiatedBySearch,
            },
        }));
        setOptionsRequestKey((previous) => previous + 1);
        setDebouncedSearchValue((previous) => previous ?? "");
    }, [debouncedSearchValue, isOptionListActive, optionSource]);

    const canLoadMore =
        !!optionsQueryState.result?.nextPage &&
        optionsQueryState.additionalPagesLoaded < maxAdditionalPages &&
        optionsQueryState.items.length > 0 &&
        isSuccess &&
        !optionsQueryState.isPending;

    const hasMore = !!optionsQueryState.result?.nextPage && optionsQueryState.items.length > 0 && isSuccess;

    const handleLoadMore = useCallback(() => {
        if (!optionsQueryState.result?.nextPage || !canLoadMore || optionsQueryState.isPending) {
            return;
        }

        setOptionsQueryState((previous) => ({
            ...previous,
            isPending: true,
            lastAttemptedQuery: {
                search: debouncedSearchValue,
                initiatedBySearch: false,
            },
        }));
        paginationRequestControllerRef.current?.abort();
        const controller = new AbortController();
        paginationRequestControllerRef.current = controller;
        optionsQueryState.result
            .nextPage({ signal: controller.signal })
            .then((result) => {
                if (paginationRequestControllerRef.current !== controller) {
                    return;
                }

                setOptionsQueryState((previous) => ({
                    ...previous,
                    items: [...previous.items, ...result.options],
                    result,
                    additionalPagesLoaded: previous.additionalPagesLoaded + 1,
                    error: undefined,
                    isPending: false,
                }));
            })
            .catch((loadError: unknown) => {
                if (controller.signal.aborted || paginationRequestControllerRef.current !== controller) {
                    return;
                }

                setOptionsQueryState((previous) => ({
                    ...previous,
                    error: convertToOptionSourceError(loadError),
                    isPending: false,
                }));
            })
            .finally(() => {
                if (paginationRequestControllerRef.current === controller) {
                    paginationRequestControllerRef.current = undefined;
                }
            });
    }, [canLoadMore, debouncedSearchValue, optionsQueryState.isPending, optionsQueryState.result]);

    useEffect(() => {
        const nextKnownOptions = new Map<string, Option>();

        for (const option of staticOptions) {
            if (!nextKnownOptions.has(option.value)) {
                nextKnownOptions.set(option.value, option);
            }
        }

        knownOptionsByValueRef.current = nextKnownOptions;
    }, [optionSource, staticOptions]);

    const debouncedLocalSearchValue = debouncedSearchValue ?? "";
    const localVisibleOptions = useMemo(() => {
        const visibleStaticOptions = staticOptions.find((option) => option.hidden)
            ? staticOptions.filter((option) => !option.hidden)
            : staticOptions;
        return filterOptionsBySearch(visibleStaticOptions, debouncedLocalSearchValue, searchMatcher);
    }, [debouncedLocalSearchValue, searchMatcher, staticOptions]);

    const visibleOptions = useMemo(() => {
        if (!optionSource) {
            return localVisibleOptions;
        }

        const visibleOptionSourceOptions = optionsQueryState.items.find((option) => option.hidden)
            ? optionsQueryState.items.filter((option) => !option.hidden)
            : optionsQueryState.items;
        return mergeOptions(localVisibleOptions, visibleOptionSourceOptions);
    }, [localVisibleOptions, optionSource, optionsQueryState.items]);

    useEffect(() => {
        if (!optionSource || visibleOptions.length === 0) {
            return;
        }

        for (const option of visibleOptions) {
            if (!knownOptionsByValueRef.current.has(option.value)) {
                knownOptionsByValueRef.current.set(option.value, option);
            }
        }
    }, [optionSource, visibleOptions]);

    useEffect(() => {
        if (!optionSource || selectedValues.length === 0) {
            return;
        }

        let cancelled = false;
        selectionRequestControllerRef.current?.abort();
        const controller = new AbortController();
        selectionRequestControllerRef.current = controller;
        const effectSelectionValuesKey = JSON.stringify(selectedValues);
        const knownOptionsByValue = knownOptionsByValueRef.current;
        const knownResolvedByValue = new Map<string, Option>();

        for (const valueEntry of selectedValues) {
            const knownOption = knownOptionsByValue.get(valueEntry);
            if (knownOption) {
                knownResolvedByValue.set(valueEntry, knownOption);
            }
        }

        const missingValues = selectedValues.filter((valueEntry) => !knownResolvedByValue.has(valueEntry));

        if (missingValues.length === 0) {
            selectionRequestControllerRef.current = undefined;
            queueMicrotask(() => {
                if (cancelled) {
                    return;
                }

                setIsResolveValuesPending(false);
                setResolvedSelectionState({
                    key: effectSelectionValuesKey,
                    options: selectedValues
                        .map((valueEntry) => knownResolvedByValue.get(valueEntry))
                        .filter((option): option is Option => option !== undefined),
                    error: undefined,
                });
            });
            return;
        }

        queueMicrotask(() => {
            setIsResolveValuesPending(true);
        });
        optionSource
            .resolveValues(missingValues, controller.signal)
            .then((resolved) => {
                if (cancelled) {
                    return;
                }

                const resolvedByValue = new Map(resolved.map((option) => [option.value, option]));
                for (const option of resolved) {
                    knownOptionsByValue.set(option.value, option);
                }

                const orderedResolved = selectedValues
                    .map((valueEntry) => knownResolvedByValue.get(valueEntry) ?? resolvedByValue.get(valueEntry))
                    .filter((option): option is Option => option !== undefined);
                const unresolvedValues = selectedValues
                    .filter((valueEntry) => !resolvedByValue.has(valueEntry))
                    .filter((valueEntry) => !knownResolvedByValue.has(valueEntry));

                setIsResolveValuesPending(false);
                setResolvedSelectionState({
                    key: effectSelectionValuesKey,
                    options: orderedResolved,
                    error: unresolvedValues.length > 0 ? convertToOptionSourceError(new Error()) : undefined,
                });
            })
            .catch((resolveError: unknown) => {
                if (cancelled || controller.signal.aborted) {
                    return;
                }

                setIsResolveValuesPending(false);
                setResolvedSelectionState({
                    key: effectSelectionValuesKey,
                    options: [],
                    error: convertToOptionSourceError(resolveError),
                });
            });

        return () => {
            cancelled = true;
            controller.abort();
            if (selectionRequestControllerRef.current === controller) {
                selectionRequestControllerRef.current = undefined;
            }
        };
    }, [optionSource, selectedValues]);

    const selectedOptions = useMemo(() => {
        if (optionSource) {
            if (selectedValues.length === 0 || resolvedSelectionState.key !== selectionValuesKey) {
                return [] as Option[];
            }

            return resolvedSelectionState.options;
        }

        const optionsByValue = new Map(staticOptions.map((option) => [option.value, option]));
        return selectedValues.map((selectedValue) => {
            const matchedOption = optionsByValue.get(selectedValue);
            if (matchedOption) {
                return matchedOption;
            }

            return {
                value: selectedValue,
                label: "",
                disabled: false,
            } satisfies Option;
        });
    }, [optionSource, resolvedSelectionState.key, resolvedSelectionState.options, selectedValues, selectionValuesKey, staticOptions]);

    const optionsError = useMemo(() => {
        if (!isError) {
            return undefined;
        }

        return optionsQueryState.error ?? convertToOptionSourceError();
    }, [isError, optionsQueryState.error]);

    const isSearchActive =
        debouncedLocalSearchValue.trim().length > 0 &&
        !(optionsQueryState.isPending && optionsQueryState.lastAttemptedQuery?.initiatedBySearch);
    const optionsToShowFirst = useMemo(() => {
        if (valuesToShowFirst.length === 0) {
            return [] as Option[];
        }

        const selectedValueSet = new Set(valuesToShowFirst);
        const selectedOptionByValue = new Map<string, Option>();

        for (const option of visibleOptions) {
            if (selectedValueSet.has(option.value)) {
                selectedOptionByValue.set(option.value, option);
            }
        }

        for (const option of selectedOptions) {
            if (selectedValueSet.has(option.value)) {
                selectedOptionByValue.set(option.value, option);
            }
        }

        return valuesToShowFirst
            .map((valueEntry) => selectedOptionByValue.get(valueEntry))
            .filter((option): option is Option => option !== undefined);
    }, [selectedOptions, valuesToShowFirst, visibleOptions]);

    const options = useMemo(() => {
        if (optionsError && (optionsQueryState.lastAttemptedQuery?.initiatedBySearch || visibleOptions.length === 0)) {
            return [] as Option[];
        }

        return getOptionsWithSelectedFirst(
            visibleOptions,
            valuesToShowFirst,
            optionSource ? optionsToShowFirst : undefined,
            isSearchActive,
        );
    }, [
        isSearchActive,
        optionSource,
        optionsError,
        optionsQueryState.lastAttemptedQuery?.initiatedBySearch,
        optionsToShowFirst,
        valuesToShowFirst,
        visibleOptions,
    ]);

    const resolveValuesError = useMemo(() => {
        if (
            !optionSource ||
            selectedValues.length === 0 ||
            resolvedSelectionState.key !== selectionValuesKey ||
            resolvedSelectionState.error === undefined
        ) {
            return undefined;
        }

        return resolvedSelectionState.error;
    }, [optionSource, resolvedSelectionState.error, resolvedSelectionState.key, selectedValues.length, selectionValuesKey]);

    const isOptionsPending = isOptionListActive && !!optionSource && (isInitialOptionsPending || optionsQueryState.isPending);
    const isSearching = isOptionsPending && Boolean(optionsQueryState.lastAttemptedQuery?.initiatedBySearch);
    const isResolvingSelectedValues = !!optionSource && selectedValues.length > 0 && isResolveValuesPending;

    useEffect(
        () => () => {
            optionsRequestControllerRef.current?.abort();
            paginationRequestControllerRef.current?.abort();
            selectionRequestControllerRef.current?.abort();
        },
        [],
    );

    return {
        searchValue,
        selectedValues,
        options,
        isOptionsPending,
        isSearching,
        isResolveValuesPending: isResolvingSelectedValues,
        optionsError,
        resolveValuesError,
        canLoadMore,
        hasMore,
        handleSelectedValuesChange,
        handleSearchChange,
        handleRetryOptions: optionSource ? handleRetryOptions : undefined,
        handleLoadMore,
    };
}

interface OptionsQueryState {
    items: Option[];
    result?: OptionSourceResult;
    error?: OptionSourceErrorLike;
    isPending: boolean;
    additionalPagesLoaded: number;
    lastAttemptedQuery?: {
        search?: string;
        initiatedBySearch: boolean;
    };
}

interface ResolvedSelectionState {
    key: string;
    options: Option[];
    error?: OptionSourceErrorLike;
}

function defaultOptionListSearchMatcher(option: Option, searchValue: string): boolean {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) {
        return true;
    }

    return option.label.toLowerCase().includes(normalizedSearch);
}

function filterOptionsBySearch(
    options: Option[],
    searchValue: string,
    searchMatcher?: (option: Option, search: string) => boolean,
): Option[] {
    if (!searchValue.trim()) {
        return options;
    }

    if (searchMatcher) {
        return options.filter((option) => searchMatcher(option, searchValue));
    }

    return options.filter((option) => defaultOptionListSearchMatcher(option, searchValue));
}

function getOptionsWithSelectedFirst(
    options: Option[],
    selectedValues: string[] | undefined,
    selectedOptions: Option[] | undefined,
    isSearchActive: boolean,
): Option[] {
    if (!selectedValues || selectedValues.length === 0 || isSearchActive) {
        return options;
    }

    const selectedValueSet = new Set(selectedValues);
    const selectedOptionsInList = options.filter((option) => selectedValueSet.has(option.value));
    const seenValues = new Set(selectedOptionsInList.map((option) => option.value));
    const selectedOptionsOutsideList: Option[] = [];

    for (const option of selectedOptions ?? []) {
        if (!selectedValueSet.has(option.value) || seenValues.has(option.value)) {
            continue;
        }

        seenValues.add(option.value);
        selectedOptionsOutsideList.push(option);
    }

    const remainingOptions = options.filter((option) => !seenValues.has(option.value));
    if (selectedOptionsInList.length === 0 && selectedOptionsOutsideList.length === 0) {
        return options;
    }

    return [...selectedOptionsInList, ...selectedOptionsOutsideList, ...remainingOptions];
}
