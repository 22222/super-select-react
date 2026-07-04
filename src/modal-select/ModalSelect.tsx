import "../super-select.css";

import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { EmptyIndicatorProps } from "../option-list-select/EmptyIndicator";
import { EmptyIndicator } from "../option-list-select/EmptyIndicator";
import type { MoreIndicatorProps } from "../option-list-select/MoreIndicator";
import { MoreIndicator } from "../option-list-select/MoreIndicator";
import { OptionListInput, type OptionListInputProps } from "../option-list-select/OptionListInput";
import type { SearchInputProps } from "../option-list-select/SearchInput";
import { SearchInput } from "../option-list-select/SearchInput";
import { useOptionListController } from "../option-list-select/useOptionListController";
import type { Option, OptionSourceLike } from "../option-source";
import { type OptionSourceErrorLike } from "../option-source";
import type { AnyHTMLElement, HTMLOptionElementSubset, HTMLSelectElementSubset, SelectChangeValue, SelectProps } from "../SelectProps";
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
import type { CloseButtonProps } from "./CloseButton";
import type { ModalProps } from "./Modal";
import { Modal } from "./Modal";
import type { ModalSelectButtonProps } from "./ModalSelectButton";
import { ModalSelectButton } from "./ModalSelectButton";
import type { OkButtonProps } from "./OkButton";
import { OkButton } from "./OkButton";
import type { SelectedContentProps } from "./SelectedContent";
import { SelectedContent } from "./SelectedContent";

/**
 * Props for a `ModalSelect` component.
 */
export interface ModalSelectProps<Multiple extends boolean = boolean> extends SelectProps {
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
        modalSelectButton?: {
            className?: string;
            style?: React.CSSProperties;
            component?: React.ComponentType<ModalSelectButtonProps<AnyHTMLElement>>;
            selectedContent?: {
                className?: string;
                style?: React.CSSProperties;
                placeholder?: string;
                component?: React.ComponentType<SelectedContentProps>;
            };
        };
        modal?: {
            className?: string;
            style?: React.CSSProperties;
            component?: React.ComponentType<ModalProps>;
            dialog?: {
                className?: string;
                style?: React.CSSProperties;
            };
            content?: {
                className?: string;
                style?: React.CSSProperties;
            };
            header?: {
                className?: string;
                style?: React.CSSProperties;
            };
            body?: {
                className?: string;
                style?: React.CSSProperties;
            };
            footer?: {
                className?: string;
                style?: React.CSSProperties;
            };
            okButton?: {
                className?: string;
                style?: React.CSSProperties;
                title?: string;
                content?: React.ReactNode;
                component?: React.ComponentType<OkButtonProps>;
            };
            closeButton?: {
                className?: string;
                style?: React.CSSProperties;
                title?: string;
                component?: React.ComponentType<CloseButtonProps>;
                content?: React.ReactNode;
            };
        };
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
        searchInput?: {
            className?: string;
            style?: React.CSSProperties;
            placeholder?: string;
            title?: string;
            component?: React.ComponentType<SearchInputProps>;
        };
        errorIndicator?: {
            className?: string;
            style?: React.CSSProperties;
            icon?: React.ReactNode;
            defaultMessage?: React.ReactNode;
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
    };
}

/**
 * A select-compatible component that displays its options in a modal dialog.
 */
export function ModalSelect<Multiple extends boolean = false>({
    optionSource,
    children,
    customization,
    ref,
    multiple,
    disabled,
    required,
    value,
    defaultValue,
    name,
    id,
    form,
    autoFocus,
    autoComplete,
    onInput,
    onInvalid,
    onChange,
    onValueChange,
    className,
    style,
    ...nativeSelectProps
}: ModalSelectProps<Multiple>) {
    const [isOpen, setIsOpen] = useState(false);
    const [isRequiredInvalid, setIsRequiredInvalid] = useState(false);
    const staticOptions = useMemo(() => parseChildOptions(children), [children]);
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
        isOptionListActive: isOpen,
    });

    const handleOpen = useCallback(() => {
        if (disabled) {
            return;
        }

        setIsOpen(true);
    }, [disabled]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    const handleFormReset = useCallback(() => {
        if (isControlled) {
            return;
        }

        const initialValues = normalizeSelectValue(initialDefaultValueRef.current);
        controller.handleSelectedValuesChange(multiple ? initialValues : initialValues.slice(0, 1));
        setIsRequiredInvalid(false);
    }, [controller, isControlled, multiple, setIsRequiredInvalid]);

    const handleSelectedValuesChange = useCallback(
        (nextValues: string[]) => {
            if (disabled) {
                return;
            }

            controller.handleSelectedValuesChange(nextValues);
            if (!required || nextValues.length > 0) {
                setIsRequiredInvalid(false);
            }

            const target = createHTMLSelectElementSubsetTarget({
                id,
                name,
                value: multiple ? nextValues : (nextValues[0] ?? ""),
                multiple,
                disabled,
                required,
            });

            if (onInput) {
                onInput(createInputEvent(target, { data: "" }));
            }

            if (onChange) {
                onChange(createChangeEvent(target));
            }

            if (onValueChange) {
                onValueChange((multiple ? nextValues : (nextValues[0] ?? "")) as SelectChangeValue<Multiple>);
            }
        },
        [controller, disabled, id, multiple, name, onChange, onInput, onValueChange, required, setIsRequiredInvalid],
    );

    const handleModalOptionListChange = useCallback(
        (event: React.ChangeEvent<HTMLSelectElementSubset>) => {
            const selectedOptions = Array.from(event.currentTarget.selectedOptions).map((option) => option?.value ?? "");
            const nextValues = multiple
                ? selectedOptions
                : selectedOptions.length > 0
                  ? [selectedOptions[0] ?? ""]
                  : event.currentTarget.value === ""
                    ? []
                    : [event.currentTarget.value];

            handleSelectedValuesChange(nextValues);
        },
        [handleSelectedValuesChange, multiple],
    );

    const selectedOptions = useMemo(() => {
        if (controller.selectedValues.length === 0) {
            return [];
        }

        const optionsByValue = new Map<string, Option>();
        for (const option of staticOptions) {
            if (!optionsByValue.has(option.value)) {
                optionsByValue.set(option.value, option);
            }
        }
        for (const option of controller.options) {
            optionsByValue.set(option.value, option);
        }

        const matchedOptions = controller.selectedValues
            .map((selectedValue) => optionsByValue.get(selectedValue))
            .filter((option): option is Option => option !== undefined);

        if (matchedOptions.length > 0) {
            return matchedOptions;
        }

        return getFallbackSelectedOptions(controller.selectedValues, staticOptions);
    }, [controller.options, controller.selectedValues, staticOptions]);

    const eventTarget = useMemo(
        () =>
            createHTMLSelectElementSubsetTarget({
                id,
                name,
                value: multiple ? controller.selectedValues : (controller.selectedValues[0] ?? ""),
                multiple,
                disabled,
                required,
            }),
        [controller.selectedValues, disabled, id, multiple, name, required],
    );

    const modalSelectButtonProps = { ...nativeSelectProps, size: undefined };
    const modalAriaLabel = nativeSelectProps["aria-label"];
    const modalAriaLabelledBy = nativeSelectProps["aria-labelledby"] ?? (modalAriaLabel ? undefined : id);
    const triggerEventProps = retargetDomEventHandlers(eventTarget, modalSelectButtonProps);
    const handleSelectButtonClick = useCallback(
        (event: React.MouseEvent<AnyHTMLElement>) => {
            handleOpen();
            triggerEventProps.onClick?.(event);
        },
        [handleOpen, triggerEventProps],
    );

    const handleNativeSelectInvalid = useCallback(
        (event: React.InvalidEvent<HTMLSelectElement>) => {
            event.preventDefault();
            setIsRequiredInvalid(true);
            if (!onInvalid) {
                return;
            }

            onInvalid(createInvalidEvent(eventTarget));
        },
        [eventTarget, onInvalid, setIsRequiredInvalid],
    );

    const hasRequiredInvalid = isRequiredInvalid && Boolean(required) && controller.selectedValues.length === 0;
    const classNamePrefix = customization?.classNamePrefix ?? "super-select";
    const classNameBase = classNamePrefix.length > 0 ? `${classNamePrefix}__` : "";
    const placeholderOptionLabel = useMemo(() => staticOptions.find((option) => option.value === "")?.label, [staticOptions]);
    const selectedContentPlaceholder = customization?.modalSelectButton?.selectedContent?.placeholder ?? placeholderOptionLabel;
    const hasSelection = selectedOptions.length > 0;
    const hasSelectionError = Boolean(controller.resolveValuesError);
    const hasInvalidState = hasSelectionError || hasRequiredInvalid;
    const ErrorIndicatorComponent = customization?.errorIndicator?.component ?? ErrorIndicator;
    const PendingIndicatorComponent = customization?.pendingIndicator?.component ?? PendingIndicator;
    const ModalSelectButtonComponent: React.ComponentType<ModalSelectButtonProps<AnyHTMLElement>> =
        customization?.modalSelectButton?.component ?? ModalSelectButton;
    const SelectedContentComponent = customization?.modalSelectButton?.selectedContent?.component ?? SelectedContent;

    return (
        <>
            <ModalSelectButtonComponent
                {...modalSelectButtonProps}
                {...triggerEventProps}
                id={id}
                autoFocus={autoFocus}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-busy={controller.isResolveValuesPending || undefined}
                aria-invalid={hasInvalidState || undefined}
                disabled={disabled}
                className={cx(
                    disabled ? `${classNameBase}disabled` : undefined,
                    hasInvalidState ? `${classNameBase}is-invalid` : undefined,
                    className,
                    customization?.modalSelectButton?.className,
                )}
                style={
                    style && customization?.modalSelectButton?.style
                        ? { ...style, ...customization.modalSelectButton.style }
                        : (style ?? customization?.modalSelectButton?.style)
                }
                onClick={handleSelectButtonClick}
                ref={ref}
                customization={{ classNamePrefix }}
            >
                {hasSelectionError && controller.resolveValuesError ? (
                    <ErrorIndicatorComponent
                        inline
                        className={customization?.errorIndicator?.className}
                        style={customization?.errorIndicator?.style}
                        error={controller.resolveValuesError}
                        message={controller.resolveValuesError.userMessage ?? customization?.errorIndicator?.defaultMessage}
                        customization={{ classNamePrefix, icon: customization?.errorIndicator?.icon }}
                    />
                ) : controller.isResolveValuesPending ? (
                    <PendingIndicatorComponent
                        inline
                        className={customization?.pendingIndicator?.className}
                        style={customization?.pendingIndicator?.style}
                        title={customization?.pendingIndicator?.title}
                        content={customization?.pendingIndicator?.content}
                        customization={{ classNamePrefix }}
                    />
                ) : (
                    <SelectedContentComponent
                        selectedOptions={selectedOptions}
                        className={cx(
                            !hasSelection || hasSelectionError ? `${classNameBase}text-body-secondary` : undefined,
                            customization?.modalSelectButton?.selectedContent?.className,
                        )}
                        style={customization?.modalSelectButton?.selectedContent?.style}
                        customization={{ classNamePrefix, placeholder: selectedContentPlaceholder }}
                    />
                )}
            </ModalSelectButtonComponent>

            <ModalSelectModal
                customization={customization}
                isOpen={isOpen}
                dir={nativeSelectProps.dir}
                lang={nativeSelectProps.lang}
                ariaLabel={modalAriaLabel}
                ariaLabelledBy={modalAriaLabelledBy}
                onClose={handleClose}
                searchValue={controller.searchValue}
                onSearchChange={controller.handleSearchChange}
                options={controller.options}
                selectedValues={controller.selectedValues}
                multiple={multiple}
                isOptionsPending={controller.isOptionsPending}
                isSearching={controller.isSearching}
                isResolveValuesPending={controller.isResolveValuesPending}
                onRefresh={controller.handleRetryOptions}
                optionsError={controller.optionsError}
                onOptionListChange={handleModalOptionListChange}
                canLoadMore={controller.canLoadMore}
                hasMore={controller.hasMore}
                onLoadMore={controller.handleLoadMore}
            />

            {name || required ? (
                <select
                    name={name}
                    form={form}
                    autoComplete={autoComplete}
                    {...nativeSelectProps}
                    required={required}
                    disabled={disabled}
                    onInvalid={handleNativeSelectInvalid}
                    multiple={multiple}
                    value={multiple ? controller.selectedValues : (controller.selectedValues[0] ?? "")}
                    onChange={() => undefined}
                    aria-hidden
                    hidden
                    tabIndex={-1}
                    className={`${classNameBase}visually-hidden`}
                >
                    {controller.selectedValues.map((selectedValue) => (
                        <option key={selectedValue} value={selectedValue}>
                            {selectedValue}
                        </option>
                    ))}
                </select>
            ) : null}

            {!isControlled ? <FormResetListener form={form} onReset={handleFormReset} /> : null}
        </>
    );
}

function getFallbackSelectedOptions(selectedValues: string[], staticOptions: Option[]) {
    if (selectedValues.length === 0) {
        return [];
    }

    const staticOptionsByValue = new Map(staticOptions.map((option) => [option.value, option]));

    return selectedValues
        .map((selectedValue) => staticOptionsByValue.get(selectedValue))
        .filter((option): option is Option => option !== undefined);
}

interface ModalSelectModalProps {
    isOpen: boolean;
    dir?: string;
    lang?: string;
    ariaLabel?: string;
    ariaLabelledBy?: string;
    onClose: () => void;
    searchValue: string;
    onSearchChange: (value: string) => void;
    options: Option[];
    selectedValues: string[];
    multiple?: boolean;
    isOptionsPending?: boolean;
    isSearching?: boolean;
    isResolveValuesPending?: boolean;
    onRefresh?: () => void;
    onOptionListChange: (event: React.ChangeEvent<HTMLSelectElementSubset>) => void;
    optionsError?: OptionSourceErrorLike;
    canLoadMore?: boolean;
    onLoadMore: () => void;
    hasMore?: boolean;
    customization?: ModalSelectProps["customization"];
}

function ModalSelectModal({
    customization,
    isOpen,
    dir,
    lang,
    ariaLabel,
    ariaLabelledBy,
    onClose,
    searchValue,
    onSearchChange,
    options,
    selectedValues,
    multiple,
    isOptionsPending,
    isSearching,
    isResolveValuesPending,
    onRefresh,
    optionsError,
    onOptionListChange,
    canLoadMore,
    onLoadMore,
    hasMore,
}: ModalSelectModalProps) {
    const classNamePrefix = customization?.classNamePrefix ?? "super-select";
    const classNameBase = classNamePrefix.length > 0 ? `${classNamePrefix}__` : "";
    const SearchInputComponent = customization?.searchInput?.component ?? SearchInput;
    const OkButtonComponent = customization?.modal?.okButton?.component ?? OkButton;
    const ModalComponent = customization?.modal?.component ?? Modal;
    const OptionListInputComponent = customization?.optionListInput?.component ?? OptionListInput;
    const ErrorIndicatorComponent = customization?.errorIndicator?.component ?? ErrorIndicator;
    const EmptyIndicatorComponent = customization?.emptyIndicator?.component ?? EmptyIndicator;
    const MoreIndicatorComponent = customization?.moreIndicator?.component ?? MoreIndicator;
    const PendingIndicatorComponent = customization?.pendingIndicator?.component ?? PendingIndicator;

    const searchInputRef = useRef<HTMLInputElement>(null);
    const suppressCloseForNextChangeRef = useRef(false);

    const showSearchLoadingState = Boolean(isSearching);
    const isOptionListPending = Boolean(isOptionsPending || isResolveValuesPending);
    const normalizedSelectedValues = useMemo(() => {
        const values = normalizeSelectValue(selectedValues);
        return multiple ? values : values.slice(0, 1);
    }, [multiple, selectedValues]);
    const hasOptions = options.length > 0;
    const isPending = isOptionListPending;
    const optionListError = optionsError;
    const isError = Boolean(optionListError);
    const isEmpty = !isError && !isPending && !hasOptions;
    const isMore = !isError && !isPending && !isEmpty && Boolean(hasMore);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const searchInput = searchInputRef.current;
        if (!searchInput) {
            return;
        }

        const timer = window.setTimeout(() => {
            searchInput.focus();
        }, 0);

        return () => {
            window.clearTimeout(timer);
        };
    }, [isOpen]);

    const handleSearchKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
                return;
            }

            if (event.key === "Enter") {
                event.preventDefault();
                return;
            }

            const direction = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
            if (!direction) {
                return;
            }

            const scope =
                event.currentTarget.closest<HTMLElement>(
                    [
                        `.${classNameBase}modal-content`,
                        "[class*='modal-content']",
                        "[class*='modal-body']",
                        "dialog",
                        "[role='dialog']",
                        "[aria-modal='true']",
                    ].join(","),
                ) ?? event.currentTarget.parentElement;
            if (!scope) {
                return;
            }

            const optionListScope =
                scope.querySelector<HTMLElement>(
                    ["[role='listbox']", "[role='radiogroup']", "[role='group']", "fieldset", "[class*='modal-body']"].join(","),
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

                const style = window.getComputedStyle(element);
                return style.display !== "none" && style.visibility !== "hidden";
            });

            const nextElement = direction > 0 ? optionLikeElements[0] : optionLikeElements[optionLikeElements.length - 1];
            if (!nextElement) {
                return;
            }

            event.preventDefault();
            nextElement.focus();
        },
        [classNameBase],
    );

    const handleOptionListChange = useCallback(
        (event: React.ChangeEvent<HTMLSelectElementSubset>) => {
            onOptionListChange(event);

            if (!multiple) {
                if (suppressCloseForNextChangeRef.current) {
                    suppressCloseForNextChangeRef.current = false;
                    return;
                }

                onClose();
            }
        },
        [multiple, onClose, onOptionListChange],
    );

    const handleOptionListValueChange = useCallback(
        (nextValues: string[]) => {
            const normalizedValues = multiple ? nextValues : nextValues.slice(0, 1);
            const changeTarget = createHTMLSelectElementSubsetTarget({
                value: multiple ? normalizedValues : (normalizedValues[0] ?? ""),
                multiple,
            });

            handleOptionListChange(createChangeEvent(changeTarget));
        },
        [handleOptionListChange, multiple],
    );

    const handleOptionClick = useCallback(
        (event: React.MouseEvent<HTMLInputElement | HTMLOptionElement | HTMLOptionElementSubset>) => {
            if (multiple) {
                return;
            }

            // Keyboard interactions can synthesize click events on radios/checkboxes.
            // Keep click-close behavior only for actual pointer clicks.
            if (event.detail <= 0) {
                return;
            }

            suppressCloseForNextChangeRef.current = false;

            const optionElement = event.currentTarget;
            let isOptionSelected: boolean;
            if ("checked" in optionElement && typeof optionElement.checked === "boolean") {
                isOptionSelected = optionElement.checked;
            } else if ("selected" in optionElement && typeof optionElement.selected === "boolean") {
                isOptionSelected = optionElement.selected;
            } else {
                isOptionSelected = false;
            }
            if (isOptionSelected) {
                onClose();
            }
        },
        [multiple, onClose],
    );

    const handleOptionKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement | HTMLOptionElement | HTMLOptionElementSubset>) => {
            if (multiple) {
                return;
            }

            const isArrowKey =
                event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "ArrowLeft" || event.key === "ArrowRight";
            if (isArrowKey) {
                suppressCloseForNextChangeRef.current = true;
                return;
            }

            suppressCloseForNextChangeRef.current = false;

            const isCommitKey = event.key === "Enter" || event.key === " " || event.key === "Spacebar";
            if (isCommitKey) {
                const optionElement = event.currentTarget;
                let isOptionSelected: boolean;
                if ("checked" in optionElement && typeof optionElement.checked === "boolean") {
                    isOptionSelected = optionElement.checked;
                } else if ("selected" in optionElement && typeof optionElement.selected === "boolean") {
                    isOptionSelected = optionElement.selected;
                } else {
                    isOptionSelected = false;
                }
                if (isOptionSelected) {
                    event.preventDefault();
                    event.stopPropagation();
                    onClose();
                }
            }
        },
        [multiple, onClose],
    );

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
                onRetry={onRefresh}
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
                onRetry={onRefresh}
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
                onLoadMore={canLoadMore ? onLoadMore : undefined}
                className={customization?.moreIndicator?.className}
                style={customization?.moreIndicator?.style}
                disabled={isOptionListPending}
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

    return (
        <ModalComponent
            open={isOpen}
            dir={dir}
            lang={lang}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-busy={isOptionsPending || isResolveValuesPending || undefined}
            className={customization?.modal?.className}
            style={customization?.modal?.style}
            customization={{
                classNamePrefix,
                dialog: customization?.modal?.dialog,
                content: customization?.modal?.content,
                header: customization?.modal?.header,
                body: customization?.modal?.body,
                footer: customization?.modal?.footer,
                closeButton: customization?.modal?.closeButton,
            }}
            onClose={() => {
                onClose();
            }}
            onCancel={onClose}
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
            headerContent={
                <SearchInputComponent
                    ref={searchInputRef}
                    className={customization?.searchInput?.className}
                    style={customization?.searchInput?.style}
                    search={searchValue}
                    onSearchChange={(nextSearch) => onSearchChange(nextSearch ?? "")}
                    onKeyDown={handleSearchKeyDown}
                    isSearching={showSearchLoadingState}
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
            }
            footerContent={
                multiple ? (
                    <OkButtonComponent
                        className={customization?.modal?.okButton?.className}
                        style={customization?.modal?.okButton?.style}
                        title={customization?.modal?.okButton?.title}
                        onClick={onClose}
                        customization={{ classNamePrefix, content: customization?.modal?.okButton?.content }}
                    />
                ) : undefined
            }
        >
            <OptionListInputComponent
                options={options}
                value={normalizedSelectedValues}
                onValueChange={handleOptionListValueChange}
                multiple={multiple}
                form=""
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                    }

                    const isArrowKey =
                        event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "ArrowLeft" || event.key === "ArrowRight";
                    if (isArrowKey) {
                        suppressCloseForNextChangeRef.current = true;
                        return;
                    }

                    suppressCloseForNextChangeRef.current = false;
                }}
                onOptionClick={handleOptionClick}
                onOptionKeyDown={handleOptionKeyDown}
                customization={{
                    classNamePrefix,
                    optionItem: customization?.optionListInput?.optionItem,
                    groupHeader: customization?.optionListInput?.groupHeader,
                }}
                className={customization?.optionListInput?.className}
                style={customization?.optionListInput?.style}
                aria-busy={isOptionListPending}
                indicator={indicator}
            />
        </ModalComponent>
    );
}
