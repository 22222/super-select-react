import type { InputRef } from "antd";
import { Alert, Button, Checkbox, Flex, Input, Modal, Radio, Select, Space, Spin, Typography } from "antd";
import type React from "react";
import { Fragment, useMemo } from "react";
import type {
    EmptyIndicatorProps,
    ErrorIndicatorProps,
    ModalProps,
    ModalSelectButtonProps,
    MoreIndicatorProps,
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

interface AntdSuperSelectProps<Multiple extends boolean = boolean> extends Omit<SuperSelectProps<Multiple>, "customization"> {
    customization?: SuperSelectCustomization;
}

export function AntdSuperSelect<Multiple extends boolean = false>({ customization, ...props }: AntdSuperSelectProps<Multiple>) {
    return (
        <SuperSelect
            {...props}
            customization={{
                classNamePrefix: "antd-super-select",
                ...customization,
                modalSelectButton: {
                    component: AntdSelectButton,
                    ...customization?.modalSelectButton,
                    selectedContent: {
                        component: AntdSelectedContent,
                        placeholder: "\u200B",
                        ...customization?.modalSelectButton?.selectedContent,
                    },
                },
                modal: {
                    component: AntdModalDialog,
                    ...customization?.modal,
                },
                searchInput: {
                    component: AntdSearchInput,
                    placeholder: "Search options",
                    ...customization?.searchInput,
                },
                optionList: {
                    component: AntdOptionListContainer,
                    ...customization?.optionList,
                },
                optionListInput: {
                    component: AntdOptionListInput,
                    ...customization?.optionListInput,
                },
                pendingIndicator: {
                    component: AntdPendingIndicator,
                    ...customization?.pendingIndicator,
                },
                errorIndicator: {
                    component: AntdErrorIndicator,
                    ...customization?.errorIndicator,
                },
                emptyIndicator: {
                    component: AntdEmptyIndicator,
                    ...customization?.emptyIndicator,
                },
                moreIndicator: {
                    component: AntdMoreIndicator,
                    ...customization?.moreIndicator,
                },
                toggleButtonInput: {
                    component: AntdToggleButtonInput,
                    ...customization?.toggleButtonInput,
                },
            }}
        />
    );
}

function AntdOptionListContainer({
    className,
    style,
    searchInput,
    optionList,
    children,
    ref,
    ...divProps
}: OptionListProps<HTMLDivElement>) {
    return (
        <Flex ref={ref} className={className} style={style} vertical gap={8} {...divProps}>
            {searchInput}
            {optionList}
            {children}
        </Flex>
    );
}

function AntdOptionListInput({
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
        <Flex vertical gap={6} onKeyDown={onKeyDown as React.KeyboardEventHandler<HTMLDivElement>}>
            {multiple ? (
                optgroups.map((optgroup) => (
                    <Fragment key={optgroup.label.length > 0 ? `group:${optgroup.label}` : `group:${optgroup.options[0]?.value ?? ""}`}>
                        {optgroup.label ? (
                            <Typography.Text
                                className={customization?.groupHeader?.className}
                                style={customization?.groupHeader?.style}
                                type="secondary"
                                strong
                            >
                                {optgroup.label}
                            </Typography.Text>
                        ) : null}

                        {optgroup.options.map((option) => {
                            const isChecked = selectedValueSet.has(option.value);
                            const isDisabled = Boolean(disabled || option.disabled);

                            return (
                                <div
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
                                    >
                                        {option.label}
                                    </Checkbox>
                                </div>
                            );
                        })}
                    </Fragment>
                ))
            ) : (
                <Radio.Group
                    name={name}
                    value={selectedValues[0]}
                    disabled={disabled}
                    onChange={(event) => handleSelect(event.target.value)}
                >
                    <Flex vertical gap={6}>
                        {optgroups.map((optgroup) => (
                            <Fragment
                                key={optgroup.label.length > 0 ? `group:${optgroup.label}` : `group:${optgroup.options[0]?.value ?? ""}`}
                            >
                                {optgroup.label ? (
                                    <Typography.Text
                                        className={customization?.groupHeader?.className}
                                        style={customization?.groupHeader?.style}
                                        type="secondary"
                                        strong
                                    >
                                        {optgroup.label}
                                    </Typography.Text>
                                ) : null}

                                {optgroup.options.map((option) => {
                                    const isDisabled = Boolean(disabled || option.disabled);

                                    return (
                                        <div
                                            key={option.value}
                                            className={customization?.optionItem?.className}
                                            style={customization?.optionItem?.style}
                                        >
                                            <Radio
                                                value={option.value}
                                                disabled={isDisabled}
                                                onClick={onOptionClick}
                                                onKeyDown={onOptionKeyDown}
                                            >
                                                {option.label}
                                            </Radio>
                                        </div>
                                    );
                                })}
                            </Fragment>
                        ))}
                    </Flex>
                </Radio.Group>
            )}
            {indicator}
        </Flex>
    );
}

function AntdSelectButton({ children, className, style, disabled, ref, ...selectButtonProps }: ModalSelectButtonProps<HTMLDivElement>) {
    return (
        <div ref={ref} className={className} style={style} {...selectButtonProps}>
            <Select
                open={false}
                disabled={disabled}
                value="selected"
                options={[{ value: "selected", label: children }]}
                style={{ width: "100%" }}
            />
        </div>
    );
}

function AntdToggleButtonInput({
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
        <Flex ref={ref} id={id} className={className} style={style} title={title} tabIndex={tabIndex} vertical gap={8} {...divProps}>
            {optgroups.map((optgroup) => (
                <Fragment key={optgroup.label.length > 0 ? `group:${optgroup.label}` : `group:${optgroup.options[0]?.value ?? ""}`}>
                    {optgroup.label ? (
                        <Typography.Text type="secondary" strong>
                            {optgroup.label}
                        </Typography.Text>
                    ) : null}

                    {multiple ? (
                        <Flex gap={8} wrap>
                            {optgroup.options.map((option) => (
                                <Checkbox
                                    key={option.value}
                                    name={name}
                                    value={option.value}
                                    checked={selectedValueSet.has(option.value)}
                                    disabled={disabled || option.disabled}
                                    onChange={() => onValueToggle(option.value)}
                                >
                                    {option.label}
                                </Checkbox>
                            ))}
                        </Flex>
                    ) : (
                        <Radio.Group disabled={disabled} value={selectedValues[0]}>
                            <Flex gap={12} wrap>
                                {optgroup.options.map((option) => (
                                    <Radio
                                        key={option.value}
                                        name={name}
                                        value={option.value}
                                        disabled={disabled || option.disabled}
                                        onChange={() => onValueToggle(option.value)}
                                    >
                                        {option.label}
                                    </Radio>
                                ))}
                            </Flex>
                        </Radio.Group>
                    )}
                </Fragment>
            ))}
        </Flex>
    );
}

function AntdSelectedContent({ selectedOptions, className, style, customization }: SelectedContentProps) {
    if (selectedOptions.length > 1) {
        return (
            <Space className={className} style={style} size={4} wrap>
                {selectedOptions.map((option) => (
                    <Typography.Text key={option.value}>{option.label}</Typography.Text>
                ))}
            </Space>
        );
    }

    return (
        <Typography.Text className={className} style={style}>
            {selectedOptions[0]?.label ?? customization?.placeholder ?? ""}
        </Typography.Text>
    );
}

function AntdModalDialog({
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
        <Modal
            open={Boolean(open)}
            onCancel={() => onClose?.()}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            title={headerContent ? <div style={{ paddingRight: 40 }}>{headerContent}</div> : null}
            footer={footerContent ?? null}
            destroyOnHidden
        >
            <Flex className={className} style={style} aria-busy={ariaBusy} vertical gap={12}>
                {children}
            </Flex>
        </Modal>
    );
}

function AntdSearchInput({ search, onSearchChange, className, style, disabled, ref, onKeyDown, customization }: SearchInputProps) {
    return (
        <Input
            ref={(instance: InputRef | null) => {
                const inputElement = instance?.input ?? null;
                if (!ref) {
                    return;
                }

                if (typeof ref === "function") {
                    ref(inputElement);
                    return;
                }

                ref.current = inputElement;
            }}
            type="search"
            value={search ?? ""}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => onSearchChange(event.currentTarget.value)}
            onKeyDown={onKeyDown}
            disabled={disabled}
            className={className}
            style={style}
            placeholder={customization?.placeholder}
            allowClear
        />
    );
}

function AntdPendingIndicator({ inline, className, style, title, content }: PendingIndicatorProps) {
    return (
        <Space className={className} style={style} title={title} size={8} wrap>
            <Spin size="small" />
            {content ? (
                <Typography.Text style={inline ? { fontSize: 12 } : undefined} type="secondary">
                    {content}
                </Typography.Text>
            ) : null}
        </Space>
    );
}

function AntdErrorIndicator({ className, style, message, inline, onRetry, customization }: ErrorIndicatorProps) {
    if (inline) {
        return <Alert className={className} style={style} type="error" showIcon message={message ?? "Unable to load options"} />;
    }

    return (
        <Alert
            className={className}
            style={style}
            type="error"
            showIcon
            message={
                <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <Typography.Text>{message ?? "Unable to load options"}</Typography.Text>
                    {onRetry ? (
                        <Button
                            className={customization?.retryButton?.className}
                            style={customization?.retryButton?.style}
                            onClick={onRetry}
                            size="small"
                            type="link"
                        >
                            {customization?.retryButton?.content ?? "Retry"}
                        </Button>
                    ) : null}
                </Space>
            }
        />
    );
}

function AntdEmptyIndicator({ className, style, onRetry, customization }: EmptyIndicatorProps) {
    return (
        <Alert
            className={className}
            style={style}
            type="info"
            message={
                <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <Typography.Text>{customization?.content ?? "No options found"}</Typography.Text>
                    {onRetry ? (
                        <Button
                            className={customization?.retryButton?.className}
                            style={customization?.retryButton?.style}
                            title={customization?.retryButton?.title}
                            onClick={onRetry}
                            size="small"
                            type="link"
                        >
                            {customization?.retryButton?.content ?? "Retry"}
                        </Button>
                    ) : null}
                </Space>
            }
        />
    );
}

function AntdMoreIndicator({ onLoadMore, className, style, disabled, customization }: MoreIndicatorProps) {
    if (!onLoadMore) {
        return (
            <Typography.Text
                className={[className, customization?.overflowIndicator?.className].filter(Boolean).join(" ")}
                style={
                    style || customization?.overflowIndicator?.style ? { ...style, ...customization?.overflowIndicator?.style } : undefined
                }
                title={customization?.overflowIndicator?.title}
                type="secondary"
            >
                {customization?.overflowIndicator?.content ?? "..."}
            </Typography.Text>
        );
    }

    return (
        <Button
            className={[className, customization?.loadMoreButton?.className].filter(Boolean).join(" ")}
            style={style || customization?.loadMoreButton?.style ? { ...style, ...customization?.loadMoreButton?.style } : undefined}
            title={customization?.loadMoreButton?.title}
            onClick={onLoadMore}
            disabled={disabled}
            type="link"
        >
            {customization?.loadMoreButton?.content ?? "Load more"}
        </Button>
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
