import { expectTypeOf, test } from "vitest";

import { ModalSelect } from "./modal-select";
import { OptionListSelect } from "./option-list-select";
import type { SelectChangeValue } from "./SelectProps";
import { SuperSelect } from "./SuperSelect";
import { ToggleButtonSelect } from "./toggle-button-select";

test("SelectChangeValue follows the multiple type", () => {
    expectTypeOf<SelectChangeValue<false>>().toEqualTypeOf<string>();
    expectTypeOf<SelectChangeValue<true>>().toEqualTypeOf<string[]>();
    expectTypeOf<SelectChangeValue<boolean>>().toEqualTypeOf<string | string[]>();
    expectTypeOf<SelectChangeValue>().toEqualTypeOf<string | string[]>();
});

test("select components infer onValueChange from multiple", () => {
    const handleValue = (value: string) => void value;
    const handleValues = (values: string[]) => void values;

    <SuperSelect onValueChange={handleValue} />;
    <SuperSelect multiple onValueChange={handleValues} />;
    <ModalSelect onValueChange={handleValue} />;
    <ModalSelect multiple onValueChange={handleValues} />;
    <OptionListSelect onValueChange={handleValue} />;
    <OptionListSelect multiple onValueChange={handleValues} />;
    <ToggleButtonSelect onValueChange={handleValue} />;
    <ToggleButtonSelect multiple onValueChange={handleValues} />;

    // @ts-expect-error A single select cannot call an array-only handler.
    <SuperSelect onValueChange={handleValues} />;
    // @ts-expect-error A multiple select cannot call a string-only handler.
    <SuperSelect multiple onValueChange={handleValue} />;

    expectTypeOf(handleValue).toBeFunction();
});

test("a dynamic multiple prop uses the value union", () => {
    const DynamicSelect = ({ multiple }: { multiple: boolean }) => (
        <SuperSelect
            multiple={multiple}
            onValueChange={(value) => {
                expectTypeOf(value).toEqualTypeOf<string | string[]>();
            }}
        />
    );

    expectTypeOf(DynamicSelect).toBeFunction();
});
