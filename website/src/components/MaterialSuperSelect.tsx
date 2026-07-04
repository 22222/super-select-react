import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import NativeSelect from "@mui/material/NativeSelect";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import type React from "react";
import { useMemo } from "react";
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

interface MaterialSuperSelectProps<Multiple extends boolean = boolean> extends Omit<SuperSelectProps<Multiple>, "customization"> {
    customization?: SuperSelectCustomization;
}

export function MaterialSuperSelect<Multiple extends boolean = false>({ customization, ...props }: MaterialSuperSelectProps<Multiple>) {
    return (
        <SuperSelect
            {...props}
            customization={{
                classNamePrefix: "mui-super-select",
                ...customization,
                modalSelectButton: {
                    component: MaterialSelectButton,
                    ...customization?.modalSelectButton,
                    selectedContent: {
                        component: MaterialSelectedContent,
                        ...customization?.modalSelectButton?.selectedContent,
                    },
                },
                modal: {
                    component: MaterialModalDialog,
                    ...customization?.modal,
                    okButton: {
                        component: MaterialOkButton,
                        ...customization?.modal?.okButton,
                    },
                },
                optionList: {
                    component: MaterialOptionListContainer,
                    ...customization?.optionList,
                },
                optionListInput: {
                    component: MaterialOptionListInput,
                    ...customization?.optionListInput,
                },
                searchInput: {
                    component: MaterialSearchInput,
                    placeholder: "Search options",
                    ...customization?.searchInput,
                },
                toggleButtonInput: {
                    component: MaterialToggleButtonInput,
                    ...customization?.toggleButtonInput,
                },
                selectInput: {
                    component: MaterialNativeSelect,
                    ...customization?.selectInput,
                },
                pendingIndicator: {
                    component: MaterialPendingIndicator,
                    ...customization?.pendingIndicator,
                },
                errorIndicator: {
                    component: MaterialErrorIndicator,
                    ...customization?.errorIndicator,
                },
                emptyIndicator: {
                    component: MaterialEmptyIndicator,
                    ...customization?.emptyIndicator,
                },
                moreIndicator: {
                    component: MaterialMoreIndicator,
                    ...customization?.moreIndicator,
                },
            }}
        />
    );
}

function MaterialSelectButton({
    children,
    ref,
    disabled,
    className,
    style,
    onFocus,
    onBlur,
    onClick,
    onMouseDown,
    onMouseUp,
    onPointerDown,
    onPointerUp,
    onContextMenu,
    onKeyDown,
    onKeyUp,
    onSelect,
    onCompositionStart,
    onCompositionUpdate,
    onCompositionEnd,
    onBeforeInput,
    "aria-expanded": ariaExpanded,
    "aria-readonly": ariaReadonly,
    "aria-busy": ariaBusy,
    "aria-invalid": ariaInvalid,
    "aria-haspopup": ariaHasPopup,
}: ModalSelectButtonProps<HTMLDivElement>) {
    return (
        <FormControl fullWidth disabled={disabled}>
            <Select
                value="selected"
                open={false}
                displayEmpty
                ref={ref}
                className={className}
                style={style}
                renderValue={() => children}
                SelectDisplayProps={{
                    "aria-expanded": ariaExpanded,
                    "aria-readonly": ariaReadonly,
                    "aria-busy": ariaBusy,
                    "aria-invalid": ariaInvalid,
                    "aria-haspopup": ariaHasPopup,
                    onFocus,
                    onBlur,
                    onClick,
                    onMouseDown,
                    onMouseUp,
                    onPointerDown,
                    onPointerUp,
                    onContextMenu,
                    onKeyDown,
                    onKeyUp,
                    onSelect,
                    onCompositionStart,
                    onCompositionUpdate,
                    onCompositionEnd,
                    onBeforeInput,
                }}
                onChange={() => undefined}
            >
                <MenuItem value="selected">{children}</MenuItem>
            </Select>
        </FormControl>
    );
}

function MaterialSelectedContent({ selectedOptions, className, style }: SelectedContentProps) {
    if (selectedOptions.length > 1) {
        return (
            <Stack className={className} style={style} direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                {selectedOptions.map((option) => (
                    <Typography key={option.value} variant="body2">
                        {option.label}
                    </Typography>
                ))}
            </Stack>
        );
    }

    return (
        <Typography className={className} style={style} variant="body2" component="span">
            {selectedOptions[0]?.label ?? ""}
        </Typography>
    );
}

function MaterialModalDialog({
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
    const CloseButtonComponent = customization?.closeButton?.component;
    return (
        <Dialog
            open={Boolean(open)}
            onClose={() => onClose?.()}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            fullWidth
            maxWidth="sm"
        >
            <Box className={className} style={style} sx={{ p: 2 }} aria-busy={ariaBusy}>
                {headerContent ? (
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>{headerContent}</Box>
                        {CloseButtonComponent ? (
                            <CloseButtonComponent
                                className={customization?.closeButton?.className}
                                style={customization?.closeButton?.style}
                                title={customization?.closeButton?.title}
                                onClick={onClose}
                                customization={{
                                    classNamePrefix: customization?.classNamePrefix,
                                    content: customization?.closeButton?.content,
                                }}
                            />
                        ) : (
                            <Button
                                className={customization?.closeButton?.className}
                                style={customization?.closeButton?.style}
                                title={customization?.closeButton?.title}
                                onClick={onClose}
                                variant="text"
                                size="small"
                            >
                                {customization?.closeButton?.content ?? "Close"}
                            </Button>
                        )}
                    </Stack>
                ) : null}
                <Box>{children}</Box>
                {footerContent ? (
                    <Stack direction="row" sx={{ justifyContent: "flex-end", mt: 2 }}>
                        {footerContent}
                    </Stack>
                ) : null}
            </Box>
        </Dialog>
    );
}

function MaterialOptionListContainer({
    className,
    style,
    searchInput,
    optionList,
    children,
    ref,
    ...divProps
}: OptionListProps<HTMLDivElement>) {
    return (
        <Stack ref={ref} className={className} style={style} spacing={1} {...divProps}>
            {searchInput}
            {optionList}
            {children}
        </Stack>
    );
}

function MaterialOptionListInput({
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
        <Stack spacing={1} onKeyDown={onKeyDown as React.KeyboardEventHandler<HTMLDivElement>}>
            {multiple ? (
                optgroups.map((optgroup) => (
                    <Box key={optgroup.label.length > 0 ? `group:${optgroup.label}` : `group:${optgroup.options[0]?.value ?? ""}`}>
                        {optgroup.label ? (
                            <Typography
                                variant="caption"
                                component="div"
                                color="text.secondary"
                                className={customization?.groupHeader?.className}
                                style={customization?.groupHeader?.style}
                                sx={{ fontWeight: 600, mb: 0.25 }}
                            >
                                {optgroup.label}
                            </Typography>
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
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                name={name}
                                                value={option.value}
                                                checked={isChecked}
                                                disabled={isDisabled}
                                                onChange={() => handleSelect(option.value)}
                                                slotProps={{
                                                    input: {
                                                        onClick: onOptionClick,
                                                        onKeyDown: onOptionKeyDown,
                                                    },
                                                }}
                                            />
                                        }
                                        label={option.label}
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                ))
            ) : (
                <RadioGroup name={name} value={selectedValues[0] ?? ""} onChange={(event) => handleSelect(event.target.value)}>
                    {optgroups.map((optgroup) => (
                        <Box key={optgroup.label.length > 0 ? `group:${optgroup.label}` : `group:${optgroup.options[0]?.value ?? ""}`}>
                            {optgroup.label ? (
                                <Typography
                                    variant="caption"
                                    component="div"
                                    color="text.secondary"
                                    className={customization?.groupHeader?.className}
                                    style={customization?.groupHeader?.style}
                                    sx={{ fontWeight: 600, mb: 0.25 }}
                                >
                                    {optgroup.label}
                                </Typography>
                            ) : null}

                            {optgroup.options.map((option) => {
                                const isDisabled = Boolean(disabled || option.disabled);
                                return (
                                    <Box
                                        key={option.value}
                                        className={customization?.optionItem?.className}
                                        style={customization?.optionItem?.style}
                                    >
                                        <FormControlLabel
                                            control={
                                                <Radio
                                                    value={option.value}
                                                    disabled={isDisabled}
                                                    slotProps={{
                                                        input: {
                                                            onClick: onOptionClick,
                                                            onKeyDown: onOptionKeyDown,
                                                        },
                                                    }}
                                                />
                                            }
                                            label={option.label}
                                        />
                                    </Box>
                                );
                            })}
                        </Box>
                    ))}
                </RadioGroup>
            )}
            {indicator}
        </Stack>
    );
}

function MaterialSearchInput({
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
        <TextField
            inputRef={ref}
            type="search"
            value={search ?? ""}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={onKeyDown}
            disabled={disabled}
            className={className}
            style={style}
            size="small"
            fullWidth
            placeholder={customization?.placeholder}
            slotProps={{
                input: {
                    endAdornment: isSearching ? <CircularProgress size={16} /> : undefined,
                },
            }}
        />
    );
}

function MaterialPendingIndicator({ inline, className, style, title, content }: PendingIndicatorProps) {
    return (
        <Box
            component={inline ? "span" : "div"}
            className={className}
            style={style}
            title={title}
            aria-label={typeof content === "string" ? content : "Loading"}
        >
            <CircularProgress size={16} />
            {content ? (
                <Typography
                    component="span"
                    sx={{
                        border: 0,
                        clip: "rect(0 0 0 0)",
                        height: 1,
                        margin: -1,
                        overflow: "hidden",
                        padding: 0,
                        position: "absolute",
                        width: 1,
                    }}
                >
                    {content}
                </Typography>
            ) : null}
        </Box>
    );
}

function MaterialErrorIndicator({ className, style, message, inline, onRetry, customization }: ErrorIndicatorProps) {
    const icon = customization?.icon;
    if (inline) {
        return (
            <Typography className={className} style={style} component="span" color="error" variant="body2">
                {icon ? <>{icon} </> : null}
                {message ?? "Unable to load options"}
            </Typography>
        );
    }

    return (
        <Alert className={className} style={style} severity="error" variant="outlined">
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="body2">
                    {icon ? <>{icon} </> : null}
                    {message ?? "Unable to load options"}
                </Typography>
                {onRetry ? (
                    <Button
                        className={customization?.retryButton?.className}
                        style={customization?.retryButton?.style}
                        size="small"
                        color="error"
                        variant="text"
                        onClick={onRetry}
                    >
                        {customization?.retryButton?.content ?? "Retry"}
                    </Button>
                ) : null}
            </Stack>
        </Alert>
    );
}

function MaterialEmptyIndicator({ className, style, onRetry, customization }: EmptyIndicatorProps) {
    return (
        <Alert className={className} style={style} severity="info" variant="outlined">
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="body2">{customization?.content ?? "No options found"}</Typography>
                {onRetry ? (
                    <Button
                        className={customization?.retryButton?.className}
                        style={customization?.retryButton?.style}
                        title={customization?.retryButton?.title}
                        size="small"
                        color="info"
                        variant="text"
                        onClick={onRetry}
                    >
                        {customization?.retryButton?.content ?? "Retry"}
                    </Button>
                ) : null}
            </Stack>
        </Alert>
    );
}

function MaterialMoreIndicator({ onLoadMore, className, style, disabled, customization }: MoreIndicatorProps) {
    if (!onLoadMore) {
        return (
            <Typography
                className={[className, customization?.overflowIndicator?.className].filter(Boolean).join(" ")}
                style={
                    style || customization?.overflowIndicator?.style ? { ...style, ...customization?.overflowIndicator?.style } : undefined
                }
                title={customization?.overflowIndicator?.title}
                variant="body2"
                color="text.secondary"
                align="center"
            >
                {customization?.overflowIndicator?.content ?? "..."}
            </Typography>
        );
    }

    return (
        <Button
            className={[className, customization?.loadMoreButton?.className].filter(Boolean).join(" ")}
            style={style || customization?.loadMoreButton?.style ? { ...style, ...customization?.loadMoreButton?.style } : undefined}
            title={customization?.loadMoreButton?.title}
            variant="outlined"
            size="small"
            onClick={onLoadMore}
            disabled={disabled}
        >
            {customization?.loadMoreButton?.content ?? "Load more"}
        </Button>
    );
}

function MaterialOkButton({ className, style, disabled, title, onClick, customization }: OkButtonProps) {
    return (
        <Button className={className} style={style} title={title} variant="contained" onClick={onClick} disabled={disabled}>
            {customization?.content ?? "Done"}
        </Button>
    );
}

function MaterialNativeSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
    const {
        className,
        style,
        children,
        id,
        name,
        disabled,
        required,
        value,
        defaultValue,
        onChange,
        autoComplete,
        autoFocus,
        ...nativeInputProps
    } = props;
    return (
        <FormControl fullWidth size="small">
            <NativeSelect
                className={className}
                style={style}
                id={id}
                name={name}
                disabled={disabled}
                required={required}
                value={value as string | number | readonly string[] | undefined}
                defaultValue={defaultValue as string | number | readonly string[] | undefined}
                onChange={onChange}
                autoComplete={autoComplete}
                autoFocus={autoFocus}
                inputProps={nativeInputProps}
            >
                {children}
            </NativeSelect>
        </FormControl>
    );
}

function MaterialToggleButtonInput({
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
        <ToggleButtonGroup
            ref={ref}
            className={className}
            style={style}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            role={multiple ? "group" : "radiogroup"}
            value={multiple ? selectedValues : (selectedValues[0] ?? null)}
            exclusive={!multiple}
            onChange={(_, nextValue) => {
                if (multiple) {
                    const nextValues = Array.isArray(nextValue) ? nextValue : [];
                    const removed = selectedValues.find((entry) => !nextValues.includes(entry));
                    const added = nextValues.find((entry) => !selectedValues.includes(entry));
                    const candidate = removed ?? added;
                    if (candidate !== undefined) {
                        onValueToggle(candidate);
                    }
                    return;
                }

                if (typeof nextValue === "string") {
                    onValueToggle(nextValue);
                } else if (selectedValues[0]) {
                    onValueToggle(selectedValues[0]);
                }
            }}
            size="small"
        >
            {options.map((option) => (
                <ToggleButton key={option.value} value={option.value} disabled={Boolean(disabled || option.disabled)}>
                    {option.label}
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
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
