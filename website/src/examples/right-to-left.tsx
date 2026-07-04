import { useState } from "react";
import { SuperSelect, type SuperSelectMode } from "super-select-react";

import { ModeSelector } from "./ModeSelector";

const cities = [
    { value: "cairo", label: "القاهرة" },
    { value: "dubai", label: "دبي" },
    { value: "beirut", label: "بيروت" },
];

export default function RightToLeftExample() {
    const [mode, setMode] = useState<SuperSelectMode | undefined>(undefined);

    return (
        <div className="super-select-story__page" data-testid="story-ready">
            <ModeSelector mode={mode} setMode={setMode} />
            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Single Select</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect mode={mode} name="rtlCity" aria-label="مدينة" dir="rtl" lang="ar" defaultValue="cairo">
                        {cities.map((city) => (
                            <option key={city.value} value={city.value}>
                                {city.label}
                            </option>
                        ))}
                    </SuperSelect>
                </div>
            </section>
            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Multiple Select</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect
                        mode={mode}
                        name="rtlCities"
                        aria-label="مدن"
                        dir="rtl"
                        lang="ar"
                        multiple
                        defaultValue={["dubai", "beirut"]}
                    >
                        {cities.map((city) => (
                            <option key={city.value} value={city.value}>
                                {city.label}
                            </option>
                        ))}
                    </SuperSelect>
                </div>
            </section>
        </div>
    );
}
