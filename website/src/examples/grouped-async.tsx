import { useState } from "react";
import { SuperSelect, type SuperSelectMode, useOptionSource } from "super-select-react";

import { ModeSelector } from "./ModeSelector";

const peopleByGroup = [
    {
        label: "Operations",
        options: [
            { value: "apollo-creed", label: "Apollo Creed" },
            { value: "james-lang", label: "James Lang" },
        ],
    },
    {
        label: "Training",
        options: [
            { value: "michael-goldmill", label: "Michael Goldmill" },
            { value: "tony-evers", label: "Tony Evers" },
        ],
    },
    {
        label: "Personal",
        options: [
            { value: "adrian-pennino", label: "Adrian Pennino" },
            { value: "robert-balboa", label: "Robert Balboa" },
        ],
    },
];

export default function Example() {
    const [mode, setMode] = useState<SuperSelectMode | undefined>(undefined);
    const source = useOptionSource(async ({ values, search = "", offset = 0, limit = 100 }) => {
        const normalizedSearch = search.trim().toLowerCase();
        const matchingOptions = peopleByGroup
            .flatMap((group) => group.options.map((option) => ({ ...option, groupLabel: group.label })))
            .filter((option) => (values ? values.includes(option.value) : option.label.toLowerCase().includes(normalizedSearch)));

        return {
            options: matchingOptions.slice(offset, offset + limit),
            hasMore: offset + limit < matchingOptions.length,
        };
    });

    return (
        <div className="super-select-story__page" data-testid="story-ready">
            <ModeSelector mode={mode} setMode={setMode} />
            <SuperSelect mode={mode} name="groupedPeopleAsync" optionSource={source} />
        </div>
    );
}
