import { useMemo, useState } from "react";
import { createOptionSource, type SuperSelectMode } from "super-select-react";

import { BootstrapSuperSelect } from "../components/BootstrapSuperSelect";
import { ModeSelector } from "./ModeSelector";

export default function Example() {
    const [mode, setMode] = useState<SuperSelectMode | undefined>(undefined);
    const [isOuterModalOpen, setIsOuterModalOpen] = useState(false);

    const neverResolvingSource = useMemo(
        () =>
            createOptionSource({
                fetch: ({ signal }) =>
                    new Promise((_, reject) => {
                        signal?.addEventListener(
                            "abort",
                            () => {
                                reject(new DOMException("The operation was aborted.", "AbortError"));
                            },
                            { once: true },
                        );
                    }),
            }),
        [],
    );

    const errorSource = useMemo(
        () =>
            createOptionSource({
                fetch: async () => {
                    throw new Error("Request failed");
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
                    <BootstrapSuperSelect mode={mode} name="bootstrapSingleCustomization">
                        <option value="robert-balboa">Robert Balboa</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="apollo-creed">Apollo Creed</option>
                        <option value="james-lang">James Lang</option>
                        <option value="ivan-drago">Ivan Drago</option>
                    </BootstrapSuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Multi Select</h3>
                <div className="super-select-story__mt-8">
                    <BootstrapSuperSelect mode={mode} multiple name="bootstrapMultiCustomization">
                        <option value="robert-balboa">Robert Balboa</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="apollo-creed">Apollo Creed</option>
                        <option value="james-lang">James Lang</option>
                        <option value="ivan-drago">Ivan Drago</option>
                    </BootstrapSuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Grouped Options</h3>
                <div className="super-select-story__mt-8">
                    <BootstrapSuperSelect mode={mode} name="bootstrapGroupedCustomization">
                        <optgroup label="Group A">
                            <option value="robert-balboa">Robert Balboa</option>
                            <option value="adrian-pennino">Adrian Pennino</option>
                        </optgroup>
                        <optgroup label="Group B">
                            <option value="apollo-creed">Apollo Creed</option>
                            <option value="james-lang">James Lang</option>
                            <option value="ivan-drago">Ivan Drago</option>
                        </optgroup>
                    </BootstrapSuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Loading State</h3>
                <div className="super-select-story__mt-8">
                    <BootstrapSuperSelect
                        mode={mode}
                        name="bootstrapLoadingCustomization"
                        optionSource={neverResolvingSource}
                        defaultValue="apollo-creed"
                    />
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Error State</h3>
                <div className="super-select-story__mt-8">
                    <BootstrapSuperSelect
                        mode={mode}
                        name="bootstrapErrorCustomization"
                        optionSource={errorSource}
                        defaultValue="unknown-person"
                    >
                        <option value="robert-balboa">Robert Balboa</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="apollo-creed">Apollo Creed</option>
                        <option value="james-lang">James Lang</option>
                        <option value="ivan-drago">Ivan Drago</option>
                    </BootstrapSuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Toolkit Modal + Modal Select</h3>
                <div className="super-select-story__mt-8">
                    <button type="button" className="btn btn-outline-primary" onClick={() => setIsOuterModalOpen(true)}>
                        Open Bootstrap Modal
                    </button>
                    {isOuterModalOpen ? (
                        <>
                            <div
                                className="modal fade show d-block"
                                tabIndex={-1}
                                role="dialog"
                                aria-modal="true"
                                onClick={(event) => {
                                    if (event.target === event.currentTarget) {
                                        setIsOuterModalOpen(false);
                                    }
                                }}
                            >
                                <div className="modal-dialog">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Choose an option</h5>
                                            <button
                                                type="button"
                                                className="btn-close"
                                                aria-label="Close"
                                                onClick={() => setIsOuterModalOpen(false)}
                                            />
                                        </div>
                                        <div className="modal-body">
                                            <BootstrapSuperSelect mode="modal" name="bootstrapNestedModalSelect">
                                                <option value="robert-balboa">Robert Balboa</option>
                                                <option value="adrian-pennino">Adrian Pennino</option>
                                                <option value="apollo-creed">Apollo Creed</option>
                                                <option value="james-lang">James Lang</option>
                                                <option value="ivan-drago">Ivan Drago</option>
                                            </BootstrapSuperSelect>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-backdrop fade show" />
                        </>
                    ) : null}
                </div>
            </section>
        </div>
    );
}
