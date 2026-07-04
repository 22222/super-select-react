import type React from "react";

import type { AnyHTMLElement } from "../SelectProps";
import { cx } from "../utils/cx";

/**
 * Props for a `ModalSelectButton` component.
 */
export interface ModalSelectButtonProps<TElement extends HTMLElement = HTMLButtonElement> extends Omit<
    React.HTMLAttributes<TElement>,
    "children"
> {
    /**
     * Whether the button is disabled.
     */
    disabled?: boolean;

    /**
     * The content displayed by the button.
     */
    children?: React.ReactNode;

    /**
     * A ref to the underlying button equivalent element.
     */
    ref?: React.Ref<TElement>;

    /**
     * Customization options for the button.
     */
    customization?: {
        classNamePrefix?: string;
    };
}

/**
 * The default trigger button for a modal select.
 */
export function ModalSelectButton({ ref, customization, children, className, ...buttonProps }: ModalSelectButtonProps<AnyHTMLElement>) {
    const classNamePrefix = customization?.classNamePrefix ?? "super-select";
    const classNameBase = classNamePrefix.length > 0 ? `${classNamePrefix}__` : "";

    return (
        <button
            ref={ref}
            type="button"
            className={cx(`${classNameBase}form-select`, `${classNameBase}text-start`, className)}
            {...buttonProps}
        >
            {children}
        </button>
    );
}
