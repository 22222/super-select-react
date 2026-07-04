import {
    Alert,
    Box,
    Button,
    Checkbox,
    ComboboxChevron,
    Group,
    Loader,
    Modal as MantineModal,
    NativeSelect,
    Radio,
    RadioGroup,
    Stack,
    Text,
    TextInput,
    VisuallyHidden,
} from "@mantine/core";
import type React from "react";
import { Fragment, useMemo } from "react";
import type {
    EmptyIndicatorProps,
    ErrorIndicatorProps,
    ModalProps,
    ModalSelectButtonProps,
    MoreIndicatorProps,
    OkButtonProps,
    OptionListInputProps,
    OptionListProps,
    PendingIndicatorProps,
    SearchInputProps,
    SelectedContentProps,
    SuperSelectCustomization,
    ToggleButtonInputProps,
} from "super-select-react";
import type { Option } from "super-select-react";
import { SuperSelect, type SuperSelectProps } from "super-select-react";

interface MantineSuperSelectProps<Multiple extends boolean = boolean> extends Omit<SuperSelectProps<Multiple>, "customization"> {
    customization?: SuperSelectCustomization;
}

export function MantineSuperSelect<Multiple extends boolean = false>({ customization, ...props }: MantineSuperSelectProps<Multiple>) {
    return (
        <SuperSelect
            {...props}
            customization={{
                classNamePrefix: "mantine-super-select",
                ...customization,
                modalSelectButton: {
                    component: MantineSelectButton,
                    ...customization?.modalSelectButton,
                    selectedContent: {
                        component: MantineSelectedContent,
                        ...customization?.modalSelectButton?.selectedContent,
                    },
                },
                modal: {
                    component: MantineModalDialog,
                    ...customization?.modal,
                    okButton: {
                        component: MantineOkButton,
                        ...customization?.modal?.okButton,
                    },
                },
                optionList: {
                    component: MantineOptionListContainer,
                    ...customization?.optionList,
                },
                optionListInput: {
                    component: MantineOptionListInput,
                    ...customization?.optionListInput,
                },
                searchInput: {
                    component: MantineSearchInput,
                    placeholder: "Search options",
                    ...customization?.searchInput,
                },
                toggleButtonInput: {
                    component: MantineToggleButtonInput,
                    ...customization?.toggleButtonInput,
                },
                selectInput: {
                    component: MantineNativeSelect,
                    ...customization?.selectInput,
                },
                pendingIndicator: {
                    component: MantinePendingIndicator,
                    ...customization?.pendingIndicator,
                },
                errorIndicator: {
                    component: MantineErrorIndicator,
                    ...customization?.errorIndicator,
                },
                emptyIndicator: {
                    component: MantineEmptyIndicator,
                    ...customization?.emptyIndicator,
                },
                moreIndicator: {
                    component: MantineMoreIndicator,
                    ...customization?.moreIndicator,
                },
            }}
        />
    );
}

function MantineSelectButton({ children, ...buttonProps }: ModalSelectButtonProps) {
    return (
        <Button {...buttonProps} variant="default" rightSection={<ComboboxChevron aria-hidden />} fullWidth justify="space-between">
            {children}
        </Button>
    );
}

function MantineSelectedContent({ selectedOptions, className, style }: SelectedContentProps) {
    if (selectedOptions.length > 1) {
        return (
            <Group className={className} style={style} gap="xs" wrap="wrap">
                {selectedOptions.map((option) => (
                    <Text key={option.value} size="sm">
                        {option.label}
                    </Text>
                ))}
            </Group>
        );
    }

    return (
        <Text className={className} style={style} size="sm" component="span">
            {selectedOptions[0]?.label ?? ""}
        </Text>
    );
}

function MantineModalDialog({
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
    customization,
}: ModalProps) {
    return (
        <MantineModal
            opened={Boolean(open)}
            onClose={() => onClose?.()}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            title={headerContent}
            withCloseButton={Boolean(onClose)}
            closeButtonProps={{
                className: customization?.closeButton?.className,
                style: customization?.closeButton?.style,
                title: customization?.closeButton?.title,
                children: customization?.closeButton?.content,
            }}
            centered
        >
            <Stack className={className} style={style} aria-busy={ariaBusy} gap="md">
                {children}
                {footerContent ? (
                    <Group justify="flex-end" mt="xs">
                        {footerContent}
                    </Group>
                ) : null}
            </Stack>
        </MantineModal>
    );
}

function MantineOptionListContainer({
    className,
    style,
    searchInput,
    optionList,
    children,
    ref,
    ...divProps
}: OptionListProps<HTMLDivElement>) {
    return (
        <Stack ref={ref} className={className} style={style} gap="sm" {...divProps}>
            {searchInput}
            {optionList}
            {children}
        </Stack>
    );
}

function MantineOptionListInput({
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

    return (
        <Stack gap="xs" onKeyDown={onKeyDown as React.KeyboardEventHandler<HTMLDivElement>}>
            {multiple ? (
                optgroups.map((optgroup) => (
                    <Fragment key={optgroup.label.length > 0 ? `group:${optgroup.label}` : `group:${optgroup.options[0]?.value ?? ""}`}>
                        {optgroup.label ? (
                            <Text
                                fw={600}
                                c="dimmed"
                                size="sm"
                                className={customization?.groupHeader?.className}
                                style={customization?.groupHeader?.style}
                            >
                                {optgroup.label}
                            </Text>
                        ) : null}

                        {optgroup.options.map((option) => {
                            const isChecked = selectedValueSet.has(option.value);
                            const isDisabled = Boolean(disabled || option.disabled);
                            return (
                                <Box
                                    key={option.value}
                                    className={customization?.optionItem?.className}
                                    style={customization?.optionItem?.style}
                                >
                                    <Checkbox
                                        name={name}
                                        value={option.value}
                                        checked={isChecked}
                                        disabled={isDisabled}
                                        onChange={() => handleSelect(option.value)}
                                        onClick={onOptionClick}
                                        onKeyDown={onOptionKeyDown}
                                        label={option.label}
                                    />
                                </Box>
                            );
                        })}
                    </Fragment>
                ))
            ) : (
                <RadioGroup name={name} value={selectedValues[0] ?? ""} onChange={handleSelect}>
                    <Stack gap="xs">
                        {optgroups.map((optgroup) => (
                            <Fragment
                                key={optgroup.label.length > 0 ? `group:${optgroup.label}` : `group:${optgroup.options[0]?.value ?? ""}`}
                            >
                                {optgroup.label ? (
                                    <Text
                                        fw={600}
                                        c="dimmed"
                                        size="sm"
                                        className={customization?.groupHeader?.className}
                                        style={customization?.groupHeader?.style}
                                    >
                                        {optgroup.label}
                                    </Text>
                                ) : null}

                                {optgroup.options.map((option) => {
                                    const isDisabled = Boolean(disabled || option.disabled);
                                    return (
                                        <Box
                                            key={option.value}
                                            className={customization?.optionItem?.className}
                                            style={customization?.optionItem?.style}
                                        >
                                            <Radio
                                                value={option.value}
                                                disabled={isDisabled}
                                                onClick={onOptionClick}
                                                onKeyDown={onOptionKeyDown}
                                                label={option.label}
                                            />
                                        </Box>
                                    );
                                })}
                            </Fragment>
                        ))}
                    </Stack>
                </RadioGroup>
            )}
            {indicator}
        </Stack>
    );
}

function MantineSearchInput({
    search,
    onSearchChange,
    isSearching,
    className,
    style,
    disabled,
    ref,
    onKeyDown,
    customization,
}: SearchInputProps) {
    return (
        <TextInput
            ref={ref}
            type="search"
            value={search ?? ""}
            onChange={(event) => onSearchChange(event.currentTarget.value)}
            onKeyDown={onKeyDown}
            disabled={disabled}
            className={className}
            style={style}
            placeholder={customization?.placeholder}
            rightSection={isSearching ? <Loader size="xs" /> : undefined}
        />
    );
}

function MantinePendingIndicator({ inline, className, style, title, content }: PendingIndicatorProps) {
    return (
        <Box
            component={inline ? "span" : "div"}
            className={className}
            style={style}
            title={title}
            aria-label={typeof content === "string" ? content : "Loading"}
        >
            <Loader size="xs" />
            {content ? <VisuallyHidden>{content}</VisuallyHidden> : null}
        </Box>
    );
}

function MantineErrorIndicator({ className, style, message, inline, onRetry, customization }: ErrorIndicatorProps) {
    const icon = customization?.icon;
    if (inline) {
        return (
            <Text className={className} style={style} c="red" span>
                {icon ? <>{icon} </> : null}
                {message ?? "Unable to load options"}
            </Text>
        );
    }

    return (
        <Alert className={className} style={style} color="red" variant="light">
            <Group justify="space-between" wrap="nowrap">
                <Text size="sm">
                    {icon ? <>{icon} </> : null}
                    {message ?? "Unable to load options"}
                </Text>
                {onRetry ? (
                    <Button
                        className={customization?.retryButton?.className}
                        style={customization?.retryButton?.style}
                        variant="light"
                        color="red"
                        size="compact-sm"
                        onClick={onRetry}
                    >
                        {customization?.retryButton?.content ?? "Retry"}
                    </Button>
                ) : null}
            </Group>
        </Alert>
    );
}

function MantineEmptyIndicator({ className, style, onRetry, customization }: EmptyIndicatorProps) {
    return (
        <Alert className={className} style={style} color="blue" variant="light">
            <Group justify="space-between" wrap="nowrap">
                <Text size="sm">{customization?.content ?? "No options found"}</Text>
                {onRetry ? (
                    <Button
                        className={customization?.retryButton?.className}
                        style={customization?.retryButton?.style}
                        title={customization?.retryButton?.title}
                        variant="light"
                        color="blue"
                        size="compact-sm"
                        onClick={onRetry}
                    >
                        {customization?.retryButton?.content ?? "Retry"}
                    </Button>
                ) : null}
            </Group>
        </Alert>
    );
}

function MantineMoreIndicator({ onLoadMore, className, style, disabled, customization }: MoreIndicatorProps) {
    if (!onLoadMore) {
        return (
            <Text
                className={[className, customization?.overflowIndicator?.className].filter(Boolean).join(" ")}
                style={
                    style || customization?.overflowIndicator?.style ? { ...style, ...customization?.overflowIndicator?.style } : undefined
                }
                title={customization?.overflowIndicator?.title}
                c="dimmed"
                ta="center"
                size="sm"
            >
                {customization?.overflowIndicator?.content ?? "..."}
            </Text>
        );
    }

    return (
        <Button
            className={[className, customization?.loadMoreButton?.className].filter(Boolean).join(" ")}
            style={style || customization?.loadMoreButton?.style ? { ...style, ...customization?.loadMoreButton?.style } : undefined}
            title={customization?.loadMoreButton?.title}
            variant="light"
            size="compact-sm"
            onClick={onLoadMore}
            disabled={disabled}
        >
            {customization?.loadMoreButton?.content ?? "Load more"}
        </Button>
    );
}

function MantineOkButton({ className, style, disabled, title, onClick, customization }: OkButtonProps) {
    return (
        <Button className={className} style={style} title={title} variant="filled" onClick={onClick} disabled={disabled}>
            {customization?.content ?? "Done"}
        </Button>
    );
}

function MantineNativeSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
    const { className, style, children, size: nativeSize, ...selectProps } = props;
    void nativeSize;
    return (
        <NativeSelect className={className} style={style} {...selectProps}>
            {children}
        </NativeSelect>
    );
}

function MantineToggleButtonInput({
    options,
    value,
    onValueToggle,
    multiple,
    disabled,
    className,
    style,
    ref,
    onKeyDown,
    onKeyUp,
}: ToggleButtonInputProps<HTMLDivElement>) {
    const selectedValues = multiple ? value : value.slice(0, 1);

    return (
        <Group
            ref={ref}
            className={className}
            style={style}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            role={multiple ? "group" : "radiogroup"}
        >
            {options.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                const isDisabled = Boolean(disabled || option.disabled);
                return (
                    <Button
                        key={option.value}
                        type="button"
                        variant={isSelected ? "filled" : "default"}
                        disabled={isDisabled}
                        onClick={() => onValueToggle(option.value)}
                    >
                        {option.label}
                    </Button>
                );
            })}
        </Group>
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
