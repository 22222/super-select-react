import { useMemo, useState } from "react";
import {
    ErrorIndicator,
    type ErrorIndicatorProps,
    OptionSourceError,
    SuperSelect,
    type SuperSelectMode,
    useOptionSource,
} from "super-select-react";

import { ModeSelector } from "./ModeSelector";

export default function ErrorHandlingExample() {
    const [mode, setMode] = useState<SuperSelectMode | undefined>(undefined);
    const [isFetchFailureEnabled, setIsFetchFailureEnabled] = useState(true);

    const peopleOptions = useMemo(
        () => [
            { value: "robert-balboa", label: "Robert Balboa" },
            { value: "adrian-pennino", label: "Adrian Pennino" },
            { value: "apollo-creed", label: "Apollo Creed" },
        ],
        [],
    );

    const messageErrorSource = useOptionSource(
        {
            fetch: async () => {
                if (isFetchFailureEnabled) {
                    throw new OptionSourceError("Server returned 503.", {
                        code: "server",
                        httpStatus: 503,
                        userMessage: "Server returned 503 while loading people options.",
                    });
                }

                return {
                    options: peopleOptions,
                    hasMore: false,
                };
            },
        },
        [isFetchFailureEnabled, peopleOptions],
    );

    const noMessageErrorSource = useOptionSource(
        {
            fetch: async () => {
                if (isFetchFailureEnabled) {
                    throw new OptionSourceError("Server returned 503.");
                }

                return {
                    options: peopleOptions,
                    hasMore: false,
                };
            },
        },
        [isFetchFailureEnabled, peopleOptions],
    );

    const labelResolutionWithMessageSource = useOptionSource(
        {
            fetch: async ({ values }) => {
                if (values && values.length > 0) {
                    if (isFetchFailureEnabled) {
                        throw new OptionSourceError("Unable to resolve labels.", {
                            code: "server",
                            userMessage: "Label resolution failed while loading saved values.",
                        });
                    }

                    const requestedValues = new Set(values);
                    const resolved = [{ value: "id-42", label: "Saved Person 42" }, ...peopleOptions];
                    return {
                        options: resolved.filter((option) => requestedValues.has(option.value)),
                        hasMore: false,
                    };
                }

                return {
                    options: peopleOptions,
                    hasMore: false,
                };
            },
        },
        [isFetchFailureEnabled, peopleOptions],
    );

    const labelResolutionNoMessageSource = useOptionSource(
        {
            fetch: async ({ values }) => {
                if (values && values.length > 0) {
                    if (isFetchFailureEnabled) {
                        throw new OptionSourceError("Unable to resolve labels.");
                    }

                    const requestedValues = new Set(values);
                    const resolved = [
                        { value: "id-42", label: "Saved Person 42" },
                        { value: "id-77", label: "Saved Person 77" },
                        ...peopleOptions,
                    ];
                    return {
                        options: resolved.filter((option) => requestedValues.has(option.value)),
                        hasMore: false,
                    };
                }

                return {
                    options: peopleOptions,
                    hasMore: false,
                };
            },
        },
        [isFetchFailureEnabled, peopleOptions],
    );

    const emptySource = useOptionSource({
        fetch: async () => ({
            options: [],
            hasMore: false,
        }),
    });

    return (
        <div className="super-select-story__page" data-testid="story-ready">
            <ModeSelector mode={mode} setMode={setMode} />

            <section className="super-select-story__card">
                <label
                    htmlFor="error-toggle-fetch-fail"
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, width: "fit-content", cursor: "pointer" }}
                >
                    <input
                        id="error-toggle-fetch-fail"
                        data-testid="error-toggle-fetch-fail"
                        type="checkbox"
                        className="super-select__form-check-input"
                        checked={isFetchFailureEnabled}
                        onChange={(event) => setIsFetchFailureEnabled(event.target.checked)}
                    />
                    Simulate request failures
                </label>
            </section>

            <section className="super-select-story__card super-select-story__stack">
                <div className="super-select-story__form-row">
                    <label htmlFor="fetch-error-message-select">Request error with message</label>
                    <SuperSelect
                        id="fetch-error-message-select"
                        mode={mode}
                        name="fetchErrorMessageSelect"
                        optionSource={messageErrorSource}
                        customization={{ errorIndicator: { component: ErrorMetadataIndicator } }}
                    />
                </div>
                <div className="super-select-story__form-row">
                    <label htmlFor="fetch-error-no-message-select">Request error without message</label>
                    <SuperSelect
                        id="fetch-error-no-message-select"
                        mode={mode}
                        name="fetchErrorNoMessageSelect"
                        optionSource={noMessageErrorSource}
                    />
                </div>
                <div className="super-select-story__form-row">
                    <label htmlFor="label-error-with-message-select">Selected-value error with message</label>
                    <SuperSelect
                        id="label-error-with-message-select"
                        mode={mode}
                        name="labelErrorWithMessageSelect"
                        optionSource={labelResolutionWithMessageSource}
                        defaultValue="id-42"
                        customization={{ errorIndicator: { component: ErrorMetadataIndicator } }}
                    />
                </div>
                <div className="super-select-story__form-row">
                    <label htmlFor="label-error-no-message-select">Selected-value error without message</label>
                    <SuperSelect
                        id="label-error-no-message-select"
                        mode={mode}
                        multiple
                        name="labelErrorNoMessageSelect"
                        optionSource={labelResolutionNoMessageSource}
                        defaultValue={["id-42", "id-77"]}
                    />
                </div>
                <div className="super-select-story__form-row">
                    <label htmlFor="empty-state-select">Empty results</label>
                    <SuperSelect id="empty-state-select" mode={mode} name="emptyStateSelect" optionSource={emptySource} />
                </div>
            </section>
        </div>
    );
}

function ErrorMetadataIndicator({ error, message, ...props }: ErrorIndicatorProps) {
    return (
        <ErrorIndicator
            {...props}
            error={error}
            message={
                message ? (
                    <span data-testid="option-source-error-message" data-error-code={error?.code} data-http-status={error?.httpStatus}>
                        {message}
                    </span>
                ) : undefined
            }
        />
    );
}
