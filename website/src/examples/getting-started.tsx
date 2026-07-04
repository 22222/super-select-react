import { useMemo, useState } from "react";
import { createOptionSource, SuperSelect, type SuperSelectMode } from "super-select-react";

import { ModeSelector } from "./ModeSelector";

export default function Example() {
    const [mode, setMode] = useState<SuperSelectMode | undefined>(undefined);

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
                    <SuperSelect mode={mode} name="person">
                        <option value="robert-balboa">Robert Balboa</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="apollo-creed">Apollo Creed</option>
                        <option value="james-lang">James Lang</option>
                        <option value="ivan-drago">Ivan Drago</option>
                        <option value="paolo-pennino">Paolo Pennino</option>
                    </SuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Multi Select</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect mode={mode} multiple name="people">
                        <option value="robert-balboa">Robert Balboa</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="apollo-creed">Apollo Creed</option>
                        <option value="james-lang">James Lang</option>
                        <option value="ivan-drago">Ivan Drago</option>
                        <option value="paolo-pennino">Paolo Pennino</option>
                    </SuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Grouped Single Select</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect mode={mode} name="groupedPeople">
                        <optgroup label="Operations">
                            <option value="apollo-creed">Apollo Creed</option>
                            <option value="james-lang">James Lang</option>
                            <option value="ivan-drago">Ivan Drago</option>
                        </optgroup>
                        <optgroup label="Training">
                            <option value="michael-goldmill">Michael Goldmill</option>
                            <option value="tony-evers">Tony Evers</option>
                            <option value="duke-evers">Duke Evers</option>
                        </optgroup>
                        <optgroup label="Personal">
                            <option value="adrian-pennino">Adrian Pennino</option>
                            <option value="paolo-pennino">Paolo Pennino</option>
                            <option value="robert-balboa">Robert Balboa</option>
                        </optgroup>
                    </SuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Grouped Multi Select</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect mode={mode} multiple name="groupedPeopleMulti">
                        <optgroup label="Operations">
                            <option value="apollo-creed">Apollo Creed</option>
                            <option value="james-lang">James Lang</option>
                            <option value="ivan-drago">Ivan Drago</option>
                        </optgroup>
                        <optgroup label="Training">
                            <option value="michael-goldmill">Michael Goldmill</option>
                            <option value="tony-evers">Tony Evers</option>
                            <option value="duke-evers">Duke Evers</option>
                        </optgroup>
                        <optgroup label="Personal">
                            <option value="adrian-pennino">Adrian Pennino</option>
                            <option value="paolo-pennino">Paolo Pennino</option>
                            <option value="robert-balboa">Robert Balboa</option>
                        </optgroup>
                    </SuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Rich Option Content</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect mode={mode} name="richOptionContent">
                        <option value="austin" label="Austin">
                            <span>
                                <strong>Austin</strong> Texas
                            </span>
                        </option>
                        <option value="chicago" label="Chicago">
                            <span>
                                <strong>Chicago</strong> Illinois
                            </span>
                        </option>
                        <option value="seattle" label="Seattle">
                            <span>
                                <strong>Seattle</strong> Washington
                            </span>
                        </option>
                    </SuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Loading State</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect mode={mode} name="personLoading" optionSource={neverResolvingSource} defaultValue="apollo-creed" />
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Error State</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect mode={mode} name="personError" optionSource={errorSource} defaultValue="unknown-person">
                        <option value="robert-balboa">Robert Balboa</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="apollo-creed">Apollo Creed</option>
                        <option value="james-lang">James Lang</option>
                        <option value="ivan-drago">Ivan Drago</option>
                        <option value="paolo-pennino">Paolo Pennino</option>
                    </SuperSelect>
                </div>
            </section>
        </div>
    );
}
