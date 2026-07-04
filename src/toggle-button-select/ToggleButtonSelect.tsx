import "../super-select.css";

import { useCallback, useId, useMemo, useRef, useState } from "react";

import type { AnyHTMLElement, HTMLSelectElementSubset, SelectChangeValue, SelectProps } from "../SelectProps";
import {
    createChangeEvent,
    createHTMLSelectElementSubsetTarget,
    createInputEvent,
    createInvalidEvent,
    retargetDomEventHandlers,
} from "../utils/createSyntheticEvent";
import { FormResetListener } from "../utils/FormResetListener";
import { normalizeSelectValue } from "../utils/normalizeSelectValue";
import { parseChildOptions } from "../utils/parseChildOptions";
import { ToggleButtonInput, type ToggleButtonInputProps } from "./ToggleButtonInput";

/**
 * Props for a `ToggleButtonSelect` component.
 */
export interface ToggleButtonSelectProps<Multiple extends boolean = boolean> extends SelectProps {
    /**
     * Whether more than one option can be selected.
     */
    multiple?: Multiple;

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
        component?: React.ComponentType<ToggleButtonInputProps<AnyHTMLElement>>;
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
 * A select-compatible component that renders radio buttons or checkboxes that look like toggle buttons.
 */
export function ToggleButtonSelect<Multiple extends boolean = false>({
    autoComplete,
    autoFocus,
    children,
    className,
    customization,
    defaultValue,
    disabled,
    form,
    id,
    multiple,
    name,
    required,
    style,
    tabIndex,
    title,
    value,
    onChange,
    onInput,
    onValueChange,
    onInvalid,
    ref,
    ...toggleButtonInputProps
}: ToggleButtonSelectProps<Multiple>) {
    const options = useMemo(() => parseChildOptions(children), [children]);
    const isControlled = value !== undefined;
    const initialDefaultValueRef = useRef(defaultValue);

    const [internalValues, setInternalValues] = useState<string[]>(() => {
        const startingValues = normalizeSelectValue(isControlled ? value : defaultValue);
        return multiple ? startingValues : startingValues.slice(0, 1);
    });

    const selectedValues = useMemo(
        () => (isControlled ? normalizeSelectValue(value) : internalValues),
        [internalValues, isControlled, value],
    );

    const defaultInputNameId = useId();
    const inputName = multiple ? name : (name ?? `_toggle-button-select-${defaultInputNameId}`);
    const classNamePrefix = customization?.classNamePrefix ?? "super-select";
    const classNameBase = classNamePrefix.length > 0 ? `${classNamePrefix}__` : "";

    const createEventTarget = useCallback(
        (values: readonly string[]) =>
            createHTMLSelectElementSubsetTarget({
                id,
                name,
                multiple,
                disabled,
                required,
                value: multiple ? values : values[0],
            }),
        [id, name, multiple, required, disabled],
    );

    const handleValidationProxyInvalid = useCallback(
        (event: React.InvalidEvent<HTMLInputElement>) => {
            event.preventDefault();
            if (onInvalid) {
                onInvalid(createInvalidEvent(createEventTarget(selectedValues)));
            }
        },
        [createEventTarget, onInvalid, selectedValues],
    );

    const handleFormReset = useCallback(() => {
        if (!isControlled) {
            const initialValues = normalizeSelectValue(initialDefaultValueRef.current);
            setInternalValues(multiple ? initialValues : initialValues.slice(0, 1));
        }
    }, [isControlled, multiple]);

    const handleValueToggle = useCallback(
        (selectedValue: string) => {
            if (disabled) {
                return;
            }

            let nextValues: string[];
            if (multiple) {
                nextValues = selectedValues.includes(selectedValue)
                    ? selectedValues.filter((valueEntry) => valueEntry !== selectedValue)
                    : [...selectedValues, selectedValue];
            } else {
                nextValues = selectedValues.includes(selectedValue) ? [] : [selectedValue];
            }

            if (!isControlled) {
                setInternalValues(nextValues);
            }

            const target = createEventTarget(nextValues);

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
        [createEventTarget, disabled, isControlled, multiple, onChange, onInput, onValueChange, selectedValues],
    );

    const requiresValidationProxy = Boolean(required);
    const ToggleButtonInputComponent = customization?.component ?? ToggleButtonInput;
    const toggleButtonInputPropsForInput = { ...toggleButtonInputProps, size: undefined };
    const toggleButtonInputBaseProps: Omit<typeof toggleButtonInputPropsForInput, keyof React.DOMAttributes<HTMLSelectElementSubset>> =
        toggleButtonInputPropsForInput;
    const toggleButtonEventProps = retargetDomEventHandlers<HTMLSelectElementSubset, HTMLFieldSetElement>(
        createEventTarget(selectedValues),
        toggleButtonInputPropsForInput,
    );

    return (
        <>
            <ToggleButtonInputComponent
                {...toggleButtonInputBaseProps}
                {...toggleButtonEventProps}
                autoComplete={autoComplete}
                autoFocus={autoFocus}
                className={className}
                customization={customization}
                disabled={disabled}
                form={form}
                id={id}
                multiple={multiple}
                name={inputName}
                value={selectedValues}
                onValueToggle={handleValueToggle}
                options={options}
                required={required}
                style={style}
                tabIndex={tabIndex}
                title={title}
                ref={ref}
            />

            {requiresValidationProxy ? (
                <input
                    type="checkbox"
                    checked={selectedValues.length > 0}
                    required
                    disabled={disabled}
                    form={form}
                    tabIndex={-1}
                    aria-hidden
                    hidden
                    onChange={() => undefined}
                    onInvalid={handleValidationProxyInvalid}
                    className={`${classNameBase}visually-hidden`}
                />
            ) : null}

            {!isControlled ? <FormResetListener form={form} onReset={handleFormReset} /> : null}
        </>
    );
}
