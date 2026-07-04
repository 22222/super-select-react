/**
 * Joins truthy class names into one string.
 */
export function cx(...classNames: Array<string | undefined | false>) {
    return classNames.filter(Boolean).join(" ");
}
