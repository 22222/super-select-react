import { useEffect, useRef } from "react";

interface FormResetListenerProps {
    form?: string;
    onReset: () => void;
}

/**
 * Listens for a successful reset of the associated form.
 */
export function FormResetListener({ form, onReset }: FormResetListenerProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const formElement = inputRef.current?.form;
        const windowElement = formElement?.ownerDocument.defaultView;
        if (!formElement || !windowElement) {
            return;
        }

        // Observe at the window so a form onReset handler can cancel the reset first.
        const handleReset = (event: Event) => {
            if (event.target === formElement && !event.defaultPrevented) {
                onReset();
            }
        };

        windowElement.addEventListener("reset", handleReset);
        return () => windowElement.removeEventListener("reset", handleReset);
    }, [form, onReset]);

    return <input ref={inputRef} type="hidden" form={form} />;
}
