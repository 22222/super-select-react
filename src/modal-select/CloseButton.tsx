import React from "react";

import { cx } from "../utils/cx";

/**
 * Props for a `CloseButton` component.
 */
export interface CloseButtonProps extends Pick<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "style" | "disabled" | "tabIndex" | "title"
> {
    /**
     * Called when the button is clicked.
     */
    onClick?: () => void;

    /**
     * Customization options for the button.
     */
    customization?: {
        classNamePrefix?: string;
        content?: React.ReactNode;
    };
}

/**
 * The default button used to close a modal.
 */
export function CloseButton({ className, style, disabled, tabIndex, title, onClick, customization }: CloseButtonProps) {
    const classNamePrefix = customization?.classNamePrefix ?? "super-select";
    const classNameBase = classNamePrefix.length > 0 ? `${classNamePrefix}__` : "";
    return (
        <button
            type="button"
            className={cx(`${classNameBase}btn-close`, className)}
            style={style}
            disabled={disabled}
            onClick={onClick}
            tabIndex={tabIndex}
            title={title}
        >
            <span className={`${classNameBase}visually-hidden`}>{customization?.content ?? <>&times;</>}</span>
        </button>
    );
}
