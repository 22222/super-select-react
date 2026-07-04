import {
    Alert,
    Box,
    Button,
    Checkbox,
    CloseButton,
    Dialog,
    HStack,
    Input,
    NativeSelect,
    RadioGroup,
    Spinner,
    Stack,
    Text,
    VisuallyHidden,
} from "@chakra-ui/react";
import type React from "react";
import { Fragment, useMemo } from "react";
import type {
    ErrorIndicatorProps,
    ModalProps,
    ModalSelectButtonProps,
    OkButtonProps,
    OptionListInputProps,
    OptionListProps,
    PendingIndicatorProps,
    SearchInputProps,
    SelectedContentProps,
    SuperSelectCustomization,
    SuperSelectProps,
    ToggleButtonInputProps,
} from "super-select-react";
import type { Option } from "super-select-react";
import { SuperSelect } from "super-select-react";

interface ChakraSuperSelectProps<Multiple extends boolean = boolean> extends Omit<SuperSelectProps<Multiple>, "customization"> {
    customization?: SuperSelectCustomization;
}

export function ChakraSuperSelect<Multiple extends boolean = false>({ customization, ...props }: ChakraSuperSelectProps<Multiple>) {
    return (
        <SuperSelect
            {...props}
            customization={{
                classNamePrefix: "chakra-super-select",
                ...customization,
                modalSelectButton: {
                    component: ChakraSelectButton,
                    ...customization?.modalSelectButton,
                    selectedContent: {
                        component: ChakraSelectedContent,
                        placeholder: "\u200B",
                        ...customization?.modalSelectButton?.selectedContent,
                    },
                },
                modal: {
                    component: ChakraModalDialog,
                    ...customization?.modal,
                    okButton: {
                        component: ChakraOkButton,
                        ...customization?.modal?.okButton,
                    },
                },
                searchInput: {
                    component: ChakraSearchInput,
                    placeholder: "Search options",
                    ...customization?.searchInput,
                },
                optionList: {
                    component: ChakraOptionListContainer,
                    ...customization?.optionList,
                },
                optionListInput: {
                    component: ChakraOptionListInput,
                    ...customization?.optionListInput,
                },
                pendingIndicator: {
                    component: ChakraPendingIndicator,
                    ...customization?.pendingIndicator,
                },
                errorIndicator: {
                    component: ChakraErrorIndicator,
                    ...customization?.errorIndicator,
                },
                selectInput: {
                    component: ChakraNativeSelectInput,
                    ...customization?.selectInput,
                },
                toggleButtonInput: {
                    component: ChakraToggleButtonInput,
                    ...customization?.toggleButtonInput,
                },
            }}
        />
    );
}

function ChakraOptionListContainer({
    className,
    style,
    searchInput,
    optionList,
    children,
    ref,
    ...divProps
}: OptionListProps<HTMLDivElement>) {
    return (
        <Stack ref={ref} className={className} style={style} gap="3" {...divProps}>
            {searchInput}
            {optionList}
            {children}
        </Stack>
    );
}

function ChakraOptionListInput({
    options,
    value,
    multiple,
    disabled,
    name,
    onValueChange,
    onKeyDown,
    onOptionClick,
    onOptionKeyDown,
    indicator,
    customization,
}: OptionListInputProps<HTMLDivElement, HTMLInputElement>) {
    const selectedValues = multiple ? value : value.slice(0, 1);
    const selectedValueSet = useMemo(() => new Set<string>(selectedValues), [selectedValues]);
    const optgroups = useMemo(() => buildOptgroups(options), [options]);

    const handleSelect = (selectedValue: string) => {
        if (disabled) {
            return;
        }

        const nextValues = multiple
            ? selectedValueSet.has(selectedValue)
                ? selectedValues.filter((entry) => entry !== selectedValue)
                : [...selectedValues, selectedValue]
            : [selectedValue];
        onValueChange(nextValues);
    };

    const optionContent = optgroups.map((optgroup) => (
        <Fragment key={optgroup.label.length > 0 ? `group:${optgroup.label}` : `group:${optgroup.options[0]?.value ?? ""}`}>
            {optgroup.label ? (
                <Text
                    className={customization?.groupHeader?.className}
                    style={customization?.groupHeader?.style}
                    fontSize="sm"
                    fontWeight="medium"
                    color="fg.muted"
                >
                    {optgroup.label}
                </Text>
            ) : null}

            {optgroup.options.map((option) => {
                const isChecked = selectedValueSet.has(option.value);
                const isDisabled = Boolean(disabled || option.disabled);

                return (
                    <Box key={option.value} className={customization?.optionItem?.className} style={customization?.optionItem?.style}>
                        {multiple ? (
                            <Checkbox.Root checked={isChecked} disabled={isDisabled} onCheckedChange={() => handleSelect(option.value)}>
                                <Checkbox.HiddenInput
                                    name={name}
                                    value={option.value}
                                    onClick={onOptionClick}
                                    onKeyDown={onOptionKeyDown}
                                />
                                <Checkbox.Control>
                                    <Checkbox.Indicator />
                                </Checkbox.Control>
                                <Checkbox.Label>{option.label}</Checkbox.Label>
                            </Checkbox.Root>
                        ) : (
                            <RadioGroup.Item value={option.value} disabled={isDisabled} onClick={() => handleSelect(option.value)}>
                                <RadioGroup.ItemHiddenInput
                                    name={name}
                                    checked={isChecked}
                                    value={option.value}
                                    onChange={() => undefined}
                                    onClick={onOptionClick}
                                    onKeyDown={onOptionKeyDown}
                                />
                                <RadioGroup.ItemControl />
                                <RadioGroup.ItemText>{option.label}</RadioGroup.ItemText>
                            </RadioGroup.Item>
                        )}
                    </Box>
                );
            })}
        </Fragment>
    ));

    return (
        <Stack gap="2" onKeyDown={onKeyDown as React.KeyboardEventHandler<HTMLDivElement>}>
            {multiple ? (
                optionContent
            ) : (
                <RadioGroup.Root value={selectedValues[0] ?? ""} disabled={disabled}>
                    {optionContent}
                </RadioGroup.Root>
            )}
            {indicator}
        </Stack>
    );
}

function ChakraSelectButton({ children, ...buttonProps }: ModalSelectButtonProps) {
    return (
        <NativeSelect.Root width="100%">
            <Button
                {...buttonProps}
                variant="outline"
                width="100%"
                minHeight="10"
                justifyContent="flex-start"
                alignItems="center"
                fontWeight="normal"
                lineHeight="normal"
                paddingEnd="10"
            >
                <Box as="span" display="flex" alignItems="center" flex="1" minWidth="0" textAlign="left" lineHeight="1.25">
                    {children}
                </Box>
            </Button>
            <NativeSelect.Indicator pointerEvents="none" />
        </NativeSelect.Root>
    );
}

function ChakraToggleButtonInput({
    className,
    style,
    disabled,
    id,
    multiple,
    name,
    options,
    value,
    onValueToggle,
    ref,
    title,
    tabIndex,
    ...divProps
}: ToggleButtonInputProps<HTMLDivElement>) {
    const visibleOptions = useMemo(
        () => (options.find((option) => option.hidden) ? options.filter((option) => !option.hidden) : options),
        [options],
    );
    const selectedValues = multiple ? value : value.slice(0, 1);
    const selectedValueSet = useMemo(() => new Set<string>(selectedValues), [selectedValues]);
    const optgroups = useMemo(() => buildOptgroups(visibleOptions), [visibleOptions]);

    return (
        <Stack ref={ref} id={id} className={className} style={style} title={title} tabIndex={tabIndex} gap="2" {...divProps}>
            {optgroups.map((optgroup) => (
                <Fragment key={optgroup.label.length > 0 ? `group:${optgroup.label}` : `group:${optgroup.options[0]?.value ?? ""}`}>
                    {optgroup.label ? (
                        <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                            {optgroup.label}
                        </Text>
                    ) : null}

                    {multiple ? (
                        <HStack gap="2" wrap="wrap">
                            {optgroup.options.map((option) => (
                                <Checkbox.Root
                                    key={option.value}
                                    checked={selectedValueSet.has(option.value)}
                                    disabled={disabled || option.disabled}
                                    onCheckedChange={() => onValueToggle(option.value)}
                                >
                                    <Checkbox.HiddenInput name={name} value={option.value} />
                                    <Checkbox.Control>
                                        <Checkbox.Indicator />
                                    </Checkbox.Control>
                                    <Checkbox.Label>{option.label}</Checkbox.Label>
                                </Checkbox.Root>
                            ))}
                        </HStack>
                    ) : (
                        <RadioGroup.Root
                            value={selectedValues[0] ?? ""}
                            disabled={disabled}
                            onValueChange={(details) => {
                                if (details.value) {
                                    onValueToggle(details.value);
                                }
                            }}
                        >
                            <HStack gap="3" wrap="wrap">
                                {optgroup.options.map((option) => (
                                    <RadioGroup.Item key={option.value} value={option.value} disabled={option.disabled}>
                                        <RadioGroup.ItemHiddenInput name={name} />
                                        <RadioGroup.ItemControl />
                                        <RadioGroup.ItemText>{option.label}</RadioGroup.ItemText>
                                    </RadioGroup.Item>
                                ))}
                            </HStack>
                        </RadioGroup.Root>
                    )}
                </Fragment>
            ))}
        </Stack>
    );
}

function ChakraModalDialog({
    open,
    headerContent,
    footerContent,
    children,
    className,
    style,
    onClose,
    "aria-busy": ariaBusy,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
}: ModalProps) {
    return (
        <Dialog.Root
            open={Boolean(open)}
            onOpenChange={(details) => {
                if (!details.open) {
                    onClose?.();
                }
            }}
        >
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content
                    className={className}
                    style={style}
                    aria-busy={ariaBusy}
                    aria-label={ariaLabel}
                    aria-labelledby={ariaLabelledBy}
                >
                    {headerContent ? (
                        <Dialog.Header display="flex" alignItems="center" gap="3">
                            <Box flex="1" minWidth="0">
                                {headerContent}
                            </Box>
                            <CloseButton onClick={() => onClose?.()} />
                        </Dialog.Header>
                    ) : null}

                    <Dialog.Body>{children}</Dialog.Body>

                    {footerContent ? <Dialog.Footer>{footerContent}</Dialog.Footer> : null}
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
}

function ChakraOkButton({ className, style, disabled, title, onClick, customization }: OkButtonProps) {
    return (
        <Button className={className} style={style} title={title} onClick={onClick} disabled={disabled} variant="solid">
            {customization?.content ?? "OK"}
        </Button>
    );
}

function ChakraSelectedContent({ selectedOptions, className, style, customization }: SelectedContentProps) {
    if (selectedOptions.length > 1) {
        return (
            <HStack className={className} style={style} gap="2" wrap="wrap">
                {selectedOptions.map((option) => (
                    <Text key={option.value} fontSize="sm">
                        {option.label}
                    </Text>
                ))}
            </HStack>
        );
    }

    return (
        <Text className={className} style={style} fontSize="sm">
            {selectedOptions[0]?.label ?? customization?.placeholder ?? ""}
        </Text>
    );
}

function ChakraSearchInput({ search, onSearchChange, className, style, disabled, ref, onKeyDown, customization }: SearchInputProps) {
    return (
        <Input
            ref={ref}
            type="search"
            value={search ?? ""}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => onSearchChange(event.currentTarget.value)}
            onKeyDown={onKeyDown}
            disabled={disabled}
            className={className}
            style={style}
            placeholder={customization?.placeholder}
        />
    );
}

function ChakraPendingIndicator({ inline, className, style, title, content }: PendingIndicatorProps) {
    return (
        <HStack as={inline ? "span" : "div"} className={className} style={style} title={title} gap="2">
            <Spinner size="sm" />
            {content ? <VisuallyHidden>{content}</VisuallyHidden> : null}
        </HStack>
    );
}

function ChakraErrorIndicator({ className, style, message, inline, onRetry, customization }: ErrorIndicatorProps) {
    if (inline) {
        return (
            <HStack as="span" className={className} style={style} gap="1" color="red.600">
                <Text as="span" color="inherit">
                    {customization?.icon ?? "!"}
                </Text>
                <Text as="span" color="inherit" fontSize="sm" fontWeight="medium">
                    {message ?? "Error"}
                </Text>
            </HStack>
        );
    }

    return (
        <Alert.Root status="error" className={className} style={style}>
            <HStack justify="space-between" align="center" width="100%">
                <HStack align="center">
                    <Alert.Indicator />
                    <Alert.Description>{message ?? "Unable to load options"}</Alert.Description>
                </HStack>
                {onRetry ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRetry}
                        className={customization?.retryButton?.className}
                        style={customization?.retryButton?.style}
                    >
                        {customization?.retryButton?.content ?? "Retry"}
                    </Button>
                ) : null}
            </HStack>
        </Alert.Root>
    );
}

function ChakraNativeSelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
    const { className, style, children, ...selectProps } = props;
    return (
        <NativeSelect.Root className={className} style={style}>
            <NativeSelect.Field {...selectProps}>{children}</NativeSelect.Field>
            <NativeSelect.Indicator />
        </NativeSelect.Root>
    );
}

function buildOptgroups(options: Option[]) {
    const nextOptgroups: { label: string; options: Option[] }[] = [];
    let currentOptgroup: { label: string; options: Option[] } | undefined;

    for (const option of options) {
        const groupLabel = option.groupLabel ?? "";
        if (currentOptgroup && currentOptgroup.label === groupLabel) {
            currentOptgroup.options.push(option);
            continue;
        }

        currentOptgroup = nextOptgroups.find((group) => group.label === groupLabel);
        if (currentOptgroup) {
            currentOptgroup.options.push(option);
            continue;
        }

        currentOptgroup = { label: groupLabel, options: [option] };
        nextOptgroups.push(currentOptgroup);
    }

    return nextOptgroups;
}
