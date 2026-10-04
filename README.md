# an5Brand

Single source of truth for the AN5 organisation brand: design tokens, the wordmark
font subset and the generated icon set. Every AN5 repository that ships a logo,
favicon or brand colour takes its assets from here instead of redrawing them.

## Why this exists

Brand assets used to be hand-copied per repository, and the logo was rendered from
a live `<text>` element with `font-weight="900"`. That made the artwork
machine-dependent: a machine with Arial Black produced heavy letterforms, one
without produced a noticeably lighter wordmark, so the SVGs and the PNGs rendered
from them disagreed.

Here the wordmark is emitted as **vector outlines** taken from a vendored font
subset, and its geometry lives in `tokens.json`. The result renders identically
everywhere, and `npm run check` fails if a committed icon drifts.

## Layout

```
tokens.json                     colours, badge shape, wordmark placement, icon inventory
tokens.css                      the same colours as CSS custom properties
assets/fonts/AN5Wordmark-Bold.ttf  subset (A, N, 5) of DejaVu Sans Bold
assets/fonts/README.md          font provenance, regeneration command and license
icons/                          generated icon set, committed for copy-and-use
scripts/generate-icons.js       shared generator (CLI + module)
scripts/check-icons.js          drift, pixel-exactness and placement checks
scripts/subset-font.js          rebuilds the vendored font subset
```

## Icon set

| File | Use |
| --- | --- |
| `an5-{size}x{size}.svg` / `.png` | Full-colour badge, sizes 16–512 |
| `an5.svg` / `an5.png` | Alias of the 24px variant |
| `activity.svg` | Single-colour badge with knocked-out letters, for editors that paint icons as one flat fill (VS Code Activity Bar and editor tab) |

All variants share one badge shape and one wordmark placement, so they stay
consistent as the set grows.

## Using it

### As a git submodule

```sh
git submodule add https://github.com/an5ORM/an5Brand.git an5Brand
git submodule update --init an5Brand
```

### Copy prebuilt assets

Simplest option when the consumer does not want a build step — the committed
`icons/` are the shipped files:

```sh
cp an5Brand/icons/an5-128x128.png  path/to/icon.png
cp an5Brand/icons/activity.svg     path/to/activity-icon.svg
```

### Regenerate from tokens

To add sizes or keep a consumer's icons in lockstep with the tokens:

```sh
node an5Brand/scripts/generate-icons.js --out path/to/icons
node an5Brand/scripts/generate-icons.js --out path/to/icons --sizes 16,32,48 --no-png
```

Programmatic use:

```js
const brand = require('@an5/brand');
await brand.generate({ outDir: 'path/to/icons' });
```

### Colours

`tokens.json` is authoritative; `tokens.css` mirrors it:

```css
background: var(--an5-gradient); /* linear-gradient(135deg, #38bdf8, #6366f1) */
```

## Changing the brand

1. Edit `tokens.json`. Change `color.gradient` for colours, `badge` for the badge
   shape, `wordmark` for the wordmark.
2. If the wordmark text changes, run `npm run subset:font -- --source <font file>`
   and update `wordmark.text` and `wordmark.fontFamily` together.
3. Run `npm run generate:icons` and commit the regenerated `icons/`.
4. Run `npm run check`.

`capHeight`, `baseline` and `centerX` were measured from the approved artwork and
are expressed on the 100×100 canvas. `check-icons.js` verifies the rendered ink
still lands on them, so a font or geometry change cannot silently move the word.

## Requirements

Node.js 18 or newer. `opentype.js` converts glyphs to outlines and `sharp`
rasterises the SVGs to PNG; both are dev dependencies, used only when regenerating.

## License

MIT — see [LICENSE](LICENSE). The vendored font subset is Bitstream Vera licensed;
its notice is reproduced in [assets/fonts/README.md](assets/fonts/README.md).