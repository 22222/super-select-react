import type React from "react";

/**
 * Props shared by select-compatible components.
 * Event targets use `HTMLSelectElementSubset` instead of a full HTML select element.
 */
export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElementSubset>, "onKeyPress"> {
    /**
     * Called when the selection changes.
     */
    onChange?: React.ChangeEventHandler<HTMLSelectElementSubset, HTMLSelectElementSubset>;

    /**
     * A ref to the visible control equivalent element.
     */
    ref?: React.Ref<AnyHTMLElement>;
}

/**
 * A subset of `HTMLSelectElement` used as the target of select-compatible events.
 */
export interface HTMLSelectElementSubset extends Omit<Partial<HTMLSelectElement>, "value" | "selectedOptions"> {
    /**
     * The value of the first selected `<option>` element associated with this `<select>` element.
     */
    value: string;

    /**
     * A list of the `<option>` elements contained within the `<select>` element that are currently selected.
     */
    selectedOptions: HTMLOptionsCollectionSubset;
}

/**
 * A collection of `<option>` HTML elements.
 */
export interface HTMLOptionsCollectionSubset {
    /**
     * The number of options in the collection.
     */
    length: number;

    /**
     * The index number of the first selected <option> element. The value -1 indicates no element is selected.
     */
    selectedIndex?: number;

    /**
     * Returns the specific element at the given zero-based index into the list. Returns null if the index is out of range.
     */
    item(index: number): HTMLOptionElementSubset | null;

    /**
     * Returns the specific node whose ID or name matches the specified string.
     * Returns null if no node exists by the given name or if this method is not supported.
     */
    namedItem(name: string): HTMLOptionElementSubset | null;

    [index: number]: HTMLOptionElementSubset | undefined;

    [Symbol.iterator](): IterableIterator<HTMLOptionElementSubset>;
}

/**
 * A subset of `HTMLOptionElement` used in select-compatible event targets.
 */
export interface HTMLOptionElementSubset extends Partial<HTMLOptionElement> {
    /**
     * The value to be submitted with the form, should this option be selected.
     */
    value: string;

    /**
     * A label for the option.
     */
    label: string;

    /**
     * Indicates whether the option is currently selected.
     */
    selected: boolean;

    /**
     * Indicates whether the option is unavailable to be selected.
     */
    disabled: boolean;
}

/**
 * The selected value type based on whether multiple selection is enabled.
 */
export type SelectChangeValue<Multiple extends boolean = boolean> = Multiple extends true ? string[] : string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyHTMLElement = any;
