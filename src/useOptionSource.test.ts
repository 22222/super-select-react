import { expectTypeOf, test } from "vitest";

import type { Option, OptionSourceLike } from "./option-source";
import { useOptionSource } from "./useOptionSource";

test("useOptionSource types the source and requests from the data type", () => {
    interface City {
        population: number;
    }

    const CityField = () => {
        const source = useOptionSource<City>(async ({ values, search, offset, limit, after, signal }) => {
            expectTypeOf(values).toEqualTypeOf<readonly string[] | undefined>();
            expectTypeOf(search).toEqualTypeOf<string | undefined>();
            expectTypeOf(offset).toEqualTypeOf<number | undefined>();
            expectTypeOf(limit).toEqualTypeOf<number | undefined>();
            expectTypeOf(after).toEqualTypeOf<Option<City> | undefined>();
            expectTypeOf(signal).toEqualTypeOf<AbortSignal | undefined>();
            return { options: [] };
        }, []);

        expectTypeOf(source).toEqualTypeOf<OptionSourceLike<City>>();
        return source;
    };

    expectTypeOf(CityField).toBeFunction();
});

test("useOptionSource does not require a deps array", () => {
    const Field = () => useOptionSource(async () => ({ options: [] }));

    expectTypeOf(Field).returns.toEqualTypeOf<OptionSourceLike>();
});

test("useOptionSource accepts the same arguments as createOptionSource", () => {
    const InitField = () => useOptionSource({ fetch: async () => ({ options: [] }), noCache: true });
    expectTypeOf(InitField).returns.toEqualTypeOf<OptionSourceLike>();

    const SourceField = (props: { source: OptionSourceLike }) => useOptionSource(props.source, [props.source]);
    expectTypeOf(SourceField).returns.toEqualTypeOf<OptionSourceLike>();
});
