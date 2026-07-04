import type React from "react";

/**
 * An option in a Select input, radio button, or checkbox.
 */
export interface Option<TData = unknown> {
    /**
     * An internal value that would be submitted with a form when this option is selected.
     */
    value: string;

    /**
     * Human-readable text shown to users to describe the option.
     */
    label: string;

    /**
     * An alternative rich content version of the label shown when Super Select renders the option.
     */
    children?: React.ReactNode;

    /**
     * When grouping options, a human-readable label of the group this option belongs to.
     * This can be used to group related options together into Optgroups.
     */
    groupLabel?: string;

    /**
     * If true, this option is not selectable and is typically displayed in a greyed-out style.
     */
    disabled?: boolean;

    /**
     * If true, this option will not be rendered in the list of options.
     */
    hidden?: boolean;

    /**
     * Any additional data associated with this option.
     * This won't be used directly by this library, but will be preserved on options passed to things like an option source or customization components.
     */
    data?: TData;
}
