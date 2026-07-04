# Contributing

## Setup

1. Install dependencies:

```bash
npm run setup
```

Or:

```bash
npm install
npm --prefix website install
npm run setup:e2e
```

2. Start the dev server when needed:

```bash
npm start
```

3. Run Full Build and Tests:

```bash
npm run lint
npm run build
npm run test
```

4. Run Visual Tests:

To create or refresh local visual baselines:

```bash
npm run test:visual:update
```

To compare the current UI against those local baselines:

```bash
npm run test:visual
```

Visual baselines are local development files. They are ignored by Git and visual comparisons are not run in CI.

## Releases

This repo publishes one npm package: `super-select-react`.

Version commands:

```bash
npm run version -- patch
npm run version -- minor
npm run version -- major
```

Or set an exact version:

```bash
npm run version -- 1.2.3
```

If you want to rewrite the root version without changing it:

```bash
npm run version -- sync
```

Typical release flow:

1. Bump the package version.
2. Update `CHANGELOG.md` for the release.
3. Run the full verification suite:

```bash
npm run lint
npm run build
npm run test
```

4. Commit the versioned files.
5. Create a git tag like `v1.2.3`.
6. Push the commit and tag.

GitHub Actions will:

- run CI on pull requests and pushes to `main`
- publish the npm package when a `v*` tag is pushed
- deploy the docs site to GitHub Pages from `main`

The publish workflow runs `npm run release`, which builds the release artifacts and publishes the package. Do not run
that command locally during the normal release flow, or the tag workflow will try to publish the same version again.

## Design Goals

- Be a drop-in replacement for native `<select>` in React: same core props, same form behavior, same event expectations.
- Provide an Android-style select mode that opens a modal with radio/checkbox options and search.
- Extend native behavior with option loading, search, pagination, and selected-value resolution.
- Keep the implementation separated into three layers:
    - a framework-agnostic option loading system (no React dependency)
    - standalone select components for each display mode
    - a higher-level `SuperSelect` that coordinates mode selection while keeping API and form behavior consistent
- Keep UI framework independence: no hard dependency on a specific component library or visual system.
- Keep language independence: do not hardcode end-user English strings in runtime UI.

## Implementation Preferences

- Keep code simple and direct. Prefer inline, linear logic over one-off helper functions or new abstractions unless they clearly reduce existing complexity.
- Limit features to native select behavior unless there is a deliberate and documented reason to extend it.
- When fixing a regression, add or update a focused failing test first whenever practical.
- Run e2e tests after large refactors or behavior changes, especially for mode switching, async option sources, grouping, keyboard behavior, and form submission.

## Customization

- Every visible UI element should either be replaceable through customization or be inside a replaceable component.
- Values inside a default component do not all need separate customization hooks if the whole component can be replaced.
- Customization props should pass through user-provided `className`, `style`, `title`, refs, and event handlers where appropriate.
- Keep customization easy for component-library wrappers. If the core can reasonably avoid forcing customizers to cast events or retarget them, prefer doing that work in the core.
- Do not add customization slots just because something changed recently. Add them when a user of the library would naturally need that point of control.

## Styling

- Default styling intentionally uses Bootstrap-style semantic class names.
- Do not invent non-semantic class names unless there is no Bootstrap-style semantic equivalent.
- Utility classes are acceptable as a last resort when they are real Bootstrap concepts, but do not use utility classes to hide custom behavior.
- Do not hardcode inline styles in library code. Applications that use this library may have a CSP header that forbids them.
- Keep the default pending, error, empty, and action controls visually consistent wherever they are used.
