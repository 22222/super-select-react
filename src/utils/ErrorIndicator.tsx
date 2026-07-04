import React from "react";

import type { OptionSourceErrorLike } from "../option-source/OptionSourceError";
import { cx } from "./cx";

/**
 * Props for an error indicator component.
 */
export interface ErrorIndicatorProps {
    className?: string;
    style?: React.CSSProperties;
    error?: OptionSourceErrorLike;
    message?: React.ReactNode;
    inline?: boolean;
    onRetry?: () => void;
    customization?: {
        classNamePrefix?: string;
        icon?: React.ReactNode;
        retryButton?: {
            className?: string;
            style?: React.CSSProperties;
            title?: string;
            content?: React.ReactNode;
        };
    };
}

const ERROR_SYMBOL = "\u26A0";
const RELOAD_SYMBOL = "\u21BB";

/**
 * The default error indicator.
 */
export function ErrorIndicator({ className, style, message, inline, onRetry, customization }: ErrorIndicatorProps) {
    const classNamePrefix = customization?.classNamePrefix ?? "super-select";
    const classNameBase = classNamePrefix.length > 0 ? `${classNamePrefix}__` : "";
    const Tag = inline ? "span" : "div";

    return (
        <Tag
            className={cx(
                `${classNameBase}alert`,
                `${classNameBase}alert-danger`,
                onRetry && `${classNameBase}alert-dismissible`,
                inline && `${classNameBase}d-block`,
                className,
            )}
            style={style}
        >
            {customization?.icon ?? <span aria-hidden={!!message}>{ERROR_SYMBOL}</span>} {message && <>{message}</>}{" "}
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
        </Tag>
    );
}
