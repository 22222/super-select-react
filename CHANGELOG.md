# Changelog

## 0.9.1 - 2026-07-05

- Added a `useOptionSource` hook that creates a stable option source from a fetch function, keeping one source
  instance across renders while always calling the latest fetch function.
- Added a development-only console warning when the `optionSource` prop changes identity on many renders in a short
  time, which usually means the source is being recreated during render.
- Fix issue with aborted requests being cached

## 0.9.0 - 2026-07-04

First public release.
