import type React from "react";

import { cx } from "./cx";

/**
 * Props for a fallback component shown before a display mode can render.
 */
export interface FallbackProps {
    "aria-busy"?: boolean;
    "aria-describedby"?: string;
    "aria-label"?: string;
    "aria-labelledby"?: string;
    accessKey?: string;
    children?: React.ReactNode;
    className?: string;
    dir?: string;
    hidden?: boolean;
    id?: string;
    lang?: string;
    style?: React.CSSProperties;
    tabIndex?: number;
    title?: string;
    customization?: {
        classNamePrefix?: string;
    };
}

/**
 * The default fallback container shown while the real SuperSelect component is loading.
 */
export function Fallback({
    "aria-busy": ariaBusy,
    "aria-describedby": ariaDescribedBy,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    accessKey,
    children,
    className,
    dir,
    hidden,
    id,
    lang,
    style,
    tabIndex,
    title,
    customization,
}: FallbackProps) {
    const classNamePrefix = customization?.classNamePrefix ?? "super-select";
    const classNameBase = classNamePrefix.length > 0 ? `${classNamePrefix}__` : "";
    return (
        <div
            id={id}
            aria-busy={ariaBusy}
            aria-describedby={ariaDescribedBy}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            accessKey={accessKey}
            className={cx(`${classNameBase}list-group`, className)}
            dir={dir}
            hidden={hidden}
            lang={lang}
            style={style}
            tabIndex={tabIndex}
            title={title}
        >
            <div className={`${classNameBase}list-group-item`}>{children}</div>
        </div>
    );
}
