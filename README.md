# Super Select

Super Select is a drop-in replacement for the native `<select>` in React.

It keeps the familiar parts of native selects: `<option>` and `<optgroup>` children, `name`, `multiple`, `required`,
`disabled`, `value`, `defaultValue`, and `onChange`. The value model and form behavior stay close to the platform, even
when the rendered UI is not the browser's native select.

The default mode is a searchable modal inspired by Android's select pattern: the field stays compact in the form, then
selection happens in a focused surface. The goal is one select format that works well with mouse, keyboard, and touch,
on desktop or mobile.

Super Select adds a few custom props to the standard select API:

- `optionSource` provides options from an API or other data source, including search, pagination, and selected value resolution.
- `mode` controls how the field is rendered: modal picker, inline option list, toggle buttons, or native `<select>`.
- `onValueChange` gives you the selected value directly when you do not need the full `onChange` event.
- `customization` changes the rendered UI with classes, styles, or replacement components while keeping the selection
  behavior in Super Select.

See the [documentation and live examples](https://22222.github.io/super-select-react/) for complete usage details.

## Installation

```bash
npm install super-select-react
```

## Basic Usage

```tsx
import { SuperSelect } from "super-select-react";
import "super-select-react/style.css";

export function PersonField() {
    return (
        <SuperSelect name="person">
            <option value="robert-balboa">Robert Balboa</option>
            <option value="adrian-pennino">Adrian Pennino</option>
            <option value="apollo-creed">Apollo Creed</option>
        </SuperSelect>
    );
}
```

## Modes

The same field can be rendered in different ways:

```tsx
<SuperSelect mode="modal" />
<SuperSelect mode="option-list" />
<SuperSelect mode="toggle-button" />
<SuperSelect mode="native" />
```

`modal` is the default. `option-list` renders inline radios or checkboxes. `toggle-button` renders local options as a
compact button group. `native` renders a real browser `<select>`.

## Async Options

If your options come from an API or other data source, pass an `optionSource`.

```tsx
import { useMemo } from "react";
import { createOptionSource, SuperSelect } from "super-select-react";

export function PersonSourceField() {
    const peopleSource = useMemo(
        () =>
            createOptionSource({
                fetch: async ({ values, search = "", offset = 0, limit = 100, signal }) => {
                    const query = values
                        ? values.map((value) => `ids=${encodeURIComponent(value)}`).join("&")
                        : `search=${encodeURIComponent(search)}&offset=${offset}&limit=${limit}`;
                    const response = await fetch(`/api/people?${query}`, { signal });
                    if (!response.ok) {
                        throw new Error(`Unable to load people: ${response.status}`);
                    }
                    const data = await response.json();
                    return {
                        options: data.items.map((person: { id: string; name: string }) => ({
                            value: person.id,
                            label: person.name,
                        })),
                        hasMore: data.hasMore,
                    };
                },
            }),
        [],
    );

    return <SuperSelect name="person" optionSource={peopleSource} />;
}
```

Super Select sends `values` when it needs to resolve labels for already-selected options, such as a saved value that is
not on the first page. Handle that request so those options come back even when they would not match the current search.

## Customization

Super Select is not tied to a UI framework. You can use the default CSS, adapt it to your own classes, or replace pieces
of the rendered UI for libraries like Bootstrap, Mantine, or Material UI.

## More Information

- Read the [full documentation and live examples](https://22222.github.io/super-select-react/).
- View the [source code and issue tracker](https://github.com/22222/super-select-react).
- For design goals and contribution guidance, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Super Select is available under either the [MIT License](LICENSE) or [The Unlicense](UNLICENSE), at your choice.
