import { useMemo, useState } from "react";
import { createOptionSource, SuperSelect, type SuperSelectMode } from "super-select-react";

import { ModeSelector } from "./ModeSelector";

export default function AsyncFirstPageFallbackExample() {
    const [mode, setMode] = useState<SuperSelectMode | undefined>(undefined);

    const combinedSource = useMemo(
        () =>
            createOptionSource({
                fetch: async ({ values, signal }) => {
                    await new Promise((resolve, reject) => {
                        const timer = window.setTimeout(resolve, 200);
                        signal?.addEventListener(
                            "abort",
                            () => {
                                window.clearTimeout(timer);
                                reject(new DOMException("The operation was aborted.", "AbortError"));
                            },
                            { once: true },
                        );
                    });

                    const remoteOptions = [
                        { value: "robert-balboa", label: "Robert Balboa Remote" },
                        { value: "adrian-pennino", label: "Adrian Pennino Remote" },
                        { value: "apollo-creed", label: "Apollo Creed Remote" },
                    ];

                    if (values && values.length > 0) {
                        const requestedValues = new Set(values);
                        return {
                            options: remoteOptions.filter((option) => requestedValues.has(option.value)),
                            hasMore: false,
                        };
                    }

                    return {
                        options: remoteOptions,
                        hasMore: false,
                    };
                },
            }),
        [],
    );

    const combinedOptionsOnlySource = useMemo(
        () =>
            createOptionSource({
                fetch: async ({ values, search = "", signal }) => {
                    await new Promise((resolve, reject) => {
                        const timer = window.setTimeout(resolve, 200);
                        signal?.addEventListener(
                            "abort",
                            () => {
                                window.clearTimeout(timer);
                                reject(new DOMException("The operation was aborted.", "AbortError"));
                            },
                            { once: true },
                        );
                    });

                    const remoteOptions = [
                        { value: "robert-balboa", label: "Robert Balboa Remote" },
                        { value: "apollo-creed", label: "Apollo Creed Remote" },
                    ];

                    if (values && values.length > 0) {
                        const requestedValues = new Set(values);
                        return {
                            options: remoteOptions.filter((option) => requestedValues.has(option.value)),
                            hasMore: false,
                        };
                    }

                    const normalizedSearch = search.trim().toLowerCase();
                    return {
                        options: remoteOptions.filter((option) => option.label.toLowerCase().includes(normalizedSearch)),
                        hasMore: false,
                    };
                },
            }),
        [],
    );

    return (
        <div className="super-select-story__page" data-testid="story-ready">
            <ModeSelector mode={mode} setMode={setMode} />

            <section data-testid="super-async-native" className="super-select-story__card">
                <h3 className="super-select-story__card-title">Native Async</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect mode="native" name="superAsyncNative" optionSource={combinedSource}>
                        <option value="robert-balboa">Robert Balboa Local</option>
                    </SuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Toggle Async</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect mode="toggle-button" name="superAsyncToggle" optionSource={combinedSource} />
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Combined Sources</h3>
                <div className="super-select-story__stack super-select-story__mt-8">
                    <SuperSelect mode={mode} name="combinedSourcesOptionsOnly" optionSource={combinedOptionsOnlySource}>
                        <option value="robert-balboa">Robert Balboa Local</option>
                        <option value="adrian-pennino">Adrian Pennino Local</option>
                    </SuperSelect>

                    <SuperSelect mode={mode} name="combinedSourcesCustomMatcher">
                        <option value="red">Red</option>
                        <option value="blue">Blue</option>
                        <option value="green">Green</option>
                    </SuperSelect>
                </div>
            </section>
        </div>
    );
}
