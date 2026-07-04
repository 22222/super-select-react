import { useMemo, useState } from "react";
import { createOptionSource, SuperSelect, type SuperSelectMode } from "super-select-react";

import { ModeSelector } from "./ModeSelector";

export default function FormBehaviorE2EExample() {
    const [mode, setMode] = useState<SuperSelectMode | undefined>(undefined);

    const [optionListSingleSubmitCount, setOptionListSingleSubmitCount] = useState(0);
    const [optionListSinglePayload, setOptionListSinglePayload] = useState("");
    const [optionListSingleInvalidCount, setOptionListSingleInvalidCount] = useState(0);
    const [optionListMultiSubmitCount, setOptionListMultiSubmitCount] = useState(0);
    const [optionListMultiPayload, setOptionListMultiPayload] = useState("");

    const [toggleSingleSubmitCount, setToggleSingleSubmitCount] = useState(0);
    const [toggleSinglePayload, setToggleSinglePayload] = useState("");
    const [toggleSingleInvalidCount, setToggleSingleInvalidCount] = useState(0);
    const [toggleMultiSubmitCount, setToggleMultiSubmitCount] = useState(0);
    const [toggleMultiPayload, setToggleMultiPayload] = useState("");

    const paginatedSource = useMemo(
        () =>
            createOptionSource({
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
                        { value: "san-diego", label: "San Diego" },
                    ];

                    return {
                        options: options.slice(offset, offset + limit),
                        hasMore: offset + limit < options.length,
                    };
                },
            }),
        [],
    );

    return (
        <div className="super-select-story__page" data-testid="story-ready">
            <ModeSelector mode={mode} setMode={setMode} />

            <section className="super-select-story__card super-select-story__stack">
                <h3 className="super-select-story__card-title">Option List Form</h3>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        setOptionListSingleSubmitCount((count) => count + 1);
                        setOptionListSinglePayload(String(formData.get("singleFilteredRequired") ?? ""));
                    }}
                    className="super-select-story__stack"
                >
                    <SuperSelect
                        mode={mode}
                        name="singleFilteredRequired"
                        required
                        onInvalid={() => setOptionListSingleInvalidCount((count) => count + 1)}
                    >
                        <option value="robert-balboa">Robert Balboa</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="apollo-creed">Apollo Creed</option>
                    </SuperSelect>
                    <button type="submit" data-testid="option-list-single-submit">
                        Submit
                    </button>
                    <p data-testid="option-list-single-submit-count">Submit count: {optionListSingleSubmitCount}</p>
                    <p data-testid="option-list-single-payload">Payload: {optionListSinglePayload}</p>
                    <p data-testid="option-list-single-invalid-count">Invalid count: {optionListSingleInvalidCount}</p>
                </form>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        setOptionListMultiSubmitCount((count) => count + 1);
                        setOptionListMultiPayload(formData.getAll("multiPaginatedRequired").map(String).sort().join(","));
                    }}
                    className="super-select-story__stack"
                >
                    <SuperSelect mode={mode} name="multiPaginatedRequired" multiple required optionSource={paginatedSource} />
                    <button type="submit" data-testid="option-list-multi-submit">
                        Submit
                    </button>
                    <p data-testid="option-list-multi-submit-count">Submit count: {optionListMultiSubmitCount}</p>
                    <p data-testid="option-list-multi-payload">Payload: {optionListMultiPayload}</p>
                </form>
            </section>

            <section className="super-select-story__card super-select-story__stack">
                <h3 className="super-select-story__card-title">Toggle Group Form</h3>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        setToggleSingleSubmitCount((count) => count + 1);
                        setToggleSinglePayload(String(formData.get("singleToggleRequired") ?? ""));
                    }}
                    className="super-select-story__stack"
                >
                    <SuperSelect
                        mode={mode}
                        name="singleToggleRequired"
                        required
                        onInvalid={() => setToggleSingleInvalidCount((count) => count + 1)}
                    >
                        <option value="robert-balboa">Robert Balboa</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="apollo-creed">Apollo Creed</option>
                    </SuperSelect>
                    <button type="submit" data-testid="toggle-group-single-submit">
                        Submit
                    </button>
                    <p data-testid="toggle-group-single-submit-count">Submit count: {toggleSingleSubmitCount}</p>
                    <p data-testid="toggle-group-single-payload">Payload: {toggleSinglePayload}</p>
                    <p data-testid="toggle-group-single-invalid-count">Invalid count: {toggleSingleInvalidCount}</p>
                </form>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        setToggleMultiSubmitCount((count) => count + 1);
                        setToggleMultiPayload(formData.getAll("multiToggleRequired").map(String).sort().join(","));
                    }}
                    className="super-select-story__stack"
                >
                    <SuperSelect mode={mode} name="multiToggleRequired" multiple required>
                        <option value="robert-balboa">Robert Balboa</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="apollo-creed">Apollo Creed</option>
                    </SuperSelect>
                    <button type="submit" data-testid="toggle-group-multi-submit">
                        Submit
                    </button>
                    <p data-testid="toggle-group-multi-submit-count">Submit count: {toggleMultiSubmitCount}</p>
                    <p data-testid="toggle-group-multi-payload">Payload: {toggleMultiPayload}</p>
                </form>
            </section>
        </div>
    );
}
