import { useState } from "react";
import { type SuperSelectMode, useOptionSource } from "super-select-react";

import { Button } from "../components/shadcn-ui/Button";
import { cn } from "../components/shadcn-ui/cn";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/shadcn-ui/Dialog";
import styles from "../components/shadcn-ui/shadcn-super-select.module.css";
import { ShadcnSuperSelect } from "../components/shadcn-ui/ShadcnSuperSelect";
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
        <div className="super-select-story__page" data-testid="story-ready">
            <ModeSelector mode={mode} setMode={setMode} />

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Single Select</h3>
                <div className="super-select-story__mt-8">
                    <ShadcnSuperSelect mode={mode} name="shadcnSingleCustomization">
                        <option value="robert-balboa">Robert Balboa</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="apollo-creed">Apollo Creed</option>
                        <option value="james-lang">James Lang</option>
                        <option value="ivan-drago">Ivan Drago</option>
                    </ShadcnSuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Multi Select</h3>
                <div className="super-select-story__mt-8">
                    <ShadcnSuperSelect mode={mode} multiple name="shadcnMultiCustomization">
                        <option value="robert-balboa">Robert Balboa</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="apollo-creed">Apollo Creed</option>
                        <option value="james-lang">James Lang</option>
                        <option value="ivan-drago">Ivan Drago</option>
                    </ShadcnSuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Grouped Options</h3>
                <div className="super-select-story__mt-8">
                    <ShadcnSuperSelect mode={mode} name="shadcnGroupedCustomization">
                        <optgroup label="Group A">
                            <option value="robert-balboa">Robert Balboa</option>
                            <option value="adrian-pennino">Adrian Pennino</option>
                        </optgroup>
                        <optgroup label="Group B">
                            <option value="apollo-creed">Apollo Creed</option>
                            <option value="james-lang">James Lang</option>
                            <option value="ivan-drago">Ivan Drago</option>
                        </optgroup>
                    </ShadcnSuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Loading State</h3>
                <div className="super-select-story__mt-8">
                    <ShadcnSuperSelect
                        mode={mode}
                        name="shadcnLoadingCustomization"
                        optionSource={neverResolvingSource}
                        defaultValue="apollo-creed"
                    />
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Error State</h3>
                <div className="super-select-story__mt-8">
                    <ShadcnSuperSelect mode={mode} name="shadcnErrorCustomization" optionSource={errorSource} defaultValue="unknown-person">
                        <option value="robert-balboa">Robert Balboa</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="apollo-creed">Apollo Creed</option>
                        <option value="james-lang">James Lang</option>
                        <option value="ivan-drago">Ivan Drago</option>
                    </ShadcnSuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Toolkit Modal + Modal Select</h3>
                <div className="super-select-story__mt-8">
                    <Button type="button" onClick={() => setIsOuterModalOpen(true)}>
                        Open App Modal
                    </Button>
                    <Dialog open={isOuterModalOpen}>
                        <DialogContent onOpenChange={(nextOpen) => !nextOpen && setIsOuterModalOpen(false)}>
                            <DialogHeader className={styles.modalHeader}>
                                <DialogTitle>Choose an option</DialogTitle>
                            </DialogHeader>
                            <div className={cn("super-select-story__mt-8", styles.modalBody)}>
                                <ShadcnSuperSelect mode="modal" name="shadcnNestedModalSelect">
                                    <option value="robert-balboa">Robert Balboa</option>
                                    <option value="adrian-pennino">Adrian Pennino</option>
                                    <option value="apollo-creed">Apollo Creed</option>
                                    <option value="james-lang">James Lang</option>
                                    <option value="ivan-drago">Ivan Drago</option>
                                </ShadcnSuperSelect>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </section>
        </div>
    );
}
