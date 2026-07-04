import { createElement, useState } from "react";
import { SuperSelect, type SuperSelectMode } from "super-select-react";

import { ModeSelector } from "./ModeSelector";

const COLORS = [
    { value: "ocean-blue", name: "Ocean Blue", hex: "#2563EB" },
    { value: "emerald", name: "Emerald", hex: "#059669" },
    { value: "amber", name: "Amber", hex: "#D97706" },
    { value: "crimson", name: "Crimson", hex: "#DC2626" },
    { value: "violet", name: "Violet", hex: "#7C3AED" },
];

export default function RichOptionContentExample() {
    const [mode, setMode] = useState<SuperSelectMode | undefined>(undefined);
    const colorOptions = COLORS.map((color) => (
        <option key={color.value} value={color.value}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem" }}>
                <span
                    aria-hidden="true"
                    style={{
                        width: "1.25rem",
                        height: "1.25rem",
                        borderRadius: "0.25rem",
                        backgroundColor: color.hex,
                        boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 20%)",
                    }}
                />
                <span>
                    <strong>{color.name}</strong> <code style={{ color: "inherit", backgroundColor: "transparent" }}>{color.hex}</code>
                </span>
            </span>
        </option>
    ));

    return (
        <div className="super-select-story__page">
            <ModeSelector mode={mode} setMode={setMode} />

            <section className="super-select-story__card super-select-story__stack">
                <h3 className="super-select-story__card-title">Single Select</h3>
                <label htmlFor="rich-option-content-color">Color</label>
                <SuperSelect id="rich-option-content-color" mode={mode} name="color" className="super-select-story__rich-native-select">
                    <button>{createElement("selectedcontent")}</button>
                    {colorOptions}
                </SuperSelect>
            </section>

            <section className="super-select-story__card super-select-story__stack">
                <h3 className="super-select-story__card-title">Multiple Select</h3>
                <label htmlFor="rich-option-content-colors">Colors</label>
                <SuperSelect
                    id="rich-option-content-colors"
                    mode={mode}
                    name="colors"
                    className="super-select-story__rich-native-select"
                    multiple
                    defaultValue={["ocean-blue", "emerald"]}
                >
                    {colorOptions}
                </SuperSelect>
            </section>
        </div>
    );
}
