import type React from "react";
import { Children, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ModalSelect } from "./modal-select";
import { OptionListSelect } from "./option-list-select";
import { convertToOptionSourceError, type Option, type OptionSourceErrorLike, type OptionSourceLike } from "./option-source";
import type { HTMLSelectElementSubset, SelectChangeValue, SelectProps } from "./SelectProps";
import type { SuperSelectCustomization } from "./SuperSelectCustomization";
import { ToggleButtonSelect } from "./toggle-button-select";
import { createHTMLSelectElementSubsetTarget, createInvalidEvent } from "./utils/createSyntheticEvent";
import { cx } from "./utils/cx";
import { ErrorIndicator } from "./utils/ErrorIndicator";
import { Fallback } from "./utils/Fallback";
import { FormResetListener } from "./utils/FormResetListener";
import { mergeOptions } from "./utils/mergeOptions";
import { normalizeSelectValue } from "./utils/normalizeSelectValue";
import { parseChildOptions } from "./utils/parseChildOptions";
import { PendingIndicator } from "./utils/PendingIndicator";

/**
 * Props for a `SuperSelect` component.
 * Includes the standard select props plus display mode, option source, value callback, and UI customization options.
 */
export interface SuperSelectProps<Multiple extends boolean = boolean> extends SelectProps {
    /**
     * Whether more than one option can be selected.
     * A literal `true` or `false` also determines the value type passed to `onValueChange`.
     */
    multiple?: Multiple;

    /**
     * The mode used to display the select, or a function that chooses a mode from the current options and state.
     * Defaults to `"modal"` when omitted or when a resolver returns `undefined`.
     */
    mode?: SuperSelectMode | SuperSelectModeResolver;

    /**
     * A source that loads options and supports searching, pagination, and selected-value resolution.
     * Options provided as children can be used alongside options from the source.
     */
    optionSource?: OptionSourceLike;

    /**
     * Called with the selected value whenever the selection changes.
     * Receives a string for a single select and a string array for a multiple select.
     * This is a convenience callback and does not replace the standard `onChange` event.
     */
    onValueChange?: (value: SelectChangeValue<Multiple>) => void;

    /**
     * Classes, styles, content, and replacement components used to customize the rendered UI.
     */
    customization?: SuperSelectCustomization;
}

/**
 * A display mode supported by `SuperSelect`.
 */
export type SuperSelectMode = "modal" | "native" | "option-list" | "toggle-button";

/**
 * Selects a display mode from the current options and select state.
 * Returning `undefined` uses the default `"modal"` mode.
 */
export type SuperSelectModeResolver = (context: SuperSelectModeResolutionContext) => SuperSelectMode | undefined;

/**
 * Information provided to a `SuperSelectModeResolver` when selecting a display mode.
 */
export interface SuperSelectModeResolutionContext {
    /**
     * The options currently available to the select.
     */
    options: Option[];

    /**
     * Whether more than one option can be selected.
     */
    multiple: boolean;

    /**
     * Whether the select element is disabled.
     */
    disabled: boolean;

    /**
     * Whether the select element requires a value.
     */
    required: boolean;

    /**
     * Whether the option source has another page of options.
     */
    hasMore: boolean;

    /**
     * The error from loading options, if the optionSource reported an error.
     */
    error?: OptionSourceErrorLike;

    /**
     * The option source used to load options, if any.
     */
    optionSource?: OptionSourceLike;
}

/**
 * Renders a select using the configured display mode while preserving the standard select API.
 */
export function SuperSelect<Multiple extends boolean = false>({
    mode,
    optionSource,
    customization,
    ref,
    children,
    multiple,
    disabled,
    required,
    value,
    defaultValue,
    onChange,
    onInvalid,
    onValueChange,
    className,
    style,
    ...selectProps
}: SuperSelectProps<Multiple>) {
    useOptionSourceIdentityWarning(optionSource);

    const requestedMode = typeof mode === "function" ? undefined : mode;
    const modeResolver = typeof mode === "function" ? mode : undefined;

    const shouldLoadOptions =
        Boolean(optionSource) && (Boolean(modeResolver) || (requestedMode !== undefined && !modeSupportsOptionSource(requestedMode)));
    const [loadOptionsRetryCount, setLoadOptionsRetryCount] = useState(0);
    const optionsLoadKey = useMemo(
        () => ({ optionSource, retryCount: loadOptionsRetryCount, shouldLoadOptions }),
        [loadOptionsRetryCount, optionSource, shouldLoadOptions],
    );
    const [optionsState, setOptionsState] = useState<OptionLoadState>(() =>
        shouldLoadOptions ? createPendingOptionsState(optionsLoadKey) : EMPTY_OPTIONS_STATE,
    );
    useEffect(() => {
        if (!optionSource || !shouldLoadOptions) {
            return;
        }

        const controller = new AbortController();
        let cancelled = false;
        Promise.resolve()
            .then(() => {
                if (cancelled || controller.signal.aborted) {
                    return;
                }
                setOptionsState(createPendingOptionsState(optionsLoadKey));
                return optionSource.getOptionPage({ signal: controller.signal });
            })
            .then((result) => {
                if (!result || cancelled || controller.signal.aborted) {
                    return;
                }
                setOptionsState({
                    loadKey: optionsLoadKey,
                    options: result.options,
                    hasMore: Boolean(result.hasMore),
                    isPending: false,
                    error: undefined,
                });
            })
            .catch((loadError: unknown) => {
                if (cancelled || controller.signal.aborted) {
                    return;
                }
                setOptionsState({
                    loadKey: optionsLoadKey,
                    options: [],
                    hasMore: false,
                    isPending: false,
                    error: convertToOptionSourceError(loadError),
                });
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [optionSource, optionsLoadKey, shouldLoadOptions]);

    const staticOptions = useMemo(() => parseChildOptions(children), [children]);
    let resolvedOptionsState = EMPTY_OPTIONS_STATE;
    if (shouldLoadOptions) {
        resolvedOptionsState = optionsState.loadKey === optionsLoadKey ? optionsState : createPendingOptionsState(optionsLoadKey);
    }

    const resolvedOptions = useMemo(
        () => mergeOptions(staticOptions, resolvedOptionsState.options),
        [resolvedOptionsState.options, staticOptions],
    );

    const resolvedMode = useMemo<SuperSelectMode>(() => {
        if (requestedMode) {
            return requestedMode;
        }
        if (modeResolver) {
            const resolvedMode = modeResolver({
                options: resolvedOptions,
                hasMore: resolvedOptionsState.hasMore,
                multiple: Boolean(multiple),
                disabled: Boolean(disabled),
                required: Boolean(required),
                optionSource,
                error: resolvedOptionsState.error,
            });
            if (resolvedMode) {
                return resolvedMode;
            }
        }
        return "modal";
    }, [
        disabled,
        resolvedOptions,
        modeResolver,
        multiple,
        optionSource,
        requestedMode,
        required,
        resolvedOptionsState.error,
        resolvedOptionsState.hasMore,
    ]);

    const isControlled = value !== undefined;
    const initialDefaultValueRef = useRef(defaultValue);
    const [uncontrolledValue, setUncontrolledValue] = useState<string | number | readonly string[] | undefined>(undefined);
    const [formResetKey, setFormResetKey] = useState(0);
    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLSelectElement | HTMLSelectElementSubset>) => {
            const selectedOptions = Array.from(event.currentTarget.selectedOptions).map((option) => option?.value ?? "");

            let nextValues: string[] = [];
            if (multiple && selectedOptions.length > 0) {
                nextValues = selectedOptions;
            } else if (event.currentTarget.value && event.currentTarget.value.length > 0) {
                nextValues = [event.currentTarget.value];
            }

            if (!isControlled) {
                setUncontrolledValue(multiple ? nextValues : (nextValues[0] ?? ""));
            }
            if (onValueChange) {
                onValueChange((multiple ? nextValues : (nextValues[0] ?? "")) as SelectChangeValue<Multiple>);
            }
            if (onChange) {
                onChange(event);
            }
        },
        [isControlled, multiple, onChange, onValueChange],
    );

    const canUseFetchedOptionsAsChildren =
        shouldLoadOptions &&
        !resolvedOptionsState.isPending &&
        resolvedOptionsState.error === undefined &&
        (!modeSupportsOptionSource(resolvedMode) || !resolvedOptionsState.hasMore);
    const optionSourceForMode =
        optionSource && modeSupportsOptionSource(resolvedMode) && !canUseFetchedOptionsAsChildren ? optionSource : undefined;
    const resolvedChildren = canUseFetchedOptionsAsChildren
        ? createFallbackChildren(children, staticOptions, resolvedOptionsState.options)
        : children;

    const currentDefaultValue = uncontrolledValue === undefined ? defaultValue : uncontrolledValue;

    const selectedValuesForAsyncState = useMemo(() => {
        const nextValues = normalizeSelectValue(isControlled ? value : currentDefaultValue);
        return multiple ? nextValues : nextValues.slice(0, 1);
    }, [currentDefaultValue, isControlled, multiple, value]);

    const handleRetryLoadOptions = useCallback(() => {
        setLoadOptionsRetryCount((currentValue) => currentValue + 1);
    }, []);

    const handleFormReset = useCallback(() => {
        if (isControlled) {
            return;
        }

        setUncontrolledValue(initialDefaultValueRef.current);
        setFormResetKey((currentKey) => currentKey + 1);
    }, [isControlled]);

    const classNamePrefix = customization?.classNamePrefix ?? "super-select";
    const classNameBase = classNamePrefix.length > 0 ? `${classNamePrefix}__` : "";
    const FallbackComponent = customization?.fallback?.component ?? Fallback;
    const PendingIndicatorComponent = customization?.pendingIndicator?.component ?? PendingIndicator;
    const ErrorIndicatorComponent = customization?.errorIndicator?.component ?? ErrorIndicator;
    const fallbackClassName = cx(className, customization?.fallback?.className);
    const fallbackStyle =
        style && customization?.fallback?.style ? { ...style, ...customization.fallback.style } : (style ?? customization?.fallback?.style);
    let fallbackContent: React.ReactNode;
    if (shouldLoadOptions && resolvedOptionsState.isPending) {
        fallbackContent = (
            <PendingIndicatorComponent
                inline
                className={customization?.pendingIndicator?.className}
                style={customization?.pendingIndicator?.style}
                title={customization?.pendingIndicator?.title}
                content={customization?.pendingIndicator?.content}
                customization={{ classNamePrefix }}
            />
        );
    } else if (shouldLoadOptions && resolvedOptionsState.error) {
        fallbackContent = (
            <ErrorIndicatorComponent
                className={customization?.errorIndicator?.className}
                style={customization?.errorIndicator?.style}
                error={resolvedOptionsState.error}
                message={resolvedOptionsState.error.userMessage ?? customization?.errorIndicator?.defaultMessage}
                onRetry={handleRetryLoadOptions}
                customization={{
                    classNamePrefix,
                    icon: customization?.errorIndicator?.icon,
                    retryButton: customization?.errorIndicator?.retryButton,
                }}
            />
        );
    }

    const hiddenValueFields =
        selectProps.name && selectedValuesForAsyncState.length > 0 ? (
            multiple ? (
                selectedValuesForAsyncState.map((selectedValue, selectedValueIndex) => (
                    <input
                        key={`super-select-async-hidden-value-${selectedValue}-${selectedValueIndex}`}
                        type="hidden"
                        name={selectProps.name}
                        value={selectedValue}
                        form={selectProps.form}
                        disabled={disabled}
                    />
                ))
            ) : (
                <input
                    type="hidden"
                    name={selectProps.name}
                    value={selectedValuesForAsyncState[0] ?? ""}
                    form={selectProps.form}
                    disabled={disabled}
                />
            )
        ) : null;

    if (fallbackContent) {
        return (
            <>
                <FallbackComponent
                    id={selectProps.id}
                    aria-busy={resolvedOptionsState.isPending || undefined}
                    aria-describedby={selectProps["aria-describedby"] as string | undefined}
                    aria-label={selectProps["aria-label"] as string | undefined}
                    aria-labelledby={selectProps["aria-labelledby"] as string | undefined}
                    accessKey={selectProps.accessKey}
                    className={fallbackClassName}
                    dir={selectProps.dir}
                    hidden={selectProps.hidden}
                    lang={selectProps.lang}
                    style={fallbackStyle}
                    tabIndex={selectProps.tabIndex}
                    title={selectProps.title}
                    customization={{ classNamePrefix }}
                >
                    {fallbackContent}
                </FallbackComponent>

                {hiddenValueFields}
                {required ? (
                    <select
                        required
                        disabled={disabled}
                        form={selectProps.form}
                        multiple={multiple}
                        value={multiple ? selectedValuesForAsyncState : (selectedValuesForAsyncState[0] ?? "")}
                        onChange={() => undefined}
                        onInvalid={(event) => {
                            event.preventDefault();
                            if (onInvalid) {
                                onInvalid(
                                    createInvalidEvent(
                                        createHTMLSelectElementSubsetTarget({
                                            id: selectProps.id,
                                            name: selectProps.name,
                                            value: multiple ? selectedValuesForAsyncState : (selectedValuesForAsyncState[0] ?? ""),
                                            multiple,
                                            disabled,
                                            required,
                                        }),
                                    ),
                                );
                            }
                        }}
                        aria-hidden
                        tabIndex={-1}
                        className={`${classNameBase}visually-hidden`}
                    >
                        {selectedValuesForAsyncState.map((selectedValue) => (
                            <option key={selectedValue} value={selectedValue}>
                                {selectedValue}
                            </option>
                        ))}
                    </select>
                ) : null}
                {!isControlled ? <FormResetListener form={selectProps.form} onReset={handleFormReset} /> : null}
            </>
        );
    }

    return (
        <>
            <SuperSelectModeComponent
                key={formResetKey}
                ref={ref}
                {...selectProps}
                mode={resolvedMode}
                className={className}
                style={style}
                multiple={multiple}
                disabled={disabled}
                required={required}
                value={value}
                defaultValue={isControlled ? undefined : currentDefaultValue}
                onChange={handleChange}
                onInvalid={onInvalid}
                optionSource={optionSourceForMode}
                customization={customization}
            >
                {resolvedChildren}
            </SuperSelectModeComponent>
            {!isControlled ? <FormResetListener form={selectProps.form} onReset={handleFormReset} /> : null}
        </>
    );
}

interface SuperSelectModeComponentProps extends Omit<SelectProps, "children" | "onChange"> {
    mode: SuperSelectMode;
    onChange: React.ChangeEventHandler<HTMLSelectElement | HTMLSelectElementSubset>;
    optionSource?: OptionSourceLike;
    customization?: SuperSelectCustomization;
    children?: React.ReactNode;
}

function SuperSelectModeComponent({
    mode,
    onChange,
    optionSource,
    customization,
    children,
    ref,
    ...selectProps
}: SuperSelectModeComponentProps) {
    const classNamePrefix = customization?.classNamePrefix ?? "super-select";

    if (mode === "option-list") {
        return (
            <OptionListSelect ref={ref} {...selectProps} onChange={onChange} optionSource={optionSource} customization={customization}>
                {children}
            </OptionListSelect>
        );
    }

    if (mode === "toggle-button") {
        return (
            <ToggleButtonSelect
                ref={ref}
                {...selectProps}
                className={customization?.toggleButtonInput?.className ?? selectProps.className}
                style={
                    selectProps.style && customization?.toggleButtonInput?.style
                        ? { ...selectProps.style, ...customization.toggleButtonInput.style }
                        : (selectProps.style ?? customization?.toggleButtonInput?.style)
                }
                onChange={onChange}
                customization={customization ? { classNamePrefix, ...customization.toggleButtonInput } : undefined}
            >
                {children}
            </ToggleButtonSelect>
        );
    }

    if (mode === "native") {
        const classNameBase = classNamePrefix.length > 0 ? `${classNamePrefix}__` : "";
        const NativeSelectComponent = customization?.selectInput?.component ?? SuperSelectNativeSelect;
        let nativeSelectClassName = customization?.selectInput?.className ?? selectProps.className;
        if (NativeSelectComponent === SuperSelectNativeSelect) {
            nativeSelectClassName = cx(`${classNameBase}form-select`, nativeSelectClassName);
        }

        return (
            <NativeSelectComponent
                ref={ref}
                {...selectProps}
                className={nativeSelectClassName}
                style={
                    selectProps.style && customization?.selectInput?.style
                        ? { ...selectProps.style, ...customization.selectInput.style }
                        : (selectProps.style ?? customization?.selectInput?.style)
                }
                onChange={onChange}
            >
                {children}
            </NativeSelectComponent>
        );
    }

    return (
        <ModalSelect ref={ref} {...selectProps} onChange={onChange} optionSource={optionSource} customization={customization}>
            {children}
        </ModalSelect>
    );
}

function SuperSelectNativeSelect({
    ref,
    ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { ref?: React.Ref<HTMLSelectElement> }) {
    return <select ref={ref} {...props} />;
}

function modeSupportsOptionSource(mode: SuperSelectMode) {
    return mode === "modal" || mode === "option-list";
}

declare const process: { env: { NODE_ENV?: string } };

/**
 * Warns in development when the optionSource prop looks like it is recreated on every render,
 * which discards cached options and repeats fetch requests.
 */
function useOptionSourceIdentityWarning(optionSource: OptionSourceLike | undefined) {
    const previousOptionSourceRef = useRef(optionSource);
    const changeCountRef = useRef(0);
    const changeWindowStartRef = useRef(0);

    useEffect(() => {
        if (process.env.NODE_ENV === "production") {
            return;
        }

        const previousOptionSource = previousOptionSourceRef.current;
        previousOptionSourceRef.current = optionSource;
        if (!optionSource || !previousOptionSource || optionSource === previousOptionSource) {
            return;
        }

        const now = Date.now();
        if (now - changeWindowStartRef.current > 2000) {
            changeWindowStartRef.current = now;
            changeCountRef.current = 0;
        }

        changeCountRef.current += 1;
        if (changeCountRef.current === 5) {
            console.warn(
                "SuperSelect: the optionSource prop changed identity 5 times within 2 seconds. " +
                    "Each new option source discards cached options and fetches again. " +
                    "If the source is created during render, keep one instance across renders with the useOptionSource hook or useMemo.",
            );
        }
    });
}

function createFallbackChildren(children: React.ReactNode, staticOptions: Option[], asyncOptions: Option[]): React.ReactNode {
    if (asyncOptions.length === 0) {
        return children;
    }

    const resolvedAsyncOptions: Option[] = [];
    const seenValues = new Set(staticOptions.map((option) => option.value));
    for (const option of asyncOptions) {
        if (seenValues.has(option.value)) {
            continue;
        }
        seenValues.add(option.value);
        resolvedAsyncOptions.push(option);
    }

    if (resolvedAsyncOptions.length === 0) {
        return children;
    }

    const asyncChildrenArray: React.ReactNode[] = [];
    let cursor = 0;
    let index = 0;
    while (cursor < resolvedAsyncOptions.length) {
        const option = resolvedAsyncOptions[cursor];
        const groupLabel = option.groupLabel;

        if (!groupLabel) {
            asyncChildrenArray.push(
                <option
                    key={`super-select-async-option-${index}-${option.value}`}
                    value={option.value}
                    disabled={option.disabled}
                    hidden={option.hidden}
                    label={option.label}
                >
                    {option.children ?? option.label}
                </option>,
            );
            cursor += 1;
            index += 1;
            continue;
        }

        const groupOptions: Option[] = [];
        while (cursor < resolvedAsyncOptions.length && resolvedAsyncOptions[cursor].groupLabel === groupLabel) {
            groupOptions.push(resolvedAsyncOptions[cursor]);
            cursor += 1;
            index += 1;
        }

        asyncChildrenArray.push(
            <optgroup key={`super-select-async-group-${index}-${groupLabel}`} label={groupLabel}>
                {groupOptions.map((groupOption, groupIndex) => (
                    <option
                        key={`super-select-async-group-option-${index}-${groupIndex}-${groupOption.value}`}
                        value={groupOption.value}
                        disabled={groupOption.disabled}
                        hidden={groupOption.hidden}
                        label={groupOption.label}
                    >
                        {groupOption.children ?? groupOption.label}
                    </option>
                ))}
            </optgroup>,
        );
    }

    if (!children) {
        return asyncChildrenArray;
    }

    const childrenArray = Children.toArray(children);
    if (childrenArray.length === 0) {
        return asyncChildrenArray;
    }

    return [...childrenArray, ...asyncChildrenArray];
}

interface OptionLoadKey {
    optionSource?: OptionSourceLike;
    retryCount: number;
    shouldLoadOptions: boolean;
}

interface OptionLoadState {
    loadKey?: OptionLoadKey;
    options: Option[];
    hasMore: boolean;
    isPending: boolean;
    error?: OptionSourceErrorLike;
}

const EMPTY_OPTIONS_STATE: OptionLoadState = {
    options: [],
    hasMore: false,
    isPending: false,
    error: undefined,
};

const PENDING_OPTIONS_STATE: OptionLoadState = {
    options: [],
    hasMore: false,
    isPending: true,
    error: undefined,
};

function createPendingOptionsState(loadKey: OptionLoadKey): OptionLoadState {
    return {
        ...PENDING_OPTIONS_STATE,
        loadKey,
    };
}
