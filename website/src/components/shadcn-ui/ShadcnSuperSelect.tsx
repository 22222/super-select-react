import type React from "react";
import {
    type ErrorIndicatorProps,
    type ModalProps,
    type ModalSelectButtonProps,
    type OkButtonProps,
    type SearchInputProps,
    type SelectedContentProps,
    SuperSelect,
    type SuperSelectProps,
} from "super-select-react";

import { Button } from "./Button";
import { cn } from "./cn";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./Dialog";
import { Input } from "./Input";
import styles from "./shadcn-super-select.module.css";

export interface ShadcnSuperSelectProps<Multiple extends boolean = boolean> extends Omit<SuperSelectProps<Multiple>, "customization"> {
    customization?: SuperSelectProps<Multiple>["customization"];
}

export function ShadcnSuperSelect<Multiple extends boolean = false>({ customization, ...props }: ShadcnSuperSelectProps<Multiple>) {
    return (
        <SuperSelect
            {...props}
            customization={{
                ...customization,
                modalSelectButton: {
                    component: ShadcnSelectButton,
                    ...customization?.modalSelectButton,
                    selectedContent: {
                        component: ShadcnSelectedContent,
                        ...customization?.modalSelectButton?.selectedContent,
                    },
                },
                modal: {
                    component: ShadcnModal,
                    ...customization?.modal,
                    okButton: {
                        component: ShadcnOkButton,
                        ...customization?.modal?.okButton,
                    },
                },
                searchInput: {
                    component: ShadcnSearchInput,
                    placeholder: "Search options",
                    ...customization?.searchInput,
                },
                errorIndicator: {
                    component: ShadcnErrorIndicator,
                    ...customization?.errorIndicator,
                },
                selectInput: {
                    className: customization?.selectInput?.className,
                    ...customization?.selectInput,
                },
            }}
        />
    );
}

function ShadcnSelectButton({ children, className, ...buttonProps }: ModalSelectButtonProps<HTMLButtonElement>) {
    return (
        <Button {...buttonProps} variant="outline" className={cn(styles.trigger, className)}>
            <span className={styles.triggerContent}>{children}</span>
            <span className={styles.chevron} aria-hidden>
                v
            </span>
        </Button>
    );
}

function ShadcnSelectedContent({ selectedOptions, className, style, customization }: SelectedContentProps) {
    const content =
        selectedOptions.length > 0 ? selectedOptions.map((option) => option.label).join(", ") : (customization?.placeholder ?? "");

    return (
        <span className={cn(styles.selectedContent, selectedOptions.length === 0 && styles.placeholder, className)} style={style}>
            {content}
        </span>
    );
}

function ShadcnModal({
    open,
    headerContent,
    footerContent,
    children,
    className,
    style,
    onClose,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
}: ModalProps) {
    return (
        <Dialog open={open}>
            <DialogContent
                className={className}
                style={style}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledBy}
                onOpenChange={(nextOpen) => !nextOpen && onClose?.()}
            >
                <DialogHeader className={styles.modalHeader}>
                    <DialogTitle className={styles.srOnly}>Select an option</DialogTitle>
                    {headerContent}
                    <Button type="button" variant="ghost" className={styles.closeButton} aria-label="Close" onClick={onClose}>
                        X
                    </Button>
                </DialogHeader>
                <div className={styles.modalBody}>{children}</div>
                {footerContent ? <DialogFooter>{footerContent}</DialogFooter> : null}
            </DialogContent>
        </Dialog>
    );
}

function ShadcnOkButton({ className, style, disabled, title, onClick, customization }: OkButtonProps) {
    return (
        <Button style={style} title={title} disabled={disabled} onClick={onClick} className={className}>
            {customization?.content ?? "OK"}
        </Button>
    );
}

function ShadcnErrorIndicator({ className, style, message, inline, onRetry, customization }: ErrorIndicatorProps) {
    const icon = customization?.icon ?? "!";

    if (inline) {
        return (
            <span className={cn(styles.inlineError, className)} style={style}>
                <span aria-hidden>{icon}</span>
                {message ? <span className={styles.errorMessage}>{message}</span> : null}
                {onRetry ? (
                    <Button type="button" variant="outline" size="sm" className={styles.retryButton} onClick={onRetry}>
                        {customization?.retryButton?.content ?? "Retry"}
                    </Button>
                ) : null}
            </span>
        );
    }

    return (
        <div className={cn(styles.blockError, className)} style={style}>
            <span className={styles.errorLead}>
                <span aria-hidden>{icon}</span>
                {message ? <span className={styles.errorMessage}>{message}</span> : null}
            </span>
            {onRetry ? (
                <Button type="button" variant="outline" size="sm" className={styles.retryButton} onClick={onRetry}>
                    {customization?.retryButton?.content ?? "Retry"}
                </Button>
            ) : null}
        </div>
    );
}

function ShadcnSearchInput({ search, onSearchChange, className, style, disabled, ref, onKeyDown, customization }: SearchInputProps) {
    return (
        <div className={styles.searchWrap}>
            <span className={styles.searchIcon} aria-hidden>
                /
            </span>
            <Input
                ref={ref}
                type="search"
                value={search ?? ""}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onSearchChange(event.currentTarget.value)}
                onKeyDown={onKeyDown}
                disabled={disabled}
                className={cn(styles.searchInput, className)}
                style={style}
                placeholder={customization?.placeholder}
            />
        </div>
    );
}
