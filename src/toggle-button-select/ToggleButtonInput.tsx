import type React from "react";
import { useMemo } from "react";

import type { Optgroup } from "../Optgroup";
import type { Option } from "../option-source";
import type { HTMLSelectElementSubset, SelectProps } from "../SelectProps";
import { cx } from "../utils/cx";

/**
 * Props for a `ToggleButtonInput` component.
 */
export interface ToggleButtonInputProps<TElement extends HTMLElement = HTMLFieldSetElement>
    extends
        Omit<
            SelectProps,
            "children" | "ref" | "value" | "defaultValue" | "onChange" | "onInput" | keyof React.DOMAttributes<HTMLSelectElementSubset>
        >,
        Omit<React.DOMAttributes<TElement>, "onChange" | "onInput"> {
    /**
     * The options displayed as toggle buttons.
     */
    options: Option[];

    /**
     * The selected option values.
     */
    value: string[];

    /**
     * Called with an option value when its selection is toggled.
     */
    onValueToggle: (selectedValue: string) => void;

    /**
     * A ref to the underlying toggle button group equivalent element.
     */
    ref?: React.Ref<TElement>;

    /**
     * Customization options for the toggle button group.
     */
    customization?: {
        classNamePrefix?: string;
        buttonGroup?: {
            className?: string;
            style?: React.CSSProperties;
        };
        button?: {
            className?: string;
            style?: React.CSSProperties;
        };
    };
}

/**
 * The default radio or checkbox group used by a toggle button select.
 */
export function ToggleButtonInput({
    autoComplete,
    autoFocus,
    className,
    customization,
    disabled,
    form,
    id,
    multiple,
    name,
    onValueToggle: onToggleValue,
    options,
    value: selectedValues,
    required,
    style,
    tabIndex,
    title,
    ref,
    ...fieldsetProps
}: ToggleButtonInputProps<HTMLFieldSetElement>) {
    const classNamePrefix = customization?.classNamePrefix ?? "super-select";
    const classNameBase = classNamePrefix.length > 0 ? `${classNamePrefix}__` : "";
    const selectedValueSet = useMemo(() => new Set<string>(selectedValues), [selectedValues]);
    const visibleOptions = useMemo(
        () => (options.find((option) => option.hidden) ? options.filter((option) => !option.hidden) : options),
        [options],
    );
    const firstAutoFocusValue = useMemo(() => {
        if (!autoFocus) {
            return undefined;
        }

        return visibleOptions.find((option) => !(disabled || option.disabled))?.value;
    }, [autoFocus, disabled, visibleOptions]);
    const optgroups = useMemo(() => buildOptgroups(visibleOptions), [visibleOptions]);
    const toggleButtonAriaLabel = (fieldsetProps["aria-label"] as string | undefined) ?? name;

    return (
        <fieldset
            ref={ref}
            {...fieldsetProps}
            id={id}
            disabled={disabled}
            role={multiple ? "group" : "radiogroup"}
            aria-disabled={disabled || undefined}
            aria-required={required || undefined}
            aria-label={toggleButtonAriaLabel}
            className={cx(classNamePrefix, `${classNameBase}btn-toolbar`, className)}
            style={style}
            title={title}
            tabIndex={tabIndex}
        >
            {optgroups.map(({ label, options: groupOptions }) => (
                <div
                    key={label}
                    className={cx(`${classNameBase}btn-group`, customization?.buttonGroup?.className)}
                    style={customization?.buttonGroup?.style}
                >
                    {groupOptions.map((option) => {
                        const isChecked = selectedValueSet.has(option.value);
                        const optionDisabled = disabled || option.disabled;
                        const inputType = multiple ? "checkbox" : "radio";

                        return (
                            <label
                                key={option.value}
                                className={cx(
                                    `${classNameBase}btn`,
                                    `${classNameBase}btn-outline-secondary`,
                                    isChecked && `${classNameBase}active`,
                                    optionDisabled && `${classNameBase}disabled`,
                                    customization?.button?.className,
                                )}
                                style={customization?.button?.style}
                            >
                                <input
                                    value={option.value}
                                    className={`${classNameBase}btn-check`}
                                    checked={isChecked}
                                    autoComplete={autoComplete}
                                    autoFocus={option.value === firstAutoFocusValue}
                                    disabled={optionDisabled}
                                    form={form}
                                    name={name}
                                    type={inputType}
                                    onChange={() => onToggleValue(option.value)}
                                    onClick={(event) => {
                                        if (multiple || !isChecked || optionDisabled) {
                                            return;
                                        }

                                        event.preventDefault();
                                        window.setTimeout(() => {
                                            onToggleValue(option.value);
                                        }, 0);
                                    }}
                                />
                                <span>{option.children ?? option.label}</span>
                            </label>
                        );
                    })}
                </div>
            ))}
        </fieldset>
    );
}

function buildOptgroups(options: Option[]): Optgroup[] {
    const nextOptgroups: Optgroup[] = [];
    let currentOptgroup: Optgroup | undefined;
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
