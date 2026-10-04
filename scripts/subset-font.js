#!/usr/bin/env node
/**
 * Rebuild the vendored wordmark font subset.
 *
 * Only needed when wordmark.text changes in tokens.json. The subset keeps the
 * glyphs the wordmark uses so the committed file stays a few kilobytes instead of
 * shipping a whole typeface.
 *
 *   node scripts/subset-font.js --source /path/to/DejaVuSans-Bold.ttf
 *
 * The source font is not vendored: DejaVu Sans Bold is a standard system font on
 * Linux, installable elsewhere via fonts-dejavu-core.
 */

const fs = require('fs');
const path = require('path');
const subsetFont = require('subset-font');

const ROOT = path.resolve(__dirname, '..');

async function main() {
  const argv = process.argv.slice(2);
  let source = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--source') source = path.resolve(argv[++i]);
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }

  const tokens = JSON.parse(fs.readFileSync(path.join(ROOT, 'tokens.json'), 'utf8'));
  const target = path.join(ROOT, tokens.wordmark.fontFile);
  const characters = [...new Set([...tokens.wordmark.text])].join('');

  if (!source) {
    console.error('❌ --source is required, for example:\n' +
      '   node scripts/subset-font.js --source /usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf');
    process.exit(1);
  }
  if (!fs.existsSync(source)) {
    console.error(`❌ Source font not found: ${source}`);
    process.exit(1);
  }

  const subset = await subsetFont(fs.readFileSync(source), characters, { targetFormat: 'truetype' });
  fs.writeFileSync(target, subset);

  console.log(`✓ Wrote ${path.relative(ROOT, target)} (${characters}) — ${(subset.length / 1024).toFixed(1)} KB`);
  console.log('  Update tokens.json wordmark.fontFamily if the source font changed, then run npm run generate:icons');
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});