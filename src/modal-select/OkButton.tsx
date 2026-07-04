import React from "react";

import { cx } from "../utils/cx";

/**
 * Props for an `OkButton` component.
 */
export interface OkButtonProps extends Pick<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "style" | "disabled" | "title"> {
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

const OK_SYMBOL = "\u2713";

/**
 * The default button used to confirm a multiple selection.
 */
export function OkButton({ className, style, disabled, title, onClick, customization }: OkButtonProps) {
    const classNamePrefix = customization?.classNamePrefix ?? "super-select";
    const classNameBase = classNamePrefix.length > 0 ? `${classNamePrefix}__` : "";
    return (
        <button
            type="button"
            className={cx(`${classNameBase}btn`, `${classNameBase}btn-secondary`, className)}
            style={style}
            onClick={onClick}
            disabled={disabled}
            title={title}
        >
            {customization?.content ?? OK_SYMBOL}
        </button>
    );
}
