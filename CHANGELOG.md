# Changelog

All notable changes to the AN5 brand assets are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0]

### Added

- `tokens.json` with the organisation colours, badge geometry, wordmark placement
  and icon inventory as the single source of truth.
- `tokens.css` mirroring those colours as CSS custom properties.
- `assets/fonts/AN5Wordmark-Bold.ttf`, a subset of DejaVu Sans Bold holding only
  the `A`, `N` and `5` glyphs, plus its license notice.
- `icons/`: the generated icon set — `an5-{size}x{size}.svg`/`.png` for sizes 16
  through 512, the `an5` 24px alias, and `activity.svg`.
- `scripts/generate-icons.js` as a shared CLI and module, with `--out`, `--sizes`
  and `--no-png`.
- `scripts/check-icons.js`, which verifies that each PNG is a pixel-exact render of
  its SVG, that regenerating produces byte-identical files, and that the wordmark
  ink still lands on the cap height, baseline and centre in `tokens.json`.

### Changed

- The wordmark is emitted as vector outlines instead of a live `<text>` element, so
  no renderer depends on an installed font and the SVGs no longer disagree with the
  PNGs rendered from them.
- The badge is a 90 × 52 rectangle in every variant, including `activity.svg`, which
  previously used a square badge that did not match the organisation wordmark.