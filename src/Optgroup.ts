import type { Option } from "./Option";

/**
 * A group of options.
 */
export interface Optgroup<TData = unknown> {
    /**
     * Human-readable text shown to users to describe the group.
     */
    label: string;

    /**
     * Options that are part of this group.
     */
    options: Option<TData>[];
}
