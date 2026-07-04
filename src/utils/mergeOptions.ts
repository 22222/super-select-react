import type { Option } from "../option-source";

/**
 * Combines static and asynchronously loaded options, preserving order and the first option for each value.
 */
export function mergeOptions(staticOptions: Option[], asyncOptions: Option[]): Option[] {
    const mergedOptions: Option[] = [];
    const seenValues = new Set<string>();

    for (const option of staticOptions) {
        if (seenValues.has(option.value)) {
            continue;
        }

        seenValues.add(option.value);
        mergedOptions.push(option);
    }

    for (const option of asyncOptions) {
        if (seenValues.has(option.value)) {
            continue;
        }

        seenValues.add(option.value);
        mergedOptions.push(option);
    }

    return mergedOptions;
}
