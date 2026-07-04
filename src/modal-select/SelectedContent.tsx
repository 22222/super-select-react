import type React from "react";

import type { Option } from "../option-source";
import { cx } from "../utils/cx";

/**
 * Props for a `SelectedContent` component.
 */
export interface SelectedContentProps {
    /**
     * The currently selected options.
     */
    selectedOptions: Option[];

    /**
     * A class name applied to the rendered content.
     */
    className?: string;

    /**
     * Inline styles applied to the rendered content.
     */
    style?: React.CSSProperties;

    /**
     * Customization options for the selected content.
     */
    customization?: {
        classNamePrefix?: string;
        placeholder?: string;
    };
}

/**
 * Displays the selected options in a modal select button.
 */
export function SelectedContent({ customization, selectedOptions, className, style }: SelectedContentProps) {
    const classNamePrefix = customization?.classNamePrefix ?? "super-select";
    const classNameBase = classNamePrefix.length > 0 ? `${classNamePrefix}__` : "";

    if (selectedOptions.length > 1) {
        return (
            <ul className={cx(`${classNameBase}list-inline`, `${classNameBase}d-inline`, className)} style={style}>
                {selectedOptions.map((option) => (
                    <li key={option.value} className={`${classNameBase}list-inline-item`}>
                        {option.children ?? option.label}
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <span className={className} style={style}>
            {selectedOptions[0]?.children ?? selectedOptions[0]?.label ?? customization?.placeholder ?? ""}
        </span>
    );
}
