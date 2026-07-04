import { SuperSelect } from "super-select-react";

export default function HomeBasicExample() {
    return (
        <SuperSelect>
            <option value="" disabled hidden>
                Select an option
            </option>
            <option value="1">Hello</option>
            <option value="2">World!</option>
            <option value="3">Three</option>
        </SuperSelect>
    );
}
