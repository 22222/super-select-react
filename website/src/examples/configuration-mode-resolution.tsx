import { SuperSelect, useOptionSource } from "super-select-react";

export default function ConfigurationModeResolutionExample() {
    const largeSource = useOptionSource({
        fetch: async ({ offset = 0, limit = 6, signal }) => {
            await new Promise((resolve, reject) => {
                const timer = window.setTimeout(resolve, 300);
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
                { value: "austin", label: "Austin" },
                { value: "boston", label: "Boston" },
                { value: "chicago", label: "Chicago" },
                { value: "dallas", label: "Dallas" },
                { value: "denver", label: "Denver" },
                { value: "el-paso", label: "El Paso" },
                { value: "houston", label: "Houston" },
                { value: "san-antonio", label: "San Antonio" },
                { value: "san-diego", label: "San Diego" },
                { value: "seattle", label: "Seattle" },
            ];

            return {
                options: options.slice(offset, offset + limit),
                hasMore: offset + limit < options.length,
            };
        },
    });

    const smallSource = useOptionSource({
        fetch: async ({ signal }) => {
            await new Promise((resolve, reject) => {
                const timer = window.setTimeout(resolve, 300);
                signal?.addEventListener(
                    "abort",
                    () => {
                        window.clearTimeout(timer);
                        reject(new DOMException("The operation was aborted.", "AbortError"));
                    },
                    { once: true },
                );
            });

            return {
                options: [
                    { value: "robert-balboa", label: "Robert Balboa" },
                    { value: "adrian-pennino", label: "Adrian Pennino" },
                    { value: "apollo-creed", label: "Apollo Creed" },
                ],
                hasMore: false,
            };
        },
    });

    return (
        <section className="super-select-story__card super-select-story__stack">
            <h3 className="super-select-story__card-title">Mode Resolution</h3>

            <section data-testid="super-resolve-large">
                <SuperSelect
                    name="superResolveLarge"
                    optionSource={largeSource}
                    mode={({ options, hasMore }) => (hasMore || options.length > 8 ? "modal" : "native")}
                />
            </section>

            <section data-testid="super-resolve-small">
                <SuperSelect
                    name="superResolveSmall"
                    optionSource={smallSource}
                    mode={({ options, hasMore }) => (hasMore || options.length > 8 ? "modal" : "native")}
                />
            </section>
        </section>
    );
}
