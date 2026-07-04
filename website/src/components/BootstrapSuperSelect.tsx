import { SuperSelect, type SuperSelectProps } from "super-select-react";

export type BootstrapSuperSelectProps<Multiple extends boolean = boolean> = SuperSelectProps<Multiple>;

export function BootstrapSuperSelect<Multiple extends boolean = false>({ customization, ...props }: BootstrapSuperSelectProps<Multiple>) {
    return (
        <SuperSelect
            {...props}
            customization={{
                classNamePrefix: "",
                ...customization,
                modalSelectButton: {
                    ...customization?.modalSelectButton,
                    selectedContent: {
                        placeholder: "\u200B",
                        ...customization?.modalSelectButton?.selectedContent,
                    },
                },
            }}
        />
    );
}
