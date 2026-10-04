#!/usr/bin/env node
/**
 * Render the social card to PNG.
 *
 *   node scripts/render-og-image.js --out ../an5Docs/docs/assets/og-image.png
 *
 * The template sets its prose in Inter and JetBrains Mono. Those fonts must be
 * installed locally, because fontconfig silently substitutes a fallback when they
 * are missing and the substituted metrics shift the layout. The check below refuses
 * to render rather than produce a card that does not match the SVG.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const sharp = require('sharp');
const { loadTokens } = require('./generate-icons');
const { ogImageSvg } = require('./assets');

const ROOT = path.resolve(__dirname, '..');
const REQUIRED_FONTS = ['Inter', 'JetBrains Mono'];

function resolveFont(family) {
  try {
    const out = execFileSync('fc-match', ['--format=%{family}', family], { encoding: 'utf8' }).trim();
    return out;
  } catch {
    return '';
  }
}

function missingFonts() {
  return REQUIRED_FONTS.filter((family) => {
    const match = resolveFont(family);
    const first = match.split(',')[0].trim().toLowerCase();
    return !first.includes(family.toLowerCase().split(' ')[0]);
  });
}

async function main() {
  const argv = process.argv.slice(2);
  let out = path.resolve(ROOT, '..', 'an5Docs', 'docs', 'assets', 'og-image.png');
  let writeSvg = true;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') out = path.resolve(argv[++i]);
    else if (argv[i] === '--no-svg') writeSvg = false;
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }

  const tokens = loadTokens();
  const svg = ogImageSvg(tokens);
  // Write the resolved SVG next to the PNG, so the consumer holds the rendered
  // card and this repository keeps only the template.
  const svgPath = path.join(path.dirname(out), 'og-image.svg');
  if (writeSvg) fs.writeFileSync(svgPath, svg);

  const missing = missingFonts();
  if (missing.length) {
    console.error(`❌ Cannot render the social card faithfully: ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} not installed.`);
    console.error('   fontconfig would substitute a fallback and shift the layout.');
    console.error(`   Install ${missing.join(' and ')} (for example fonts-inter and fonts-jetbrains-mono), then re-run.`);
    console.error(`   The SVG at ${path.relative(process.cwd(), svgPath)} was refreshed and is correct.`);
    process.exit(1);
  }

  await sharp(Buffer.from(svg)).resize(1200, 630).png().toFile(out);
  console.log(`✓ Wrote ${path.relative(process.cwd(), svgPath)}`);
  console.log(`✓ Wrote ${path.relative(process.cwd(), out)}`);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});