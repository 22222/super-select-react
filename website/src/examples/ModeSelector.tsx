import { type Dispatch, type SetStateAction } from "react";
import { type SuperSelectMode, ToggleButtonSelect } from "super-select-react";

export interface ModeSelectorProps {
    mode: SuperSelectMode | undefined;
    setMode: Dispatch<SetStateAction<SuperSelectMode | undefined>>;
}

export function ModeSelector({ mode, setMode }: ModeSelectorProps) {
    return (
        <section className="super-select-story__card super-select-story__card-sm">
            <h3 className="super-select-story__card-title super-select-story__card-title-sm">Display Mode</h3>
            <div data-testid="story-mode-selector" className="super-select-story__mt-8">
                <ToggleButtonSelect
                    name="storyModeSelector"
                    value={mode ?? ""}
                    onChange={(event) => {
                        const rawValue = Array.isArray(event.target.value)
                            ? String(event.target.value[0] ?? "")
                            : String(event.target.value ?? "");
                        setMode(rawValue.length > 0 ? (rawValue as SuperSelectMode) : undefined);
                    }}
                >
                    <option value="modal">Modal</option>
                    <option value="option-list">Option List</option>
                    <option value="toggle-button">Toggle Buttons</option>
                    <option value="native">Native</option>
                </ToggleButtonSelect>
            </div>
        </section>
    );
}
