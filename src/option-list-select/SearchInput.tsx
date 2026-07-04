import React from "react";

import { cx } from "../utils/cx";
import { PendingIndicator, type PendingIndicatorProps } from "../utils/PendingIndicator";

/**
 * Props for a `SearchInput` component.
 */
export interface SearchInputProps<TElement extends HTMLElement = HTMLInputElement> {
    /**
     * The current search text.
     */
    search: string | undefined;

    /**
     * Called when the search text changes.
     */
    onSearchChange: (search: string | undefined) => void;

    /**
     * Whether options are being loaded for the current search.
     */
    isSearching?: boolean;

    /**
     * A class name applied to the search input container.
     */
    className?: string;

    /**
     * Inline styles applied to the search input container.
     */
    style?: React.CSSProperties;

    /**
     * Whether the search input is disabled.
     */
    disabled?: boolean;

    /**
     * A ref to the underlying search input equivalent element.
     */
    ref?: React.Ref<TElement>;

    /**
     * Called when a key is pressed in the search input.
     */
    onKeyDown?: React.KeyboardEventHandler<TElement>;

    /**
     * Customization options for the search input.
     */
    customization?: {
        classNamePrefix?: string;
        placeholder?: string;
        title?: string;
        pendingIndicator?: {
            className?: string;
            style?: React.CSSProperties;
            title?: string;
            content?: React.ReactNode;
            component?: React.ComponentType<PendingIndicatorProps>;
        };
    };
}

/**
 * The default search input for an option list.
 */
export function SearchInput({
    className,
    style,
    search,
    onSearchChange,
    isSearching,
    disabled,
    ref,
    onKeyDown,
    customization,
}: SearchInputProps) {
    const classNamePrefix = customization?.classNamePrefix ?? "super-select";
    const classNameBase = classNamePrefix.length > 0 ? `${classNamePrefix}__` : "";
    const PendingIndicatorComponent = customization?.pendingIndicator?.component ?? PendingIndicator;

    return (
        <div className={cx(`${classNameBase}input-group`, className)} style={style}>
            <input
                ref={ref}
                type="search"
                value={search ?? ""}
                onChange={(event) => onSearchChange(event.target.value)}
                onKeyDown={onKeyDown}
                className={`${classNameBase}form-control`}
                disabled={disabled}
                placeholder={customization?.placeholder}
                title={customization?.title}
                aria-label={customization?.title}
            />
            {isSearching && (
                <div className={`${classNameBase}input-group-text`}>
                    <PendingIndicatorComponent
                        inline={true}
                        className={customization?.pendingIndicator?.className}
                        style={customization?.pendingIndicator?.style}
                        title={customization?.pendingIndicator?.title}
                        content={customization?.pendingIndicator?.content}
                        customization={customization ? { classNamePrefix: classNamePrefix } : undefined}
                    />
                </div>
            )}
        </div>
    );
}
