import { useState } from "react";
import { SuperSelect, type SuperSelectMode, useOptionSource } from "super-select-react";

import { ModeSelector } from "./ModeSelector";

export default function Example() {
    const [mode, setMode] = useState<SuperSelectMode | undefined>(undefined);
    const [submittedValues, setSubmittedValues] = useState("");

    const citySource = useOptionSource({
        fetch: async ({ offset = 0, limit = 5 }) => {
            const options = [
                { value: "austin", label: "Austin" },
                { value: "boston", label: "Boston" },
                { value: "chicago", label: "Chicago" },
                { value: "dallas", label: "Dallas" },
                { value: "houston", label: "Houston" },
                { value: "seattle", label: "Seattle" },
            ];
            return {
                options: options.slice(offset, offset + limit),
                hasMore: offset + limit < options.length,
            };
        },
    });

    return (
        <div className="super-select-story__page" data-testid="story-ready">
            <ModeSelector mode={mode} setMode={setMode} />

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">POST Form</h3>
                <p className="super-select-story__mb-8">This uses native form submission (`method="post"`).</p>
                <form
                    method="post"
                    action=""
                    target="super-select-story__form-post-target"
                    className="super-select-story__stack"
                    onSubmit={(event) => {
                        const formData = new FormData(event.currentTarget);
                        setSubmittedValues(Array.from(formData, ([name, value]) => `${name}=${String(value)}`).join("&"));
                    }}
                >
                    <SuperSelect mode={mode} name="person" required defaultValue="apollo-creed">
                        <option value="robert-balboa">Robert Balboa</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="apollo-creed">Apollo Creed</option>
                    </SuperSelect>

                    <SuperSelect mode={mode} name="favoriteCities" multiple optionSource={citySource} />

                    <button type="submit">Submit</button>
                </form>
                {submittedValues && (
                    <p className="super-select-story__mt-8" data-testid="uncontrolled-form-submission">
                        Submitted: {submittedValues}
                    </p>
                )}
                <iframe
                    name="super-select-story__form-post-target"
                    title="super-select-story__form-post-target"
                    className="super-select-story__hidden-frame"
                />
            </section>
        </div>
    );
}
