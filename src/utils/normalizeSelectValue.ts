/**
 * Converts a select value into an array of strings.
 */
export function normalizeSelectValue(value: SelectValue): string[] {
    if (Array.isArray(value)) {
        return value.map(String);
    }

    if (typeof value === "string" && value.length > 0) {
        return [value];
    }

    if (typeof value === "number") {
        return [String(value)];
    }

    return [];
}

type SelectValue = string | number | readonly string[] | null | undefined;
