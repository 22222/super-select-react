import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useState } from "react";
import { type SuperSelectMode, useOptionSource } from "super-select-react";

import { MaterialSuperSelect } from "../components/MaterialSuperSelect";
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
        <div className="super-select-story__page" data-testid="story-ready">
            <ModeSelector mode={mode} setMode={setMode} />

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Single Select</h3>
                <div className="super-select-story__mt-8">
                    <MaterialSuperSelect mode={mode} name="materialSingleCustomization">
                        <option value="robert-balboa">Robert Balboa</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="apollo-creed">Apollo Creed</option>
                        <option value="james-lang">James Lang</option>
                        <option value="ivan-drago">Ivan Drago</option>
                    </MaterialSuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Multi Select</h3>
                <div className="super-select-story__mt-8">
                    <MaterialSuperSelect mode={mode} multiple name="materialMultiCustomization">
                        <option value="robert-balboa">Robert Balboa</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="apollo-creed">Apollo Creed</option>
                        <option value="james-lang">James Lang</option>
                        <option value="ivan-drago">Ivan Drago</option>
                    </MaterialSuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Grouped Options</h3>
                <div className="super-select-story__mt-8">
                    <MaterialSuperSelect mode={mode} name="materialGroupedCustomization">
                        <optgroup label="Group A">
                            <option value="robert-balboa">Robert Balboa</option>
                            <option value="adrian-pennino">Adrian Pennino</option>
                        </optgroup>
                        <optgroup label="Group B">
                            <option value="apollo-creed">Apollo Creed</option>
                            <option value="james-lang">James Lang</option>
                            <option value="ivan-drago">Ivan Drago</option>
                        </optgroup>
                    </MaterialSuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Loading State</h3>
                <div className="super-select-story__mt-8">
                    <MaterialSuperSelect
                        mode={mode}
                        name="materialLoadingCustomization"
                        optionSource={neverResolvingSource}
                        defaultValue="apollo-creed"
                    />
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Error State</h3>
                <div className="super-select-story__mt-8">
                    <MaterialSuperSelect
                        mode={mode}
                        name="materialErrorCustomization"
                        optionSource={errorSource}
                        defaultValue="unknown-person"
                    >
                        <option value="robert-balboa">Robert Balboa</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="apollo-creed">Apollo Creed</option>
                        <option value="james-lang">James Lang</option>
                        <option value="ivan-drago">Ivan Drago</option>
                    </MaterialSuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Toolkit Modal + Modal Select</h3>
                <div className="super-select-story__mt-8">
                    <Button variant="outlined" onClick={() => setIsOuterDialogOpen(true)}>
                        Open MUI Dialog
                    </Button>
                    <Dialog open={isOuterDialogOpen} onClose={() => setIsOuterDialogOpen(false)} fullWidth maxWidth="sm">
                        <DialogTitle>Choose an option</DialogTitle>
                        <DialogContent>
                            <MaterialSuperSelect mode="modal" name="materialNestedModalSelect">
                                <option value="robert-balboa">Robert Balboa</option>
                                <option value="adrian-pennino">Adrian Pennino</option>
                                <option value="apollo-creed">Apollo Creed</option>
                                <option value="james-lang">James Lang</option>
                                <option value="ivan-drago">Ivan Drago</option>
                            </MaterialSuperSelect>
                        </DialogContent>
                    </Dialog>
                </div>
            </section>
        </div>
    );
}
