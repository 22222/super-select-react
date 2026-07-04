import type React from "react";
import { Children, Fragment, isValidElement } from "react";

import type { Option } from "../Option";

/**
 * Parses option and optgroup children into an array of options.
 */
export function parseChildOptions(children: React.ReactNode): Option[] {
    return parseChildOptionsInternal(children, new Set<string>());
}

function parseChildOptionsInternal(children: React.ReactNode, seenValues: Set<string>): Option[] {
    const options: Option[] = [];
    for (const child of Children.toArray(children)) {
        if (!isValidElement(child)) {
            continue;
        }

        if (child.type === Fragment) {
            const fragment = child as React.ReactElement<{ children?: React.ReactNode }>;
            options.push(...parseChildOptionsInternal(fragment.props.children, seenValues));
            continue;
        }

        if (child.type === "option") {
            const optionElement = child as React.ReactElement<{
                value?: string;
                label?: string;
                children?: React.ReactNode;
                disabled?: boolean;
                hidden?: boolean;
                data?: unknown;
            }>;
            const text = readNodeText(optionElement.props.children);
            const value = optionElement.props.value !== undefined ? String(optionElement.props.value) : text;

            if (seenValues.has(value)) {
                continue;
            }
            seenValues.add(value);

            const label = optionElement.props.label !== undefined ? String(optionElement.props.label) : text;

            const elementProps = optionElement.props as Record<string, unknown>;
            const dataAttributes = Object.entries(elementProps).reduce<Record<string, unknown>>((accumulator, [key, value]) => {
                if (!key.startsWith("data-") || value === undefined) {
                    return accumulator;
                }

                accumulator[key.slice(5)] = value;
                return accumulator;
            }, {});
            const optionData =
                optionElement.props.data !== undefined
                    ? { ...dataAttributes, value: optionElement.props.data }
                    : Object.keys(dataAttributes).length > 0
                      ? dataAttributes
                      : undefined;

            options.push({
                value,
                label,
                children: hasRichChildren(optionElement.props.children) ? optionElement.props.children : undefined,
                disabled: Boolean(optionElement.props.disabled),
                hidden: Boolean(optionElement.props.hidden),
                data: optionData,
            });
            continue;
        }

        if (child.type === "optgroup") {
            const groupElement = child as React.ReactElement<{
                label?: string;
                children?: React.ReactNode;
            }>;
            const groupLabel = String(groupElement.props.label ?? "");
            const groupChildren = Children.toArray(groupElement.props.children);
            for (const groupChild of groupChildren) {
                const groupChildOptions = parseChildOptionsInternal(groupChild, seenValues);
                for (const option of groupChildOptions) {
                    option.groupLabel = groupLabel;
                    options.push(option);
                }
            }
        }
    }

    return options;
}

function hasRichChildren(node: React.ReactNode): boolean {
    if (node === null || node === undefined || typeof node === "boolean") {
        return false;
    }

    if (typeof node === "string" || typeof node === "number") {
        return false;
    }

    if (Array.isArray(node)) {
        return node.some((entry) => hasRichChildren(entry));
    }

    return true;
}

function readNodeText(node: React.ReactNode): string {
    if (node === null || node === undefined || typeof node === "boolean") {
        return "";
    }

    if (typeof node === "string") {
        return node;
    }

    if (typeof node === "number") {
        return String(node);
    }

    if (Array.isArray(node)) {
        return node.map((entry) => readNodeText(entry)).join("");
    }

    if (isValidElement(node)) {
        const element = node as React.ReactElement<{ children?: React.ReactNode }>;
        return readNodeText(element.props.children);
    }

    return "";
}
