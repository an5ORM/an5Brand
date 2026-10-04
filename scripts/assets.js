#!/usr/bin/env node
/**
 * Shared brand assets beyond the plain icon set: favicons and the social card.
 *
 * Consumers adopt them with the CLI:
 *
 *   node scripts/assets.js --dir ../an5Site --dir ../an5Docs/docs --check
 *   node scripts/assets.js --dir ../an5Site --dir ../an5Docs/docs
 *
 * or programmatically:
 *
 *   const { syncFavicons, verifyFavicons } = require('@an5/brand/scripts/assets');
 *   await verifyFavicons(['../an5Site']);
 */

const fs = require('fs');
const path = require('path');
const { loadTokens, wordmarkSvg, buildWordmark, badgeAttrs } = require('./generate-icons');

const ROOT = path.resolve(__dirname, '..');
const PRECISION = 2;

/** Favicon artwork: the same badge as every other variant, sized for browser tabs. */
function faviconSvg(tokens = loadTokens()) {
  return wordmarkSvg(tokens, tokens.icons.faviconSize);
}

/**
 * The badge and wordmark as markup on the brand's own 100x100 grid, for embedding
 * in a larger composition such as the social card. The caller supplies the gradient
 * id and any filter, so this stays independent of the surrounding document.
 */
function badgeMarkup(tokens, { fill = 'currentColor', filter = '' } = {}) {
  const { color } = tokens;
  const mark = buildWordmark(tokens);
  const paint = color.foreground.onBadge;
  const extra = filter ? ` filter="${filter}"` : '';

  return `<rect ${badgeAttrs(tokens.badge)} fill="${fill}"${extra}/>
  <g transform="translate(${mark.translateX.toFixed(PRECISION)} ${mark.translateY.toFixed(PRECISION)})" fill="${paint}" stroke="${paint}" stroke-width="${mark.strokeWidth}" stroke-linejoin="round">
    <path d="${mark.d}"/>
  </g>`;
}

/** Social card built from the committed template, so its badge cannot drift. */
function ogImageSvg(tokens = loadTokens()) {
  const template = fs.readFileSync(path.resolve(ROOT, tokens.ogImage.template), 'utf8');
  return template.replace('{{BADGE}}', badgeMarkup(tokens, { fill: 'url(#logo-grad)', filter: 'url(#badge-glow)' }));
}

function faviconTargets(dirs, tokens = loadTokens()) {
  return dirs.map((dir) => path.join(path.resolve(dir), tokens.icons.faviconFile));
}

/** Write the brand favicon into each directory. */
async function syncFavicons(dirs, { tokens = loadTokens(), quiet = false } = {}) {
  const svg = faviconSvg(tokens);
  const written = [];
  for (const file of faviconTargets(dirs, tokens)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, svg);
    written.push(file);
    if (!quiet) console.log(`  ✓ Wrote ${path.relative(process.cwd(), file)}`);
  }
  return written;
}

/**
 * Verify each directory's favicon matches the brand. Returns the names of the
 * files that are missing or do not match, so callers can fail their build.
 */
async function verifyFavicons(dirs, { tokens = loadTokens() } = {}) {
  const svg = faviconSvg(tokens);
  const problems = [];
  for (const file of faviconTargets(dirs, tokens)) {
    if (!fs.existsSync(file)) problems.push(`${file}: missing`);
    else if (fs.readFileSync(file, 'utf8') !== svg) problems.push(`${file}: does not match the brand favicon`);
  }
  return problems;
}

const CSS_START = '/* an5-brand:start — generated from an5Brand/tokens.json, do not edit */';
const CSS_END = '/* an5-brand:end */';

function hexToRgbTriplet(hex) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)).join(',');
}

/**
 * The brand custom properties a consumer stylesheet needs. Emitted between markers
 * so a stylesheet can be verified byte-for-byte against the tokens, and so a
 * consumer never hand-copies a colour.
 */
function cssTokens(tokens = loadTokens()) {
  const { color, badge } = tokens;
  return [
    CSS_START,
    ':root {',
    `  --an5-gradient-start: ${color.gradient.start.toLowerCase()};`,
    `  --an5-gradient-end: ${color.gradient.end.toLowerCase()};`,
    '  --an5-gradient: linear-gradient(135deg, var(--an5-gradient-start) 0%, var(--an5-gradient-end) 100%);',
    `  --an5-on-badge: ${color.foreground.onBadge.toLowerCase()};`,
    `  --an5-on-surface: ${color.monochrome.onSurface.toLowerCase()};`,
    `  --an5-cyan-rgb: ${hexToRgbTriplet(color.gradient.start)};`,
    `  --an5-blue-rgb: ${hexToRgbTriplet(color.gradient.end)};`,
    `  --an5-badge-ratio: ${(badge.width / badge.height).toFixed(4)};`,
    `  --an5-badge-radius: ${badge.radius};`,
    '}',
    CSS_END,
  ].join('\n');
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

/**
 * Replace (or insert) the brand block at the top of a stylesheet.
 * `check` reports whether the stylesheet is already in sync instead of writing.
 */
function syncCss(file, { tokens = loadTokens(), check = false } = {}) {
  const block = cssTokens(tokens);
  const target = path.resolve(file);

  if (!fs.existsSync(target)) return { file: target, ok: false, reason: 'missing' };

  const source = fs.readFileSync(target, 'utf8');
  const pattern = new RegExp(`${escapeRegExp(CSS_START)}[\\s\\S]*?${escapeRegExp(CSS_END)}`);
  const existing = source.match(pattern);
  let next;

  if (existing) {
    if (existing[0] === block) return { file: target, ok: true, changed: false };
    next = source.replace(existing[0], block);
  } else {
    next = `${block}\n\n${source.replace(/^\s+/, '')}`;
  }

  if (!check) fs.writeFileSync(target, next);
  return { file: target, ok: false, changed: true, reason: existing ? 'drifted' : 'missing block' };
}

function parseArgs(argv) {
  const dirs = [];
  const css = [];
  let check = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dir') dirs.push(argv[++i]);
    else if (argv[i] === '--css') css.push(argv[++i]);
    else if (argv[i] === '--check') check = true;
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  if (!dirs.length && !css.length) throw new Error('Pass at least one --dir <path> or --css <file>');
  return { dirs, css, check };
}

if (require.main === module) {
  const { dirs, css, check } = parseArgs(process.argv.slice(2));
  const tokens = loadTokens();

  async function run() {
    const problems = [];

    if (dirs.length) {
      if (!check) {
        for (const file of await syncFavicons(dirs, { tokens, quiet: true })) {
          console.log(`  ✓ Wrote ${path.relative(process.cwd(), file)}`);
        }
      }
      problems.push(...(await verifyFavicons(dirs, { tokens })).map((p) => p.replace('does not match the brand favicon', 'does not match the brand favicon')));
    }

    for (const file of css) {
      const result = syncCss(file, { tokens, check });
      if (result.ok) console.log(`  ✓ ${path.relative(process.cwd(), result.file)} carries the current brand tokens`);
      else if (!check) console.log(`  ✓ Injected brand tokens into ${path.relative(process.cwd(), result.file)}`);
      else problems.push(`${result.file}: ${result.reason}`);
    }

    if (check && problems.length) {
      console.error('❌ Assets are out of sync with the AN5 brand tokens.');
      for (const problem of problems) console.error(`   ${problem}`);
      process.exit(1);
    }
    if (check) console.log(`✅ ${dirs.length} favicon(s) and ${css.length} stylesheet(s) match the AN5 brand tokens`);
  }

  run().catch((err) => {
    console.error('❌', err.message);
    process.exit(1);
  });
}

module.exports = {
  faviconSvg, badgeMarkup, ogImageSvg, syncFavicons, verifyFavicons,
  cssTokens, syncCss, CSS_START, CSS_END,
};