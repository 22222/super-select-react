import { useState } from "react";
import { SuperSelect, type SuperSelectMode, useOptionSource } from "super-select-react";

import { ModeSelector } from "./ModeSelector";

export default function SearchVisibilityExample() {
    const [mode, setMode] = useState<SuperSelectMode | undefined>(undefined);

    const singlePageSource = useOptionSource({
        fetch: async () => ({
            options: [
                { value: "robert-balboa", label: "Robert Balboa" },
                { value: "adrian-pennino", label: "Adrian Pennino" },
                { value: "apollo-creed", label: "Apollo Creed" },
            ],
            hasMore: false,
        }),
    });

    const paginatedSource = useOptionSource({
        fetch: async ({ offset = 0, limit = 5 }) => {
            const options = [
                { value: "austin", label: "Austin" },
                { value: "boston", label: "Boston" },
                { value: "chicago", label: "Chicago" },
                { value: "dallas", label: "Dallas" },
                { value: "denver", label: "Denver" },
                { value: "el-paso", label: "El Paso" },
                { value: "houston", label: "Houston" },
                { value: "san-antonio", label: "San Antonio" },
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

            <section className="super-select-story__card super-select-story__stack">
                <SuperSelect mode={mode} name="visibilityLocalDefault">
                    <option value="robert-balboa">Robert Balboa</option>
                    <option value="adrian-pennino">Adrian Pennino</option>
                    <option value="apollo-creed">Apollo Creed</option>
                </SuperSelect>

                <SuperSelect mode={mode} name="visibilitySinglePageSource" optionSource={singlePageSource} />

                <SuperSelect mode={mode} name="visibilityForced">
                    <option value="robert-balboa">Robert Balboa</option>
                    <option value="adrian-pennino">Adrian Pennino</option>
                    <option value="apollo-creed">Apollo Creed</option>
                </SuperSelect>

                <SuperSelect mode={mode} name="visibilityPaginatedSource" optionSource={paginatedSource} />
            </section>
        </div>
    );
}
