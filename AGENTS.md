# AN5 brand agent context: start

## AN5 Brand agent guidance

`tokens.json` is the single source of truth for colours, badge geometry, wordmark
placement and the icon inventory. Read it before changing any icon, logo, favicon
or brand colour in an AN5 repository.

The wordmark is emitted as **vector outlines** from `assets/fonts/AN5Wordmark-Bold.ttf`.
Do not reintroduce a live `<text>` element with a `font-weight`: font availability
differs per machine and previously made the SVGs disagree with their PNGs.

Regenerate with `npm run generate:icons` (script names must be inspected before
running; available: `generate:icons`, `check`, `test`). Always run `npm run check`
afterwards — it fails when a committed icon drifts from the tokens or when a PNG is
not a pixel-exact render of its SVG.

Consumed as the `an5Brand` submodule of the `an5` monorepo, or standalone via
`https://github.com/an5ORM/an5Brand.git`.

This section is maintained by **AN5: Sync Agent Skills**. Keep project-specific
conventions outside its markers. Credentials and connection strings are not included.
<!-- AN5 brand agent context: end -->