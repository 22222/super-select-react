import { useState } from "react";
import { SuperSelect, type SuperSelectMode, useOptionSource } from "super-select-react";

import { ModeSelector } from "./ModeSelector";

const PEOPLE = [
    { value: "robert-balboa", label: "Robert Balboa" },
    { value: "adrian-pennino", label: "Adrian Pennino" },
    { value: "apollo-creed", label: "Apollo Creed" },
    { value: "james-lang", label: "James Lang" },
    { value: "ivan-drago", label: "Ivan Drago" },
    { value: "paolo-pennino", label: "Paolo Pennino" },
    { value: "talia-shire", label: "Talia Shire" },
    { value: "mary-anne-creed", label: "Mary Anne Creed" },
    { value: "ludmilla-vobet-drago", label: "Ludmilla Vobet Drago" },
    { value: "tommy-gunn", label: "Tommy Gunn" },
    { value: "mason-dixon", label: "Mason Dixon" },
    { value: "little-marie", label: "Little Marie" },
];

export default function Example() {
    const [mode, setMode] = useState<SuperSelectMode | undefined>(undefined);

    const pagedPeopleSource = useOptionSource({
        fetch: async ({ search = "", offset = 0, limit = 3 }) => {
            const normalizedSearch = search.trim().toLowerCase();
            const filteredOptions = normalizedSearch
                ? PEOPLE.filter((option) => option.label.toLowerCase().includes(normalizedSearch))
                : PEOPLE;
            const pageOptions = filteredOptions.slice(offset, offset + limit);
            return {
                options: pageOptions,
                hasMore: offset + pageOptions.length < filteredOptions.length,
            };
        },
    });

    const loadingSource = useOptionSource({
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
                <h3 className="super-select-story__card-title">Text And Labels</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect mode={mode} name="basicCustomizationLocal" customization={BASIC_TEXT_CUSTOMIZATION}>
                        {PEOPLE.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </SuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Search, Empty, And Pagination Copy</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect
                        mode={mode}
                        name="basicCustomizationRemote"
                        optionSource={pagedPeopleSource}
                        customization={BASIC_TEXT_CUSTOMIZATION}
                    />
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Always Empty</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect mode={mode} name="basicCustomizationAlwaysEmpty" customization={BASIC_TEXT_CUSTOMIZATION} />
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Loading And Error Copy</h3>
                <div className="super-select-story__stack super-select-story__mt-8">
                    <SuperSelect
                        mode={mode}
                        name="basicCustomizationLoading"
                        optionSource={loadingSource}
                        customization={BASIC_TEXT_CUSTOMIZATION}
                    />
                    <SuperSelect
                        mode={mode}
                        name="basicCustomizationError"
                        optionSource={errorSource}
                        customization={BASIC_TEXT_CUSTOMIZATION}
                    />
                </div>
            </section>
        </div>
    );
}

const BASIC_TEXT_CUSTOMIZATION = {
    modalSelectButton: {
        selectedContent: {
            placeholder: "Select an option",
        },
    },
    modal: {
        okButton: {
            title: "Apply selection",
            content: "Apply",
        },
        closeButton: {
            title: "Close dialog",
            content: "Close",
        },
    },
    searchInput: {
        placeholder: "Search options",
    },
    pendingIndicator: {
        title: "Loading options",
        content: "Loading options...",
    },
    errorIndicator: {
        defaultMessage: "Unable to load options right now.",
        retryButton: {
            title: "Retry loading options",
            content: "Try again",
        },
    },
    emptyIndicator: {
        content: "No options available.",
        retryButton: {
            title: "Try loading again",
            content: "Try again",
        },
    },
    moreIndicator: {
        loadMoreButton: {
            title: "Load more options",
            content: "Load more options",
        },
        overflowIndicator: {
            title: "More options are available",
            content: "More options are available",
        },
    },
};
