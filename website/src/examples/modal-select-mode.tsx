import { SuperSelect, useOptionSource } from "super-select-react";

export default function ModalSelectModeExample() {
    const paginatedSource = useOptionSource({
        fetch: async ({ offset = 0, limit = 5, signal }) => {
            await new Promise((resolve, reject) => {
                const timer = window.setTimeout(resolve, 250);
                signal?.addEventListener(
                    "abort",
                    () => {
                        window.clearTimeout(timer);
                        reject(new DOMException("The operation was aborted.", "AbortError"));
                    },
                    { once: true },
                );
            });

            const options = [
                { value: "robert-balboa", label: "Robert Balboa" },
                { value: "adrian-pennino", label: "Adrian Pennino" },
                { value: "apollo-creed", label: "Apollo Creed" },
                { value: "james-lang", label: "James Lang" },
                { value: "ivan-drago", label: "Ivan Drago" },
                { value: "paolo-pennino", label: "Paolo Pennino" },
                { value: "tony-burton", label: "Tony Burton" },
                { value: "clubber-lang", label: "Clubber Lang" },
            ];

            return {
                options: options.slice(offset, offset + limit),
                hasMore: offset + limit < options.length,
            };
        },
    });

    return (
        <div className="super-select-story__page" data-testid="story-ready">
            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Single Select</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect mode="modal" name="modalModeSingle">
                        <option value="robert-balboa">Robert Balboa</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="apollo-creed">Apollo Creed</option>
                        <option value="james-lang">James Lang</option>
                        <option value="ivan-drago">Ivan Drago</option>
                        <option value="paolo-pennino">Paolo Pennino</option>
                    </SuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Multi Select</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect mode="modal" multiple name="modalModeMulti">
                        <option value="robert-balboa">Robert Balboa</option>
                        <option value="adrian-pennino">Adrian Pennino</option>
                        <option value="apollo-creed">Apollo Creed</option>
                        <option value="james-lang">James Lang</option>
                        <option value="ivan-drago">Ivan Drago</option>
                        <option value="paolo-pennino">Paolo Pennino</option>
                    </SuperSelect>
                </div>
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Option Source With Pagination</h3>
                <div className="super-select-story__mt-8">
                    <SuperSelect mode="modal" name="modalModePaged" optionSource={paginatedSource} />
                </div>
            </section>
        </div>
    );
}
