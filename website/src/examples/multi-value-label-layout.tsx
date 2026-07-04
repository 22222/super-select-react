import { useState } from "react";
import { SuperSelect, type SuperSelectMode } from "super-select-react";

import { ModeSelector } from "./ModeSelector";

export default function MultiValueLabelLayoutExample() {
    const [mode, setMode] = useState<SuperSelectMode | undefined>(undefined);

    return (
        <div className="super-select-story__page" data-testid="story-ready">
            <ModeSelector mode={mode} setMode={setMode} />

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Wrapping Labels</h3>
                <div className="super-select-story__stack super-select-story__mt-8">
                    <SuperSelect
                        mode={mode}
                        multiple
                        name="locationsWrapping"
                        defaultValue={["north-warehouse-zone-a", "west-hub-gate-3", "south-yard-dock-2"]}
                    >
                        <option value="north-warehouse-zone-a">North Warehouse, Zone A</option>
                        <option value="west-hub-gate-3">West Hub, Gate 3</option>
                        <option value="south-yard-dock-2">South Yard, Dock 2</option>
                        <option value="east-terminal-bay-4">East Terminal, Bay 4</option>
                    </SuperSelect>

                    <SuperSelect mode={mode} multiple name="locationsTwo" defaultValue={["north-warehouse-zone-a", "west-hub-gate-3"]}>
                        <option value="north-warehouse-zone-a">North Warehouse, Zone A</option>
                        <option value="west-hub-gate-3">West Hub, Gate 3</option>
                        <option value="south-yard-dock-2">South Yard, Dock 2</option>
                        <option value="east-terminal-bay-4">East Terminal, Bay 4</option>
                    </SuperSelect>

                    <SuperSelect mode={mode} name="locationSingle" defaultValue="north-warehouse-zone-a">
                        <option value="north-warehouse-zone-a">North Warehouse, Zone A</option>
                        <option value="west-hub-gate-3">West Hub, Gate 3</option>
                        <option value="south-yard-dock-2">South Yard, Dock 2</option>
                        <option value="east-terminal-bay-4">East Terminal, Bay 4</option>
                    </SuperSelect>
                </div>
            </section>
        </div>
    );
}
