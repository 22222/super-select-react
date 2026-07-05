import { useState } from "react";
import { SuperSelect, type SuperSelectMode, useOptionSource } from "super-select-react";

import { ModeSelector } from "./ModeSelector";

export default function Example() {
    const [mode, setMode] = useState<SuperSelectMode | undefined>(undefined);
    const [singleValue, setSingleValue] = useState("apollo-creed");
    const [multiValue, setMultiValue] = useState<string[]>(["austin", "boston"]);
    const [submission, setSubmission] = useState("");

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
                <h3 className="super-select-story__card-title">AJAX-Style Controlled Submit</h3>
                <form
                    className="super-select-story__stack super-select-story__mt-8"
                    onSubmit={(event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        setSubmission(
                            JSON.stringify({
                                person: String(formData.get("person") ?? ""),
                                favoriteCities: formData.getAll("favoriteCities").map(String),
                            }),
                        );
                    }}
                >
                    <SuperSelect
                        mode={mode}
                        name="person"
                        value={singleValue}
                        onChange={(event) => setSingleValue(String(event.target.value ?? ""))}
                    >
                        <option value="robert-balboa">Robert Balboa</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="apollo-creed">Apollo Creed</option>
                    </SuperSelect>

                    <SuperSelect
                        mode={mode}
                        name="favoriteCities"
                        multiple
                        optionSource={citySource}
                        value={multiValue}
                        onChange={(event) => {
                            const next = Array.from(event.currentTarget.selectedOptions)
                                .map((option) => option?.value ?? "")
                                .filter((entry) => entry.length > 0);
                            setMultiValue(next);
                        }}
                    />

                    <button type="submit">Submit</button>
                </form>
                <p className="super-select-story__mb-8">{submission}</p>
            </section>
        </div>
    );
}
