import type React from "react";

import type { CloseButtonProps } from "./modal-select/CloseButton";
import type { ModalProps } from "./modal-select/Modal";
import type { ModalSelectButtonProps } from "./modal-select/ModalSelectButton";
import type { OkButtonProps } from "./modal-select/OkButton";
import type { SelectedContentProps } from "./modal-select/SelectedContent";
import type { EmptyIndicatorProps } from "./option-list-select/EmptyIndicator";
import type { MoreIndicatorProps } from "./option-list-select/MoreIndicator";
import type { OptionListProps } from "./option-list-select/OptionList";
import type { OptionListInputProps } from "./option-list-select/OptionListInput";
import type { SearchInputProps } from "./option-list-select/SearchInput";
import type { Option } from "./option-source";
import type { AnyHTMLElement } from "./SelectProps";
import type { ToggleButtonInputProps } from "./toggle-button-select";
import type { ErrorIndicatorProps } from "./utils/ErrorIndicator";
import type { FallbackProps } from "./utils/Fallback";
import type { PendingIndicatorProps } from "./utils/PendingIndicator";

/**
 * Customization options for a `SuperSelect` component.
 */
export interface SuperSelectCustomization {
    classNamePrefix?: string;
    fallback?: {
        className?: string;
        style?: React.CSSProperties;
        component?: React.ComponentType<FallbackProps>;
    };
    modalSelectButton?: {
        className?: string;
        style?: React.CSSProperties;
        component?: React.ComponentType<ModalSelectButtonProps<AnyHTMLElement>>;
        selectedContent?: {
            className?: string;
            style?: React.CSSProperties;
            placeholder?: string;
            component?: React.ComponentType<SelectedContentProps>;
        };
    };
    modal?: {
        className?: string;
        style?: React.CSSProperties;
        component?: React.ComponentType<ModalProps>;
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
        okButton?: {
            className?: string;
            style?: React.CSSProperties;
            title?: string;
            content?: React.ReactNode;
            component?: React.ComponentType<OkButtonProps>;
        };
        closeButton?: {
            className?: string;
            style?: React.CSSProperties;
            title?: string;
            content?: React.ReactNode;
            component?: React.ComponentType<CloseButtonProps>;
        };
    };
    optionList?: {
        className?: string;
        style?: React.CSSProperties;
        component?: React.ComponentType<OptionListProps<AnyHTMLElement>>;
    };
    optionListInput?: {
        className?: string;
        style?: React.CSSProperties;
        component?: React.ComponentType<OptionListInputProps<AnyHTMLElement, AnyHTMLElement>>;
        optionItem?: {
            className?: string;
            style?: React.CSSProperties;
        };
        groupHeader?: {
            className?: string;
            style?: React.CSSProperties;
        };
    };
    searchInput?: {
        className?: string;
        style?: React.CSSProperties;
        placeholder?: string;
        component?: React.ComponentType<SearchInputProps<AnyHTMLElement>>;
    };
    searchMatcher?: (option: Option, search: string) => boolean;
    toggleButtonInput?: {
        className?: string;
        style?: React.CSSProperties;
        component?: React.ComponentType<ToggleButtonInputProps<AnyHTMLElement>>;
        buttonGroup?: {
            className?: string;
            style?: React.CSSProperties;
        };
        button?: {
            className?: string;
            style?: React.CSSProperties;
        };
    };
    selectInput?: {
        className?: string;
        style?: React.CSSProperties;
        component?: React.ComponentType<React.SelectHTMLAttributes<HTMLSelectElement>>;
    };
    errorIndicator?: {
        className?: string;
        style?: React.CSSProperties;
        icon?: React.ReactNode;
        defaultMessage?: React.ReactNode;
        retryButton?: {
            className?: string;
            style?: React.CSSProperties;
            title?: string;
            content?: React.ReactNode;
        };
        component?: React.ComponentType<ErrorIndicatorProps>;
    };
    pendingIndicator?: {
        className?: string;
        style?: React.CSSProperties;
        title?: string;
        content?: React.ReactNode;
        component?: React.ComponentType<PendingIndicatorProps>;
    };
    emptyIndicator?: {
        className?: string;
        style?: React.CSSProperties;
        content?: React.ReactNode;
        retryButton?: {
            className?: string;
            style?: React.CSSProperties;
            title?: string;
            content?: React.ReactNode;
        };
        component?: React.ComponentType<EmptyIndicatorProps>;
    };
    maxAdditionalPages?: number;
    moreIndicator?: {
        className?: string;
        style?: React.CSSProperties;
        loadMoreButton?: {
            className?: string;
            style?: React.CSSProperties;
            title?: string;
            content?: React.ReactNode;
        };
        overflowIndicator?: {
            className?: string;
            style?: React.CSSProperties;
            title?: string;
            content?: React.ReactNode;
        };
        component?: React.ComponentType<MoreIndicatorProps>;
    };
}
