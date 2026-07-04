import type React from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { Option } from "../option-source";
import type { HTMLOptionElementSubset, HTMLSelectElementSubset, SelectProps } from "../SelectProps";
import { cx } from "../utils/cx";
import { normalizeSelectValue } from "../utils/normalizeSelectValue";

/**
 * Props for an `OptionListInput` component.
 */
export interface OptionListInputProps<
    TElement extends HTMLElement = HTMLFieldSetElement,
    TOptionElement extends HTMLInputElement | HTMLOptionElement | HTMLOptionElementSubset = HTMLInputElement,
>
    extends
        Omit<
            SelectProps,
            "children" | "ref" | "value" | "defaultValue" | "onChange" | "onInput" | keyof React.DOMAttributes<HTMLSelectElementSubset>
        >,
        Omit<React.DOMAttributes<TElement>, "onChange" | "onInput"> {
    /**
     * The options displayed in the list.
     */
    options: Option[];

    /**
     * The selected option values.
     */
    value: string[];

    /**
     * Called with the selected values when the selection changes.
     */
    onValueChange: (nextValues: string[]) => void;

    /**
     * Called when an option input is clicked.
     */
    onOptionClick?: React.MouseEventHandler<TOptionElement>;

    /**
     * Called when a key is pressed on an option input.
     */
    onOptionKeyDown?: React.KeyboardEventHandler<TOptionElement>;

    /**
     * Content displayed after the options.
     */
    indicator?: React.ReactNode;

    /**
     * A ref to the underlying option list equivalent element.
     */
    ref?: React.Ref<TElement>;

    /**
     * Customization options for the option list input.
     */
    customization?: {
        classNamePrefix?: string;
        optionItem?: {
            className?: string;
            style?: React.CSSProperties;
        };
        groupHeader?: {
            className?: string;
            style?: React.CSSProperties;
        };
    };
}

/**
 * The default radio or checkbox list used by an option list select.
 */
export function OptionListInput({
    autoComplete,
    autoFocus,
    className,
    disabled,
    form,
    id,
    multiple,
    name,
    required,
    style,
    tabIndex,
    title,
    options,
    value,
    onValueChange,
    onOptionClick,
    onOptionKeyDown,
    indicator,
    customization,
    ref,
    ...fieldsetProps
}: OptionListInputProps<HTMLFieldSetElement>) {
    const classNamePrefix = customization?.classNamePrefix ?? "super-select";
    const classNameBase = classNamePrefix.length > 0 ? `${classNamePrefix}__` : "";
    const highlightedOptionRef = useRef<HTMLElement | null>(null);
    const [highlightedValue, setHighlightedValue] = useState<string | undefined>(undefined);
    const internalInputName = useId();
    const visibleOptions = useMemo(() => (options.find((x) => x.hidden) ? options.filter((option) => !option.hidden) : options), [options]);
    const optgroups = useMemo(() => buildOptgroups(visibleOptions), [visibleOptions]);
    const orderedOptions = useMemo(
        () => (optgroups.length > 1 ? optgroups.flatMap((optgroup) => optgroup.options) : visibleOptions),
        [optgroups, visibleOptions],
    );

    const selectedValues = useMemo(() => {
        const normalizedValues = normalizeSelectValue(value);
        return multiple ? normalizedValues : normalizedValues.slice(0, 1);
    }, [multiple, value]);

    const selectedValueSet = useMemo(() => new Set<string>(selectedValues), [selectedValues]);
    const firstEnabledOptionValue = useMemo(() => orderedOptions.find((option) => !option.disabled)?.value, [orderedOptions]);
    const tabStopOptionValue = useMemo(() => {
        if (tabIndex === undefined || tabIndex === -1) {
            return undefined;
        }

        if (multiple) {
            return firstEnabledOptionValue;
        }

        const selectedEnabledValue = orderedOptions.find((option) => selectedValueSet.has(option.value) && !option.disabled)?.value;
        return selectedEnabledValue ?? firstEnabledOptionValue;
    }, [firstEnabledOptionValue, multiple, orderedOptions, selectedValueSet, tabIndex]);

    const displayedOptionValueSet = useMemo(() => new Set(orderedOptions.map((option) => option.value)), [orderedOptions]);
    const hiddenSelectedValues = useMemo(() => {
        if (!name) {
            return [] as string[];
        }

        return selectedValues.filter((selectedValue) => !displayedOptionValueSet.has(selectedValue));
    }, [displayedOptionValueSet, name, selectedValues]);

    const firstAutoFocusValue = useMemo(() => {
        if (!autoFocus) {
            return undefined;
        }

        return orderedOptions.find((option) => !(disabled || option.disabled))?.value;
    }, [autoFocus, disabled, orderedOptions]);

    const currentHighlightedValue = useMemo(() => {
        const highlightedEnabledValue = orderedOptions.find((option) => option.value === highlightedValue && !option.disabled)?.value;
        if (highlightedEnabledValue) {
            return highlightedEnabledValue;
        }

        const selectedEnabledValue = orderedOptions.find((option) => selectedValueSet.has(option.value) && !option.disabled)?.value;
        if (selectedEnabledValue) {
            return selectedEnabledValue;
        }

        return firstEnabledOptionValue;
    }, [firstEnabledOptionValue, highlightedValue, orderedOptions, selectedValueSet]);

    useEffect(() => {
        if (!currentHighlightedValue || highlightedValue === undefined) {
            return;
        }

        highlightedOptionRef.current?.scrollIntoView({ block: "nearest" });
    }, [currentHighlightedValue, highlightedValue]);

    const handleSelect = (selectedValue: string) => {
        if (disabled) {
            return;
        }

        const nextValues = multiple
            ? selectedValues.includes(selectedValue)
                ? selectedValues.filter((valueEntry) => valueEntry !== selectedValue)
                : [...selectedValues, selectedValue]
            : [selectedValue];
        onValueChange(nextValues);
    };

    const inputName = multiple ? name : (name ?? `option-list-${internalInputName}`);
    const optionListAriaLabel = (fieldsetProps["aria-label"] as string | undefined) ?? name;

    return (
        <fieldset
            ref={ref}
            {...fieldsetProps}
            id={id}
            role={multiple ? "group" : "radiogroup"}
            aria-label={optionListAriaLabel}
            aria-disabled={disabled || undefined}
            aria-required={required || undefined}
            disabled={disabled}
            className={cx(`${classNameBase}list-group`, className)}
            style={style}
            title={title}
            tabIndex={-1}
        >
            {optgroups.map((optgroup, groupIndex) => (
                <div key={optgroup.label || `group-${groupIndex}`}>
                    {optgroup.label ? (
                        <div
                            className={cx(
                                `${classNameBase}list-group-item`,
                                `${classNameBase}list-group-item-secondary`,
                                customization?.groupHeader?.className,
                            )}
                            style={customization?.groupHeader?.style}
                        >
                            {optgroup.label}
                        </div>
                    ) : null}

                    {optgroup.options.map((option) => {
                        const isChecked = selectedValueSet.has(option.value);
                        const isDisabled = disabled || option.disabled;

                        return (
                            <label
                                key={option.value}
                                ref={(node) => {
                                    if (option.value === currentHighlightedValue) {
                                        highlightedOptionRef.current = node;
                                    } else if (highlightedOptionRef.current === node) {
                                        highlightedOptionRef.current = null;
                                    }
                                }}
                                className={cx(
                                    `${classNameBase}list-group-item`,
                                    `${classNameBase}list-group-item-action`,
                                    isChecked ? `${classNameBase}active` : undefined,
                                    option.value === currentHighlightedValue ? `${classNameBase}focus-ring` : undefined,
                                    isDisabled ? `${classNameBase}disabled` : undefined,
                                    customization?.optionItem?.className,
                                )}
                                style={customization?.optionItem?.style}
                                onClick={() => {
                                    if (isDisabled) {
                                        return;
                                    }
                                    setHighlightedValue(option.value);
                                }}
                            >
                                <input
                                    type={multiple ? "checkbox" : "radio"}
                                    name={inputName}
                                    value={option.value}
                                    checked={isChecked}
                                    disabled={isDisabled}
                                    form={form}
                                    autoComplete={autoComplete}
                                    autoFocus={option.value === firstAutoFocusValue}
                                    tabIndex={
                                        tabIndex === undefined
                                            ? undefined
                                            : tabIndex === -1
                                              ? -1
                                              : option.value === tabStopOptionValue
                                                ? tabIndex
                                                : -1
                                    }
                                    onClick={onOptionClick}
                                    onKeyDown={onOptionKeyDown}
                                    onChange={() => handleSelect(option.value)}
                                    onFocus={() => {
                                        if (isDisabled) {
                                            return;
                                        }
                                        setHighlightedValue(option.value);
                                    }}
                                    className={cx(`${classNameBase}form-check-input`, `${classNameBase}me-1`)}
                                />

                                <span className={`${classNameBase}form-check-label`}>{option.children ?? option.label}</span>
                            </label>
                        );
                    })}
                </div>
            ))}

            {hiddenSelectedValues.map((selectedValue) => (
                <input
                    key={`hidden-selected-${selectedValue}`}
                    type="hidden"
                    name={name}
                    value={selectedValue}
                    form={form}
                    disabled={disabled}
                />
            ))}

            {indicator ? <div className={cx(`${classNameBase}list-group-item`)}>{indicator}</div> : null}
        </fieldset>
    );
}

function buildOptgroups(options: Option[]) {
    const nextOptgroups: { label: string; options: Option[] }[] = [];
    let currentOptgroup: { label: string; options: Option[] } | undefined;

    for (const option of options) {
        const groupLabel = option.groupLabel ?? "";
        if (currentOptgroup && currentOptgroup.label === groupLabel) {
            currentOptgroup.options.push(option);
            continue;
        }

        currentOptgroup = nextOptgroups.find((group) => group.label === groupLabel);
        if (currentOptgroup) {
            currentOptgroup.options.push(option);
            continue;
        }

        currentOptgroup = { label: groupLabel, options: [option] };
        nextOptgroups.push(currentOptgroup);
    }

    return nextOptgroups;
}
