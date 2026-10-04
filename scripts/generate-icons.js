#!/usr/bin/env node
/**
 * Generate the AN5 icon set from the brand tokens.
 *
 *   node scripts/generate-icons.js [--out DIR] [--sizes 16,24,32] [--no-png] [--quiet]
 *
 * Programmatic use:
 *
 *   const brand = require('@an5/brand');
 *   await brand.generate({ outDir: 'path/to/icons' });
 *
 * The wordmark is emitted as vector outlines taken from the vendored font subset
 * so that no renderer needs a system font: the SVGs and the PNGs rendered from
 * them are identical on every machine.
 */

const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const TOKENS_PATH = path.join(ROOT, 'tokens.json');
const PRECISION = 2;

function loadTokens(tokensPath = TOKENS_PATH) {
  return JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
}

function badgeAttrs(badge) {
  const { x, y, width, height, radius } = badge;
  return `x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" ry="${radius}"`;
}

/**
 * Lay the wordmark out at an arbitrary font size and report its outline data plus
 * the ink bounding box, so the caller can scale it to the approved cap height and
 * centre it on its own ink rather than on font side bearings.
 */
function layoutWordmark(font, wordmark, fontSize) {
  const glyphs = [...wordmark.text].map((char) => font.charToGlyph(char));
  let pen = 0;
  let d = '';
  const box = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };

  for (const glyph of glyphs) {
    const glyphPath = glyph.getPath(pen, 0, fontSize);
    d += `${glyphPath.toPathData(PRECISION)} `;
    const { x1, y1, x2, y2 } = glyphPath.getBoundingBox();
    box.left = Math.min(box.left, x1);
    box.right = Math.max(box.right, x2);
    box.top = Math.min(box.top, y1);
    box.bottom = Math.max(box.bottom, y2);
    pen += glyph.advanceWidth * (fontSize / font.unitsPerEm);
  }

  return { d: d.trim(), box };
}

function buildWordmark(tokens) {
  const { wordmark } = tokens;
  const font = opentype.loadSync(path.resolve(ROOT, wordmark.fontFile));
  const probe = layoutWordmark(font, wordmark, 1000);
  const fontSize = (wordmark.capHeight * 1000) / (probe.box.bottom - probe.box.top);

  const { d, box } = layoutWordmark(font, wordmark, fontSize);
  return {
    d,
    translateX: wordmark.centerX - (box.left + box.right) / 2,
    translateY: wordmark.baseline - box.bottom,
  };
}

/** Full-colour badge, for webviews, the marketplace listing and documentation. */
function wordmarkSvg(tokens, size) {
  const { badge, color } = tokens;
  const mark = buildWordmark(tokens);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <defs>
    <linearGradient id="an5-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color.gradient.start}"/>
      <stop offset="100%" stop-color="${color.gradient.end}"/>
    </linearGradient>
  </defs>
  <rect ${badgeAttrs(badge)} fill="url(#an5-gradient)"/>
  <g transform="translate(${mark.translateX.toFixed(PRECISION)} ${mark.translateY.toFixed(PRECISION)})" fill="${color.foreground.onBadge}">
    <path d="${mark.d}"/>
  </g>
</svg>
`;
}

/**
 * Single-colour badge with the letters knocked out, for editors that paint icons
 * as one flat fill (VS Code Activity Bar, editor tab).
 */
function activitySvg(tokens) {
  const { badge, color, icons } = tokens;
  const size = icons.activitySize;
  const mark = buildWordmark(tokens);
  const shape = badgeAttrs(badge);
  const letters = `<g transform="translate(${mark.translateX.toFixed(PRECISION)} ${mark.translateY.toFixed(PRECISION)})"><path d="${mark.d}"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <!-- Knockout letters stay visible when the host renders this as a monochrome surface. -->
  <defs>
    <mask id="an5-letters" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
      <rect ${shape} fill="white"/>
      ${letters}
    </mask>
  </defs>
  <rect ${shape} fill="${color.monochrome.onSurface}" mask="url(#an5-letters)"/>
</svg>
`;
}

function parseArgs(argv) {
  const options = { outDir: path.join(ROOT, 'icons'), sizes: null, png: true, quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--out') options.outDir = path.resolve(argv[++i]);
    else if (arg === '--sizes') options.sizes = argv[++i].split(',').map(Number);
    else if (arg === '--no-png') options.png = false;
    else if (arg === '--quiet') options.quiet = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

async function generate({ outDir, sizes, png = true, quiet = false } = {}) {
  const tokens = loadTokens();
  const target = outDir || path.join(ROOT, 'icons');
  const log = quiet ? () => {} : (message) => console.log(message);

  fs.mkdirSync(target, { recursive: true });
  const written = [];
  const emit = (name, contents) => {
    fs.writeFileSync(path.join(target, name), contents);
    written.push(name);
  };

  emit(tokens.icons.activityFile, activitySvg(tokens));
  log(`  ✓ Generated ${tokens.icons.activityFile}`);

  const list = sizes || tokens.icons.sizes;
  const stemFor = (size) => tokens.icons.wordmarkFile.replace(/\{size\}/g, size);

  for (const size of list) {
    const stem = stemFor(size);
    const svgContent = wordmarkSvg(tokens, size);
    emit(`${stem}.svg`, svgContent);
    if (png) {
      await sharp(Buffer.from(svgContent)).resize(size, size).png().toFile(path.join(target, `${stem}.png`));
      written.push(`${stem}.png`);
    }
    log(`  ✓ Generated ${stem}.svg${png ? ` & ${stem}.png` : ''}`);

    if (size === tokens.icons.defaultSize) {
      const defaultStem = tokens.icons.defaultFile;
      emit(`${defaultStem}.svg`, svgContent);
      if (png) {
        await sharp(Buffer.from(svgContent)).resize(size, size).png().toFile(path.join(target, `${defaultStem}.png`));
        written.push(`${defaultStem}.png`);
      }
      log(`  ✓ Generated ${defaultStem}.svg${png ? ` & ${defaultStem}.png` : ''}`);
    }
  }

  return { outDir: target, count: written.length, files: written };
}

if (require.main === module) {
  const options = parseArgs(process.argv.slice(2));
  if (!options.quiet) console.log('🚀 Generating AN5 icons from brand tokens...\n');
  generate(options)
    .then(({ count }) => {
      if (!options.quiet) console.log(`\n✨ Generated ${count} icon files in ${options.outDir}`);
    })
    .catch((err) => {
      console.error('❌ Error generating icons:', err);
      process.exit(1);
    });
}

module.exports = { generate, loadTokens, wordmarkSvg, activitySvg, buildWordmark, badgeAttrs };