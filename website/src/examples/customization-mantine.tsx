import { Button, MantineProvider, Modal } from "@mantine/core";
import { useState } from "react";
import { type SuperSelectMode, useOptionSource } from "super-select-react";

import { MantineSuperSelect } from "../components/MantineSuperSelect";
import { ModeSelector } from "./ModeSelector";

export default function Example() {
    const [mode, setMode] = useState<SuperSelectMode | undefined>(undefined);
    const [isOuterModalOpen, setIsOuterModalOpen] = useState(false);

    const neverResolvingSource = useOptionSource({
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
    });

    const errorSource = useOptionSource({
        fetch: async () => {
            throw new Error("Request failed");
        },
    });

    return (
        <MantineProvider>
            <div className="super-select-story__page" data-testid="story-ready">
                <ModeSelector mode={mode} setMode={setMode} />

                <section className="super-select-story__card">
                    <h3 className="super-select-story__card-title">Single Select</h3>
                    <div className="super-select-story__mt-8">
                        <MantineSuperSelect mode={mode} name="mantineSingleCustomization">
                            <option value="robert-balboa">Robert Balboa</option>
                            <option value="adrian-pennino">Adrian Pennino</option>
                            <option value="apollo-creed">Apollo Creed</option>
                            <option value="james-lang">James Lang</option>
                            <option value="ivan-drago">Ivan Drago</option>
                        </MantineSuperSelect>
                    </div>
                </section>

                <section className="super-select-story__card">
                    <h3 className="super-select-story__card-title">Multi Select</h3>
                    <div className="super-select-story__mt-8">
                        <MantineSuperSelect mode={mode} multiple name="mantineMultiCustomization">
                            <option value="robert-balboa">Robert Balboa</option>
                            <option value="adrian-pennino">Adrian Pennino</option>
                            <option value="apollo-creed">Apollo Creed</option>
                            <option value="james-lang">James Lang</option>
                            <option value="ivan-drago">Ivan Drago</option>
                        </MantineSuperSelect>
                    </div>
                </section>

                <section className="super-select-story__card">
                    <h3 className="super-select-story__card-title">Grouped Options</h3>
                    <div className="super-select-story__mt-8">
                        <MantineSuperSelect mode={mode} name="mantineGroupedCustomization">
                            <optgroup label="Group A">
                                <option value="robert-balboa">Robert Balboa</option>
                                <option value="adrian-pennino">Adrian Pennino</option>
                            </optgroup>
                            <optgroup label="Group B">
                                <option value="apollo-creed">Apollo Creed</option>
                                <option value="james-lang">James Lang</option>
                                <option value="ivan-drago">Ivan Drago</option>
                            </optgroup>
                        </MantineSuperSelect>
                    </div>
                </section>

                <section className="super-select-story__card">
                    <h3 className="super-select-story__card-title">Loading State</h3>
                    <div className="super-select-story__mt-8">
                        <MantineSuperSelect
                            mode={mode}
                            name="mantineLoadingCustomization"
                            optionSource={neverResolvingSource}
                            defaultValue="apollo-creed"
                        />
                    </div>
                </section>

                <section className="super-select-story__card">
                    <h3 className="super-select-story__card-title">Error State</h3>
                    <div className="super-select-story__mt-8">
                        <MantineSuperSelect
                            mode={mode}
                            name="mantineErrorCustomization"
                            optionSource={errorSource}
                            defaultValue="unknown-person"
                        >
                            <option value="robert-balboa">Robert Balboa</option>
                            <option value="adrian-pennino">Adrian Pennino</option>
                            <option value="apollo-creed">Apollo Creed</option>
                            <option value="james-lang">James Lang</option>
                            <option value="ivan-drago">Ivan Drago</option>
                        </MantineSuperSelect>
                    </div>
                </section>

                <section className="super-select-story__card">
                    <h3 className="super-select-story__card-title">Toolkit Modal + Modal Select</h3>
                    <div className="super-select-story__mt-8">
                        <Button onClick={() => setIsOuterModalOpen(true)}>Open Mantine Modal</Button>
                        <Modal opened={isOuterModalOpen} onClose={() => setIsOuterModalOpen(false)} title="Choose an option" centered>
                            <MantineSuperSelect mode="modal" name="mantineNestedModalSelect">
                                <option value="robert-balboa">Robert Balboa</option>
                                <option value="adrian-pennino">Adrian Pennino</option>
                                <option value="apollo-creed">Apollo Creed</option>
                                <option value="james-lang">James Lang</option>
                                <option value="ivan-drago">Ivan Drago</option>
                            </MantineSuperSelect>
                        </Modal>
                    </div>
                </section>
            </div>
        </MantineProvider>
    );
}
