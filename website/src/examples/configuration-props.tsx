import { useState } from "react";
import { SuperSelect, type SuperSelectMode } from "super-select-react";

import { ModeSelector } from "./ModeSelector";

export default function ConfigurationPropsExample() {
    const [mode, setMode] = useState<SuperSelectMode | undefined>(undefined);
    const [changeCount, setChangeCount] = useState(0);
    const [focusCount, setFocusCount] = useState(0);
    const [blurCount, setBlurCount] = useState(0);
    const [submitCount, setSubmitCount] = useState(0);
    const [submission, setSubmission] = useState("");
    return (
        <section className="super-select-story__card super-select-story__stack">
            <h3 className="super-select-story__card-title">State And Behavior Props</h3>
            <ModeSelector mode={mode} setMode={setMode} />

            <div className="super-select-story__stack">
                <label htmlFor="configuration-events-select">Event Handlers Demo</label>
                <SuperSelect
                    id="configuration-events-select"
                    data-testid="configuration-super-select"
                    mode={mode}
                    name="configuredSelect"
                    title="Configuration demo select"
                    required
                    autoComplete="off"
                    onFocus={() => setFocusCount((currentValue) => currentValue + 1)}
                    onBlur={() => setBlurCount((currentValue) => currentValue + 1)}
                    onChange={() => setChangeCount((currentValue) => currentValue + 1)}
                >
                    <option value="robert-balboa">Robert Balboa</option>
                    <option value="adrian-pennino">Adrian Pennino</option>
                    <option value="apollo-creed">Apollo Creed</option>
                </SuperSelect>

                <p data-testid="configuration-focus-count">Focus events: {focusCount}</p>
                <p data-testid="configuration-blur-count">Blur events: {blurCount}</p>
                <p data-testid="configuration-change-count">Change events: {changeCount}</p>
            </div>

            <div className="super-select-story__stack">
                <label htmlFor="configuration-disabled-select">Disabled</label>
                <SuperSelect
                    id="configuration-disabled-select"
                    data-testid="configuration-disabled-select"
                    mode={mode}
                    disabled
                    name="disabledSelect"
                >
                    <option value="robert-balboa">Robert Balboa</option>
                    <option value="adrian-pennino">Adrian Pennino</option>
                    <option value="apollo-creed">Apollo Creed</option>
                </SuperSelect>
            </div>

            <form
                className="super-select-story__stack"
                onSubmit={(event) => {
                    event.preventDefault();
                    setSubmitCount((currentValue) => currentValue + 1);
                    const formData = new FormData(event.currentTarget);
                    const singleValue = String(formData.get("requiredSelection") ?? "");
                    const multipleValues = formData.getAll("requiredSelections").map(String);
                    setSubmission(`Single: ${singleValue}; Multiple: ${multipleValues.join(", ")}`);
                }}
            >
                <label htmlFor="configuration-required-select">Required Single Select</label>
                <SuperSelect id="configuration-required-select" mode={mode} name="requiredSelection" required>
                    <option value="" disabled hidden>
                        Choose one
                    </option>
                    <option value="robert-balboa">Robert Balboa</option>
                    <option value="adrian-pennino">Adrian Pennino</option>
                    <option value="apollo-creed">Apollo Creed</option>
                </SuperSelect>

                <label htmlFor="configuration-required-multiple-select">Required Multiple Select</label>
                <SuperSelect id="configuration-required-multiple-select" mode={mode} name="requiredSelections" multiple required>
                    <option value="" disabled hidden>
                        Choose one or more
                    </option>
                    <option value="robert-balboa">Robert Balboa</option>
                    <option value="adrian-pennino">Adrian Pennino</option>
                    <option value="apollo-creed">Apollo Creed</option>
                </SuperSelect>

                <button type="submit" data-testid="configuration-submit">
                    Submit
                </button>
                <p data-testid="configuration-submit-count">Submit count: {submitCount}</p>
                <p data-testid="configuration-submit-payload">Payload: {submission}</p>
            </form>
        </section>
    );
}
