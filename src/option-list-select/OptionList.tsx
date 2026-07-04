import type React from "react";

import { cx } from "../utils/cx";

/**
 * Props for an `OptionList` component.
 */
export interface OptionListProps<TElement extends HTMLElement = HTMLDivElement> extends Pick<
    React.ComponentProps<"div">,
    "id" | "className" | "style" | "title" | "tabIndex" | "dir" | "lang" | "aria-label" | "aria-busy"
> {
    /**
     * The search input displayed before the options.
     */
    searchInput?: React.ReactNode;

    /**
     * The option list input.
     */
    optionList?: React.ReactNode;

    /**
     * Additional content displayed after the option list.
     */
    children?: React.ReactNode;

    /**
     * A ref to the underlying container equivalent element.
     */
    ref?: React.Ref<TElement>;

    /**
     * Customization options for the option list.
     */
    customization?: {
        classNamePrefix?: string;
    };
}

/**
 * The default container for an option list select.
 */
export function OptionList({ searchInput, optionList, className, customization, ref, children, ...divProps }: OptionListProps) {
    const classNamePrefix = customization?.classNamePrefix ?? "super-select";
    return (
        <div ref={ref} {...divProps} className={cx(classNamePrefix, className)}>
            {searchInput}
            {optionList}
            {children}
        </div>
    );
}
