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
- Added the `wordmark.embolden` and `wordmark.tracking` tokens. `embolden` strokes
  the outline outward to reach the weight of the original artwork; `tracking` widens
  the gaps between letters and defaults to `0`. The generator solves the font size so
  the stroked ink still lands on the `wordmark.capHeight` measured from the artwork.

### Added

- `scripts/assets.js` for the brand assets beyond the icon set: `faviconSvg`,
  `badgeMarkup`, `ogImageSvg`, `syncFavicons`, `verifyFavicons`, and `cssTokens` /
  `syncCss` which inject the brand custom properties into a consumer stylesheet
  between generated markers so it can be verified byte-for-byte.
- `assets/og-image.template.svg`, the social card template, so the badge on the card
  is generated from the same tokens as every other badge.
- `scripts/render-og-image.js`, which rasterises the card. It checks that Inter and
  JetBrains Mono resolve to themselves and refuses to render otherwise, because
  fontconfig silently substitutes a fallback whose metrics shift the layout.
- `icons.faviconSize`, `icons.faviconFile` and the `ogImage` section in `tokens.json`.

### Fixed

- `check-icons.js` measured the wordmark by upscaling a small committed PNG, which
  dropped the antialiased edge column and reported the centre as 52.08 instead of
  50.00. It now renders the SVG at high resolution and tightened the tolerance to
  0.3 viewBox units.
- `syncCss` built its marker `RegExp` from the raw marker text, so the `*` in the
  `/*` comment prefix made every stylesheet report `missing block`. The markers are
  now escaped before matching.