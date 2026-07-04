import React from "react";

import { cx } from "../utils/cx";

/**
 * Props for a `MoreIndicator` component.
 */
export interface MoreIndicatorProps {
    /**
     * Called when the load-more button is clicked.
     */
    onLoadMore?: () => void;

    /**
     * A class name applied to the indicator.
     */
    className?: string;

    /**
     * Inline styles applied to the indicator.
     */
    style?: React.CSSProperties;

    /**
     * Whether the load-more button is disabled.
     */
    disabled?: boolean;

    /**
     * Customization options for the indicator.
     */
    customization?: {
        classNamePrefix?: string;
        loadMoreButton?: {
            className?: string;
            style?: React.CSSProperties;
            title?: string;
            content?: React.ReactNode;
        };
        overflowIndicator?: {
            className?: string;
            style?: React.CSSProperties;
            title?: string;
            content?: React.ReactNode;
        };
    };
}

const LOAD_MORE_SYMBOL = "+";

/**
 * The default indicator shown when an option list has more options.
 */
export function MoreIndicator({ className, style, disabled, onLoadMore, customization }: MoreIndicatorProps) {
    const classNamePrefix = customization?.classNamePrefix ?? "super-select";
    const classNameBase = classNamePrefix.length > 0 ? `${classNamePrefix}__` : "";

    return onLoadMore ? (
        <button
            type="button"
            className={cx(
                `${classNameBase}btn`,
                `${classNameBase}btn-outline-secondary`,
                `${classNameBase}btn-sm`,
                className,
                customization?.loadMoreButton?.className,
            )}
            style={style || customization?.loadMoreButton?.style ? { ...style, ...customization?.loadMoreButton?.style } : undefined}
            title={customization?.loadMoreButton?.title}
            onClick={onLoadMore}
            disabled={disabled}
        >
            {customization?.loadMoreButton?.content ?? LOAD_MORE_SYMBOL}
        </button>
    ) : (
        <div
            className={cx(
                `${classNameBase}text-body-secondary`,
                `${classNameBase}overflow-indicator`,
                className,
                customization?.overflowIndicator?.className,
            )}
            style={style || customization?.overflowIndicator?.style ? { ...style, ...customization?.overflowIndicator?.style } : undefined}
            title={customization?.overflowIndicator?.title}
        >
            {customization?.overflowIndicator?.content ?? <>&hellip;</>}
        </div>
    );
}
