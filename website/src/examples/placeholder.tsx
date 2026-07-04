import { useState } from "react";
import { SuperSelect, type SuperSelectMode } from "super-select-react";

import { ModeSelector } from "./ModeSelector";

export default function PlaceholderExample() {
    const [mode, setMode] = useState<SuperSelectMode | undefined>(undefined);

    return (
        <div className="super-select-story__page" data-testid="story-ready">
            <ModeSelector mode={mode} setMode={setMode} />

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Single Select Placeholder</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect mode={mode} name="placeholderSingle" defaultValue="" required>
                        <option value="" disabled hidden>
                            Select an option
                        </option>
                        <option value="apollo-creed">Apollo Creed</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="robert-balboa">Robert Balboa</option>
                    </SuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Multi Select Placeholder</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect mode={mode} name="placeholderMultiple" multiple defaultValue={[]}>
                        <option value="" disabled hidden>
                            Select one or more options
                        </option>
                        <option value="apollo-creed">Apollo Creed</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="robert-balboa">Robert Balboa</option>
                    </SuperSelect>
                </div>
            </section>
        </div>
    );
}
