import { useEffect, useMemo, useState } from "react";
import {
    createOptionSource,
    type EmptyIndicatorProps,
    type PendingIndicatorProps,
    SuperSelect,
    type SuperSelectMode,
} from "super-select-react";

import { ModeSelector } from "./ModeSelector";

export default function Example() {
    const [mode, setMode] = useState<SuperSelectMode | undefined>(undefined);
    const [singleValue, setSingleValue] = useState("");
    const [multiValue, setMultiValue] = useState<string[]>([]);
    const [initialMountReloadKey, setInitialMountReloadKey] = useState(0);

    const citySource = useMemo(
        () =>
            createOptionSource({
                fetch: async ({ values, search = "", offset = 0, limit = 8, signal }) => {
                    await new Promise((resolve, reject) => {
                        const timer = window.setTimeout(resolve, 350);
                        signal?.addEventListener(
                            "abort",
                            () => {
                                window.clearTimeout(timer);
                                reject(new DOMException("The operation was aborted.", "AbortError"));
                            },
                            { once: true },
                        );
                    });

                    const allOptions = [
                        { value: "austin", label: "Austin" },
                        { value: "boston", label: "Boston" },
                        { value: "chicago", label: "Chicago" },
                        { value: "dallas", label: "Dallas" },
                        { value: "denver", label: "Denver" },
                        { value: "el-paso", label: "El Paso" },
                        { value: "houston", label: "Houston" },
                        { value: "las-vegas", label: "Las Vegas" },
                        { value: "los-angeles", label: "Los Angeles" },
                        { value: "new-york", label: "New York" },
                        { value: "san-antonio", label: "San Antonio" },
                        { value: "san-diego", label: "San Diego" },
                        { value: "san-francisco", label: "San Francisco" },
                        { value: "san-jose", label: "San Jose" },
                        { value: "seattle", label: "Seattle" },
                        { value: "tampa", label: "Tampa" },
                    ];

                    if (values && values.length > 0) {
                        const requested = new Set(values);
                        return {
                            options: allOptions.filter((option) => requested.has(option.value)),
                            hasMore: false,
                        };
                    }

                    const normalizedSearch = search.trim().toLowerCase();
                    const filtered = allOptions.filter((option) => option.label.toLowerCase().includes(normalizedSearch));
                    return {
                        options: filtered.slice(offset, offset + limit),
                        hasMore: offset + limit < filtered.length,
                    };
                },
            }),
        [],
    );

    const neverSource = useMemo(
        () =>
            createOptionSource({
                fetch: ({ signal }) =>
                    new Promise((_, reject) => {
                        signal?.addEventListener("abort", () => reject(new DOMException("The operation was aborted.", "AbortError")), {
                            once: true,
                        });
                    }),
            }),
        [],
    );

    const limitedPaginationSource = useMemo(
        () =>
            createOptionSource({
                fetch: async ({ values, search = "", offset = 0, limit = 4, signal }) => {
                    await new Promise((resolve, reject) => {
                        const timer = window.setTimeout(resolve, 350);
                        signal?.addEventListener(
                            "abort",
                            () => {
                                window.clearTimeout(timer);
                                reject(new DOMException("The operation was aborted.", "AbortError"));
                            },
                            { once: true },
                        );
                    });

                    const allOptions = [
                        { value: "austin", label: "Austin" },
                        { value: "boston", label: "Boston" },
                        { value: "chicago", label: "Chicago" },
                        { value: "dallas", label: "Dallas" },
                        { value: "denver", label: "Denver" },
                        { value: "el-paso", label: "El Paso" },
                        { value: "houston", label: "Houston" },
                        { value: "las-vegas", label: "Las Vegas" },
                        { value: "los-angeles", label: "Los Angeles" },
                        { value: "new-york", label: "New York" },
                        { value: "san-antonio", label: "San Antonio" },
                        { value: "san-diego", label: "San Diego" },
                        { value: "san-francisco", label: "San Francisco" },
                        { value: "san-jose", label: "San Jose" },
                        { value: "seattle", label: "Seattle" },
                        { value: "tampa", label: "Tampa" },
                    ];

                    if (values && values.length > 0) {
                        const requested = new Set(values);
                        return {
                            options: allOptions.filter((option) => requested.has(option.value)),
                            hasMore: false,
                        };
                    }

                    const normalizedSearch = search.trim().toLowerCase();
                    const filtered = allOptions.filter((option) => option.label.toLowerCase().includes(normalizedSearch));
                    return {
                        options: filtered.slice(offset, offset + limit),
                        hasMore: offset + limit < filtered.length,
                    };
                },
            }),
        [],
    );

    return (
        <div className="super-select-story__page" data-testid="story-ready">
            <ModeSelector mode={mode} setMode={setMode} />
            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Single Select</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect
                        mode={mode}
                        name="asyncCity"
                        optionSource={citySource}
                        customization={{
                            pendingIndicator: {
                                component: AsyncCityPendingIndicator,
                            },
                            emptyIndicator: {
                                content: <span data-testid="async-city-empty-marker">No options available.</span>,
                            },
                        }}
                        onValueChange={setSingleValue}
                    />
                </div>
                <small>{singleValue ? `Selected: ${singleValue}` : ""}</small>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Multi Select</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect mode={mode} multiple name="asyncCities" optionSource={citySource} onValueChange={setMultiValue} />
                </div>
                <small>{multiValue.length > 0 ? `Selected: ${multiValue.join(",")}` : ""}</small>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Never Resolves</h3>
                <div className="super-select-story__stack super-select-story__mt-8">
                    <SuperSelect mode={mode} name="asyncNeverResolvesSingle" optionSource={neverSource} defaultValue="san-francisco" />
                    <SuperSelect
                        mode={mode}
                        multiple
                        name="asyncNeverResolvesMulti"
                        optionSource={neverSource}
                        defaultValue={["san-francisco", "new-york"]}
                    />
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Limited Pagination</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect mode={mode} name="asyncLimitedPagination" optionSource={limitedPaginationSource} />
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Starts in Pending State</h3>
                <div key={initialMountReloadKey} className="super-select-story__stack super-select-story__mt-8">
                    <InitialMountOptionSourceSelect mode="modal" name="initialMountModalValues" />
                    <InitialMountOptionSourceSelect mode="option-list" name="initialMountOptionListValues" />
                    <InitialMountOptionSourceSelect mode="toggle-button" name="initialMountToggleButtonValues" />
                </div>
                <div className="super-select-story__mt-8">
                    <button
                        type="button"
                        className="super-select__btn super-select__btn-secondary"
                        title="Reload examples"
                        onClick={() => setInitialMountReloadKey((key) => key + 1)}
                    >
                        ↻
                    </button>
                </div>
            </section>
        </div>
    );
}

function AsyncCityPendingIndicator(props: PendingIndicatorProps) {
    useEffect(() => {
        (window as Window & { __asyncCityLoadingIndicatorRendered?: boolean }).__asyncCityLoadingIndicatorRendered = true;
    }, []);

    return (
        <span className={props.className} style={props.style} role="status" title={props.title}>
            <span data-testid="async-city-pending-marker">Loading options.</span>
        </span>
    );
}

function InitialMountOptionSourceSelect({ mode, name }: { mode: SuperSelectMode; name: string }) {
    const optionSource = createOptionSource(async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 150));
        return {
            options: [
                { value: "archived", label: "Archived" },
                { value: "breakfast", label: "Breakfast" },
            ],
            hasMore: false,
        };
    });

    return (
        <SuperSelect
            mode={mode}
            name={name}
            optionSource={optionSource}
            customization={{
                pendingIndicator: {
                    component: (props) => <InitialMountPendingIndicator {...props} mode={mode} />,
                },
                emptyIndicator: {
                    component: (props) => <InitialMountEmptyIndicator {...props} mode={mode} />,
                },
            }}
        />
    );
}

function InitialMountPendingIndicator({ mode, ...props }: PendingIndicatorProps & { mode: SuperSelectMode }) {
    if (typeof window !== "undefined") {
        const testWindow = window as Window & { __initialMountPendingModes?: string[] };
        testWindow.__initialMountPendingModes = [...(testWindow.__initialMountPendingModes ?? []), mode];
    }

    return (
        <span className={props.className} style={props.style} role="status" title={props.title}>
            <span data-testid="initial-mount-pending-marker">Loading options.</span>
        </span>
    );
}

function InitialMountEmptyIndicator({ mode, ...props }: EmptyIndicatorProps & { mode: SuperSelectMode }) {
    if (typeof window !== "undefined") {
        const testWindow = window as Window & { __initialMountEmptyModes?: string[] };
        testWindow.__initialMountEmptyModes = [...(testWindow.__initialMountEmptyModes ?? []), mode];
    }

    return (
        <span className={props.className} style={props.style}>
            <span data-testid="initial-mount-empty-marker">No results.</span>
        </span>
    );
}
