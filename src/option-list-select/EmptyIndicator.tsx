import React from "react";

import { cx } from "../utils/cx";

/**
 * Props for an `EmptyIndicator` component.
 */
export interface EmptyIndicatorProps {
    /**
     * A class name applied to the indicator.
     */
    className?: string;

    /**
     * Inline styles applied to the indicator.
     */
    style?: React.CSSProperties;

    /**
     * Called when the retry button is clicked.
     */
    onRetry?: () => void;

    /**
     * Customization options for the indicator.
     */
    customization?: {
        classNamePrefix?: string;
        content?: React.ReactNode;
        retryButton?: {
            className?: string;
            style?: React.CSSProperties;
            title?: string;
            content?: React.ReactNode;
        };
    };
}

const EMPTY_SYMBOL = "\u2212";
const RELOAD_SYMBOL = "\u21BB";

/**
 * The default indicator shown when an option list is empty.
 */
export function EmptyIndicator({ className, style, onRetry, customization }: EmptyIndicatorProps) {
    const classNamePrefix = customization?.classNamePrefix ?? "super-select";
    const classNameBase = classNamePrefix.length > 0 ? `${classNamePrefix}__` : "";
    return (
        <div
            className={cx(`${classNameBase}alert`, `${classNameBase}alert-info`, onRetry && `${classNameBase}alert-dismissible`, className)}
            style={style}
        >
            {customization?.content ?? <span aria-hidden>{EMPTY_SYMBOL}</span>}{" "}
            {onRetry && (
                <button
                    type="button"
                    className={cx(
                        `${classNameBase}btn`,
                        `${classNameBase}btn-outline-secondary`,
                        `${classNameBase}btn-sm`,
                        customization?.retryButton?.className,
                    )}
                    style={customization?.retryButton?.style}
                    title={customization?.retryButton?.title}
                    onClick={onRetry}
                >
                    {customization?.retryButton?.content ?? RELOAD_SYMBOL}
                </button>
            )}
        </div>
    );
}
