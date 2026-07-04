import "../super-select.css";

import type React from "react";
import { useCallback, useMemo, useRef } from "react";

import { type Option, type OptionSourceLike } from "../option-source";
import type { AnyHTMLElement, HTMLSelectElementSubset, SelectChangeValue, SelectProps } from "../SelectProps";
import {
    createChangeEvent,
    createHTMLSelectElementSubsetTarget,
    createInputEvent,
    createInvalidEvent,
    retargetDomEventHandlers,
} from "../utils/createSyntheticEvent";
import { cx } from "../utils/cx";
import { ErrorIndicator, type ErrorIndicatorProps } from "../utils/ErrorIndicator";
import { FormResetListener } from "../utils/FormResetListener";
import { normalizeSelectValue } from "../utils/normalizeSelectValue";
import { parseChildOptions } from "../utils/parseChildOptions";
import { PendingIndicator, type PendingIndicatorProps } from "../utils/PendingIndicator";
import { EmptyIndicator, type EmptyIndicatorProps } from "./EmptyIndicator";
import { MoreIndicator, type MoreIndicatorProps } from "./MoreIndicator";
import { OptionList, type OptionListProps } from "./OptionList";
import { OptionListInput, type OptionListInputProps } from "./OptionListInput";
import { SearchInput, type SearchInputProps } from "./SearchInput";
import { useOptionListController } from "./useOptionListController";

/**
 * Props for an `OptionListSelect` component.
 */
export interface OptionListSelectProps<Multiple extends boolean = boolean> extends SelectProps {
    /**
     * Whether more than one option can be selected.
     */
    multiple?: Multiple;

    /**
     * A source that loads options and supports searching, pagination, and selected-value resolution.
     */
    optionSource?: OptionSourceLike;

    /**
     * Called with the selected value whenever the selection changes.
     * Receives a string for a single select and a string array for a multiple select.
     */
    onValueChange?: (value: SelectChangeValue<Multiple>) => void;

    /**
     * Customization options for the select.
     */
    customization?: {
        classNamePrefix?: string;
        searchMatcher?: (option: Option, search: string) => boolean;
        optionListInput?: {
            className?: string;
            style?: React.CSSProperties;
            component?: React.ComponentType<OptionListInputProps<AnyHTMLElement, AnyHTMLElement>>;
            optionItem?: {
                className?: string;
                style?: React.CSSProperties;
            };
            groupHeader?: {
                className?: string;
                style?: React.CSSProperties;
            };
        };
        optionList?: {
            className?: string;
            style?: React.CSSProperties;
            component?: React.ComponentType<OptionListProps<AnyHTMLElement>>;
        };
        errorIndicator?: {
            className?: string;
            style?: React.CSSProperties;
            defaultMessage?: React.ReactNode;
            icon?: React.ReactNode;
            retryButton?: {
                className?: string;
                style?: React.CSSProperties;
                title?: string;
                content?: React.ReactNode;
            };
            component?: React.ComponentType<ErrorIndicatorProps>;
        };
        pendingIndicator?: {
            className?: string;
            style?: React.CSSProperties;
            title?: string;
            content?: React.ReactNode;
            component?: React.ComponentType<PendingIndicatorProps>;
        };
        emptyIndicator?: {
            className?: string;
            style?: React.CSSProperties;
            content?: React.ReactNode;
            retryButton?: {
                className?: string;
                style?: React.CSSProperties;
                title?: string;
                content?: React.ReactNode;
            };
            component?: React.ComponentType<EmptyIndicatorProps>;
        };
        maxAdditionalPages?: number;
        moreIndicator?: {
            className?: string;
            style?: React.CSSProperties;
            loadMoreButton?: {
                className?: string;
                style?: React.CSSProperties;
                title?: string;
                content?: React.ReactNode;
            };
            overflowIndicator?: {
                className?: string;
                style?: React.CSSProperties;
                title?: string;
                content?: React.ReactNode;
            };
            component?: React.ComponentType<MoreIndicatorProps>;
        };
        searchInput?: {
            className?: string;
            style?: React.CSSProperties;
            placeholder?: string;
            title?: string;
            component?: React.ComponentType<SearchInputProps>;
        };
    };
}

/**
 * A select-compatible component that displays its options inline.
 */
export function OptionListSelect<Multiple extends boolean = false>({
    optionSource,
    children,
    customization,
    ref,
    onBlur,
    onFocus,
    onClick,
    onMouseDown,
    onMouseUp,
    onPointerDown,
    onPointerUp,
    onContextMenu,
    onKeyDown,
    onKeyUp,
    onBeforeInput,
    onSelect,
    onCompositionStart,
    onCompositionUpdate,
    onCompositionEnd,
    onChange,
    onInput,
    onInvalid,
    onValueChange,
    className,
    style,
    ...selectProps
}: OptionListSelectProps<Multiple>) {
    const staticOptions = useMemo(() => parseChildOptions(children), [children]);
    const rootRef = useRef<HTMLDivElement>(null);
    const SearchInputComponent = customization?.searchInput?.component ?? SearchInput;
    const classNamePrefix = customization?.classNamePrefix ?? "super-select";
    const classNameBase = classNamePrefix.length > 0 ? `${classNamePrefix}__` : "";
    const { multiple, disabled, value, defaultValue } = selectProps;
    const isControlled = value !== undefined;
    const initialDefaultValueRef = useRef(defaultValue);

    const controller = useOptionListController({
        optionSource,
        staticOptions,
        searchMatcher: customization?.searchMatcher,
        maxAdditionalPages: customization?.maxAdditionalPages,
        value,
        defaultValue,
        multiple,
    });

    const setOptionListRef = useCallback(
        (node: HTMLElement | null) => {
            if (!ref) {
                return;
            }

            if (typeof ref === "function") {
                ref(node);
                return;
            }

            ref.current = node;
        },
        [ref],
    );

    const selectedValues = useMemo(
        () => (multiple ? controller.selectedValues : controller.selectedValues.slice(0, 1)),
        [controller.selectedValues, multiple],
    );

    const handleFormReset = useCallback(() => {
        if (!isControlled) {
            const initialValues = normalizeSelectValue(initialDefaultValueRef.current);
            controller.handleSelectedValuesChange(multiple ? initialValues : initialValues.slice(0, 1));
        }
    }, [controller, isControlled, multiple]);

    const handleValidationProxyInvalid = useCallback(
        (event: React.InvalidEvent<HTMLInputElement>) => {
            event.preventDefault();
            if (!onInvalid) {
                return;
            }

            const eventTarget = createHTMLSelectElementSubsetTarget({
                id: selectProps.id,
                name: selectProps.name,
                value: multiple ? selectedValues : (selectedValues[0] ?? ""),
                multiple,
                disabled,
                required: selectProps.required,
            });

            onInvalid(createInvalidEvent(eventTarget));
        },
        [disabled, multiple, onInvalid, selectProps, selectedValues],
    );

    const eventTarget = useMemo(
        () =>
            createHTMLSelectElementSubsetTarget({
                id: selectProps.id,
                name: selectProps.name,
                value: multiple ? selectedValues : (selectedValues[0] ?? ""),
                multiple,
                disabled,
                required: selectProps.required,
            }),
        [disabled, multiple, selectProps.id, selectProps.name, selectProps.required, selectedValues],
    );

    const optionListInputProps = { ...selectProps, value: undefined, defaultValue: undefined, size: undefined };
    const optionListInputBaseProps: Omit<typeof optionListInputProps, keyof React.DOMAttributes<HTMLSelectElementSubset>> =
        optionListInputProps;
    const optionListEventProps = retargetDomEventHandlers<HTMLSelectElementSubset, HTMLFieldSetElement>(eventTarget, {
        ...optionListInputProps,
        onFocus,
        onBlur,
        onClick,
        onMouseDown,
        onMouseUp,
        onPointerDown,
        onPointerUp,
        onContextMenu,
        onKeyDown,
        onKeyUp,
        onBeforeInput,
        onSelect,
        onCompositionStart,
        onCompositionUpdate,
        onCompositionEnd,
    });

    const showSearchInput = Boolean(optionSource);
    const isOptionListPending = controller.isOptionsPending || controller.isResolveValuesPending;
    const hasOptions = controller.options.length > 0;
    const optionListError = controller.optionsError;
    const isError = Boolean(optionListError);
    const isPending = isOptionListPending;
    const isEmpty = !isError && !isPending && !hasOptions;
    const isMore = !isError && !isPending && !isEmpty && Boolean(controller.hasMore);
    const optionListIndicatorDisabled = disabled || isOptionListPending;
    const OptionListComponent = customization?.optionList?.component ?? OptionList;
    const OptionListInputComponent = customization?.optionListInput?.component ?? OptionListInput;
    const ErrorIndicatorComponent = customization?.errorIndicator?.component ?? ErrorIndicator;
    const EmptyIndicatorComponent = customization?.emptyIndicator?.component ?? EmptyIndicator;
    const MoreIndicatorComponent = customization?.moreIndicator?.component ?? MoreIndicator;
    const PendingIndicatorComponent = customization?.pendingIndicator?.component ?? PendingIndicator;

    let indicator: React.ReactNode;
    if (isPending) {
        indicator = (
            <PendingIndicatorComponent
                inline
                className={customization?.pendingIndicator?.className}
                style={customization?.pendingIndicator?.style}
                title={customization?.pendingIndicator?.title}
                content={customization?.pendingIndicator?.content}
                customization={{ classNamePrefix }}
            />
        );
    } else if (isError) {
        indicator = (
            <ErrorIndicatorComponent
                className={customization?.errorIndicator?.className}
                style={customization?.errorIndicator?.style}
                error={optionListError}
                message={optionListError?.userMessage ?? customization?.errorIndicator?.defaultMessage}
                onRetry={controller.handleRetryOptions}
                customization={{
                    classNamePrefix,
                    icon: customization?.errorIndicator?.icon,
                    retryButton: customization?.errorIndicator?.retryButton,
                }}
            />
        );
    } else if (isEmpty) {
        indicator = (
            <EmptyIndicatorComponent
                className={customization?.emptyIndicator?.className}
                style={customization?.emptyIndicator?.style}
                onRetry={controller.handleRetryOptions}
                customization={{
                    classNamePrefix,
                    content: customization?.emptyIndicator?.content,
                    retryButton: customization?.emptyIndicator?.retryButton,
                }}
            />
        );
    } else if (isMore) {
        indicator = (
            <MoreIndicatorComponent
                onLoadMore={controller.canLoadMore ? controller.handleLoadMore : undefined}
                className={customization?.moreIndicator?.className}
                style={customization?.moreIndicator?.style}
                disabled={optionListIndicatorDisabled}
                customization={{
                    classNamePrefix,
                    loadMoreButton: customization?.moreIndicator?.loadMoreButton,
                    overflowIndicator: customization?.moreIndicator?.overflowIndicator,
                }}
            />
        );
    } else {
        indicator = undefined;
    }

    const handleOptionListValueChange = useCallback(
        (nextValues: string[]) => {
            const normalizedValues = multiple ? nextValues : nextValues.slice(0, 1);
            controller.handleSelectedValuesChange(normalizedValues);

            const nextTarget = createHTMLSelectElementSubsetTarget({
                id: selectProps.id,
                name: selectProps.name,
                multiple,
                disabled,
                required: selectProps.required,
                value: multiple ? normalizedValues : (normalizedValues[0] ?? ""),
            });

            if (onInput) {
                onInput(createInputEvent(nextTarget, { data: "" }));
            }

            if (onChange) {
                onChange(createChangeEvent(nextTarget));
            }

            if (onValueChange) {
                onValueChange((multiple ? normalizedValues : (normalizedValues[0] ?? "")) as SelectChangeValue<Multiple>);
            }
        },
        [controller, disabled, multiple, onChange, onInput, onValueChange, selectProps],
    );

    const handleSearchKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
            return;
        }

        const direction = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
        if (!direction) {
            return;
        }

        const scope = rootRef.current;
        if (!scope) {
            return;
        }

        const optionListScope =
            scope.querySelector<HTMLElement>(
                ["[role='listbox']", "[role='radiogroup']", "[role='group']", "fieldset", "[class*='list-group']"].join(","),
            ) ?? scope;
        const optionLikeElements = Array.from(
            optionListScope.querySelectorAll<HTMLElement>(
                [
                    "input[type='radio']:not(:disabled):not([tabindex='-1'])",
                    "input[type='checkbox']:not(:disabled):not([tabindex='-1'])",
                    "[role='radio']:not([aria-disabled='true']):not([tabindex='-1'])",
                    "[role='checkbox']:not([aria-disabled='true']):not([tabindex='-1'])",
                    "[role='option']:not([aria-disabled='true']):not([tabindex='-1'])",
                ].join(","),
            ),
        ).filter((element) => {
            if (element.hidden || element.getAttribute("aria-hidden") === "true") {
                return false;
            }

            const elementStyle = window.getComputedStyle(element);
            return elementStyle.display !== "none" && elementStyle.visibility !== "hidden";
        });

        const nextElement = direction > 0 ? optionLikeElements[0] : optionLikeElements[optionLikeElements.length - 1];
        if (!nextElement) {
            return;
        }

        event.preventDefault();
        nextElement.focus();
    }, []);

    return (
        <OptionListComponent
            ref={rootRef}
            className={cx(customization?.optionList?.className, className)}
            style={
                style && customization?.optionList?.style
                    ? { ...style, ...customization.optionList.style }
                    : (style ?? customization?.optionList?.style)
            }
            aria-label={selectProps["aria-label"] ?? selectProps.name}
            dir={selectProps.dir}
            lang={selectProps.lang}
            customization={{ classNamePrefix }}
            searchInput={
                showSearchInput ? (
                    <SearchInputComponent
                        className={customization?.searchInput?.className}
                        style={customization?.searchInput?.style}
                        search={controller.searchValue}
                        onSearchChange={(nextSearch) => controller.handleSearchChange(nextSearch ?? "")}
                        onKeyDown={handleSearchKeyDown}
                        disabled={disabled}
                        isSearching={controller.isSearching}
                        customization={{
                            classNamePrefix,
                            placeholder: customization?.searchInput?.placeholder,
                            title: customization?.searchInput?.title,
                            pendingIndicator: {
                                className: customization?.pendingIndicator?.className,
                                style: customization?.pendingIndicator?.style,
                                title: customization?.pendingIndicator?.title,
                                content: customization?.pendingIndicator?.content,
                                component: customization?.pendingIndicator?.component,
                            },
                        }}
                    />
                ) : undefined
            }
            optionList={
                <OptionListInputComponent
                    {...optionListInputBaseProps}
                    {...optionListEventProps}
                    ref={setOptionListRef}
                    id={selectProps.id}
                    name={selectProps.name}
                    multiple={multiple}
                    disabled={disabled}
                    required={selectProps.required}
                    form={selectProps.form}
                    autoComplete={selectProps.autoComplete}
                    autoFocus={selectProps.autoFocus}
                    tabIndex={selectProps.tabIndex}
                    title={selectProps.title}
                    options={controller.options}
                    value={selectedValues}
                    onValueChange={handleOptionListValueChange}
                    className={customization?.optionListInput?.className}
                    style={customization?.optionListInput?.style}
                    customization={{
                        classNamePrefix,
                        optionItem: customization?.optionListInput?.optionItem,
                        groupHeader: customization?.optionListInput?.groupHeader,
                    }}
                    aria-busy={isOptionListPending}
                    indicator={indicator}
                />
            }
        >
            {selectProps.required ? (
                <input
                    type="checkbox"
                    checked={selectedValues.length > 0}
                    required
                    disabled={disabled}
                    form={selectProps.form}
                    tabIndex={-1}
                    aria-hidden
                    onChange={() => undefined}
                    onInvalid={handleValidationProxyInvalid}
                    hidden
                    className={`${classNameBase}visually-hidden`}
                />
            ) : null}

            {!isControlled ? <FormResetListener form={selectProps.form} onReset={handleFormReset} /> : null}
        </OptionListComponent>
    );
}
