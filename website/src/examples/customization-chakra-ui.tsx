import { Button, ChakraProvider, defaultSystem, Dialog } from "@chakra-ui/react";
import { useState } from "react";
import { type SuperSelectMode, useOptionSource } from "super-select-react";

import { ChakraSuperSelect } from "../components/ChakraSuperSelect";
import { ModeSelector } from "./ModeSelector";

export default function Example() {
    const [mode, setMode] = useState<SuperSelectMode | undefined>(undefined);
    const [isOuterDialogOpen, setIsOuterDialogOpen] = useState(false);

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
        <ChakraProvider value={defaultSystem}>
            <div className="super-select-story__page" data-testid="story-ready">
                <ModeSelector mode={mode} setMode={setMode} />

                <section className="super-select-story__card">
                    <h3 className="super-select-story__card-title">Single Select</h3>
                    <div className="super-select-story__mt-8">
                        <ChakraSuperSelect mode={mode} name="chakraSingleCustomization">
                            <option value="robert-balboa">Robert Balboa</option>
                            <option value="adrian-pennino">Adrian Pennino</option>
                            <option value="apollo-creed">Apollo Creed</option>
                            <option value="james-lang">James Lang</option>
                            <option value="ivan-drago">Ivan Drago</option>
                        </ChakraSuperSelect>
                    </div>
                </section>

                <section className="super-select-story__card">
                    <h3 className="super-select-story__card-title">Multi Select</h3>
                    <div className="super-select-story__mt-8">
                        <ChakraSuperSelect mode={mode} multiple name="chakraMultiCustomization">
                            <option value="robert-balboa">Robert Balboa</option>
                            <option value="adrian-pennino">Adrian Pennino</option>
                            <option value="apollo-creed">Apollo Creed</option>
                            <option value="james-lang">James Lang</option>
                            <option value="ivan-drago">Ivan Drago</option>
                        </ChakraSuperSelect>
                    </div>
                </section>

                <section className="super-select-story__card">
                    <h3 className="super-select-story__card-title">Grouped Options</h3>
                    <div className="super-select-story__mt-8">
                        <ChakraSuperSelect mode={mode} name="chakraGroupedCustomization">
                            <optgroup label="Group A">
                                <option value="robert-balboa">Robert Balboa</option>
                                <option value="adrian-pennino">Adrian Pennino</option>
                            </optgroup>
                            <optgroup label="Group B">
                                <option value="apollo-creed">Apollo Creed</option>
                                <option value="james-lang">James Lang</option>
                                <option value="ivan-drago">Ivan Drago</option>
                            </optgroup>
                        </ChakraSuperSelect>
                    </div>
                </section>

                <section className="super-select-story__card">
                    <h3 className="super-select-story__card-title">Loading State</h3>
                    <div className="super-select-story__mt-8">
                        <ChakraSuperSelect
                            mode={mode}
                            name="chakraLoadingCustomization"
                            optionSource={neverResolvingSource}
                            defaultValue="apollo-creed"
                        />
                    </div>
                </section>

                <section className="super-select-story__card">
                    <h3 className="super-select-story__card-title">Error State</h3>
                    <div className="super-select-story__mt-8">
                        <ChakraSuperSelect
                            mode={mode}
                            name="chakraErrorCustomization"
                            optionSource={errorSource}
                            defaultValue="unknown-person"
                        >
                            <option value="robert-balboa">Robert Balboa</option>
                            <option value="adrian-pennino">Adrian Pennino</option>
                            <option value="apollo-creed">Apollo Creed</option>
                            <option value="james-lang">James Lang</option>
                            <option value="ivan-drago">Ivan Drago</option>
                        </ChakraSuperSelect>
                    </div>
                </section>

                <section className="super-select-story__card">
                    <h3 className="super-select-story__card-title">Toolkit Modal + Modal Select</h3>
                    <div className="super-select-story__mt-8">
                        <Dialog.Root open={isOuterDialogOpen} onOpenChange={(details) => setIsOuterDialogOpen(details.open)}>
                            <Dialog.Trigger asChild>
                                <Button variant="outline">Open Chakra Dialog</Button>
                            </Dialog.Trigger>
                            <Dialog.Backdrop />
                            <Dialog.Positioner>
                                <Dialog.Content>
                                    <Dialog.Header>
                                        <Dialog.Title>Choose an option</Dialog.Title>
                                    </Dialog.Header>
                                    <Dialog.Body>
                                        <ChakraSuperSelect mode="modal" name="chakraNestedModalSelect">
                                            <option value="robert-balboa">Robert Balboa</option>
                                            <option value="adrian-pennino">Adrian Pennino</option>
                                            <option value="apollo-creed">Apollo Creed</option>
                                            <option value="james-lang">James Lang</option>
                                            <option value="ivan-drago">Ivan Drago</option>
                                        </ChakraSuperSelect>
                                    </Dialog.Body>
                                    <Dialog.CloseTrigger />
                                </Dialog.Content>
                            </Dialog.Positioner>
                        </Dialog.Root>
                    </div>
                </section>
            </div>
        </ChakraProvider>
    );
}
