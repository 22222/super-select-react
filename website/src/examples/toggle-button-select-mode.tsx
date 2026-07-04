import { SuperSelect } from "super-select-react";

export default function ToggleButtonSelectModeExample() {
    return (
        <div className="super-select-story__page" data-testid="story-ready">
            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Single Select</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect mode="toggle-button" name="toggleModeSingle">
                        <option value="robert-balboa">Robert Balboa</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="apollo-creed">Apollo Creed</option>
                        <option value="james-lang">James Lang</option>
                    </SuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Multi Select</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect mode="toggle-button" multiple name="toggleModeMulti">
                        <option value="robert-balboa">Robert Balboa</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="apollo-creed">Apollo Creed</option>
                        <option value="james-lang">James Lang</option>
                    </SuperSelect>
                </div>
            </section>
        </div>
    );
}
