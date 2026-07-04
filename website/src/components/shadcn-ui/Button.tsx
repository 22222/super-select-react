import type React from "react";

import styles from "./button.module.css";
import { cn } from "./cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm";
}

export function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
    return (
        <button
            type="button"
            {...props}
            className={cn(
                styles.button,
                variant === "default" && styles.default,
                variant === "outline" && styles.outline,
                variant === "ghost" && styles.ghost,
                size === "sm" && styles.sm,
                className,
            )}
        />
    );
}
