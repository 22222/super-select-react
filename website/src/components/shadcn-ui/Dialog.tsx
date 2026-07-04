import type React from "react";

import { cn } from "./cn";
import styles from "./dialog.module.css";

export interface DialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: React.ReactNode;
}

export function Dialog({ open, children }: DialogProps) {
    if (!open) {
        return null;
    }

    return <>{children}</>;
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
    onOpenChange?: (open: boolean) => void;
}

export function DialogContent({ className, children, onClick, onOpenChange, ...props }: DialogContentProps) {
    return (
        <div
            className={styles.backdrop}
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    onOpenChange?.(false);
                }
                onClick?.(event);
            }}
        >
            <div {...props} className={cn(styles.content, className)} role="dialog" aria-modal="true">
                {children}
            </div>
        </div>
    );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={cn(styles.header, className)} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h2 {...props} className={cn(styles.title, className)} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={cn(styles.footer, className)} />;
}
