import React, { useEffect, useState } from "react";

import { cx } from "./cx";

/**
 * Props for a pending indicator.
 */
export interface PendingIndicatorProps {
    className?: string;
    style?: React.CSSProperties;
    title?: string;
    inline?: boolean;
    content?: React.ReactNode;
    customization?: {
        classNamePrefix?: string;
    };
}

const PENDING_SYMBOL = "\u23F3";
const SHOW_DELAY_MS = 150;

/**
 * The default pending indicator component shown while something is loading.
 */
export function PendingIndicator({ className, style, title, inline, content, customization }: PendingIndicatorProps) {
    const classNamePrefix = customization?.classNamePrefix ?? "super-select";
    const classNameBase = classNamePrefix.length > 0 ? `${classNamePrefix}__` : "";
    const Tag = inline ? "span" : "div";

    const [isShown, setIsShown] = useState(false);
    useEffect(() => {
        const timeoutId = window.setTimeout(() => setIsShown(true), SHOW_DELAY_MS);
        return () => window.clearTimeout(timeoutId);
    }, []);

    return (
        <Tag
            className={cx(
                `${classNameBase}spinner-border`,
                `${classNameBase}spinner-border-sm`,
                `${classNameBase}fade`,
                isShown ? `${classNameBase}show` : undefined,
                className,
            )}
            style={style}
            title={title}
            role="status"
        >
            <span className={`${classNameBase}visually-hidden`}>{content ?? <>{PENDING_SYMBOL}</>}</span>
        </Tag>
    );
}
