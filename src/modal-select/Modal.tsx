import type React from "react";
import { useCallback, useEffect, useRef } from "react";

import { cx } from "../utils/cx";
import { CloseButton, type CloseButtonProps } from "./CloseButton";

/**
 * Props for a `Modal` component.
 */
export interface ModalProps<TElement extends HTMLElement = HTMLDialogElement> extends Pick<
    React.ComponentProps<"dialog">,
    "open" | "children" | "className" | "style" | "dir" | "lang" | "aria-label" | "aria-labelledby" | "aria-busy"
> {
    /**
     * Content displayed in the modal header before the close button.
     */
    headerContent?: React.ReactNode;

    /**
     * Content displayed in the modal footer.
     */
    footerContent?: React.ReactNode;

    /**
     * Called when the modal is closed.
     */
    onClose?: () => void;

    /**
     * Called when the modal is canceled, such as by pressing Escape or clicking outside the dialog.
     */
    onCancel?: () => void;

    /**
     * Called when the modal is clicked.
     */
    onClick?: React.MouseEventHandler<TElement>;

    /**
     * A ref to the underlying `<dialog>` equivalent element.
     */
    ref?: React.Ref<TElement>;

    /**
     * Customization options for the modal.
     */
    customization?: {
        classNamePrefix?: string;
        dialog?: {
            className?: string;
            style?: React.CSSProperties;
        };
        content?: {
            className?: string;
            style?: React.CSSProperties;
        };
        header?: {
            className?: string;
            style?: React.CSSProperties;
        };
        body?: {
            className?: string;
            style?: React.CSSProperties;
        };
        footer?: {
            className?: string;
            style?: React.CSSProperties;
        };
        closeButton?: {
            className?: string;
            style?: React.CSSProperties;
            title?: string;
            component?: React.ComponentType<CloseButtonProps>;
            content?: React.ReactNode;
        };
    };
}

/**
 * The default modal dialog that is shown when the select button is clicked.
 */
export function Modal({ customization, headerContent, footerContent, children, open, className, ref, ...dialogProps }: ModalProps) {
    const classNamePrefix = customization?.classNamePrefix ?? "super-select";
    const classNameBase = classNamePrefix.length > 0 ? `${classNamePrefix}__` : "";
    const internalDialogRef = useRef<HTMLDialogElement>(null);
    const { onClose, onCancel, onClick, ...nativeDialogProps } = dialogProps;
    const CloseButtonComponent = customization?.closeButton?.component ?? CloseButton;

    const setDialogRef = useCallback(
        (node: HTMLDialogElement | null) => {
            internalDialogRef.current = node;

            if (!ref) {
                return;
            }

            if (typeof ref === "function") {
                ref(node);
                return;
            }

            ref.current = node;
        },
        [ref],
    );

    useEffect(() => {
        const dialog = internalDialogRef.current;
        if (!dialog) {
            return;
        }

        if (open && !dialog.open) {
            dialog.showModal();
        }

        if (!open && dialog.open) {
            dialog.close();
        }
    }, [open]);

    const handleCloseButtonClick = useCallback(() => {
        const dialog = internalDialogRef.current;
        if (!dialog?.open) {
            return;
        }

        dialog.close();
    }, []);

    return (
        <dialog
            {...nativeDialogProps}
            ref={setDialogRef}
            aria-modal="true"
            onClose={onClose}
            onCancel={(event) => {
                if (onCancel) {
                    event.preventDefault();
                    onCancel();
                }
            }}
            onClick={onClick}
            className={cx(
                `${classNameBase}modal`,
                `${classNameBase}border-0`,
                `${classNameBase}bg-transparent`,
                `${classNameBase}fade`,
                open ? `${classNameBase}show` : undefined,
                open ? `${classNameBase}d-block` : undefined,
                className,
            )}
        >
            <div
                className={cx(`${classNameBase}modal-dialog`, `${classNameBase}modal-dialog-scrollable`, customization?.dialog?.className)}
                style={customization?.dialog?.style}
            >
                <div
                    className={cx(`${classNameBase}modal-content`, customization?.content?.className)}
                    style={customization?.content?.style}
                >
                    <div
                        className={cx(`${classNameBase}modal-header`, customization?.header?.className)}
                        style={customization?.header?.style}
                    >
                        {headerContent}
                        <CloseButtonComponent
                            className={customization?.closeButton?.className}
                            style={customization?.closeButton?.style}
                            title={customization?.closeButton?.title}
                            onClick={handleCloseButtonClick}
                            tabIndex={-1}
                            customization={{
                                classNamePrefix,
                                content: customization?.closeButton?.content,
                            }}
                        />
                    </div>

                    <div className={cx(`${classNameBase}modal-body`, customization?.body?.className)} style={customization?.body?.style}>
                        {children}
                    </div>

                    {footerContent && (
                        <div
                            className={cx(`${classNameBase}modal-footer`, customization?.footer?.className)}
                            style={customization?.footer?.style}
                        >
                            {footerContent}
                        </div>
                    )}
                </div>
            </div>
        </dialog>
    );
}
