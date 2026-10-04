#!/usr/bin/env node
/**
 * Verify the committed icon set:
 *   1. every PNG is a pixel-exact render of its SVG,
 *   2. regenerating produces byte-identical files (no stale artifacts),
 *   3. the wordmark ink sits on the cap height, baseline and centre in tokens.json.
 *
 * Usage: node scripts/check-icons.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const sharp = require('sharp');
const { generate, loadTokens } = require('./generate-icons');

const ROOT = path.resolve(__dirname, '..');
const ICONS_DIR = path.join(ROOT, 'icons');

/**
 * Bounding box of the near-white wordmark, in 0..100 viewBox units.
 *
 * Measured by rendering the SVG at a high resolution: upscaling a small
 * committed PNG drops the antialiased edge column and shifts the box, which
 * would make the placement assertions unreliable.
 */
async function inkBox(svg, sampleSize = 2048) {
  const { data, info } = await sharp(Buffer.from(svg))
    .resize(sampleSize, sampleSize)
    .flatten({ background: '#000000' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const k = 100 / sampleSize;
  let x0 = Infinity, x1 = -1, y0 = Infinity, y1 = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[y * info.width + x] > 200) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return { x0: x0 * k, x1: (x1 + 1) * k, y0: y0 * k, y1: (y1 + 1) * k };
}

function listFiles(dir) {
  return fs.readdirSync(dir).sort();
}

async function main() {
  const tokens = loadTokens();
  const sizes = tokens.icons.sizes;
  let checks = 0;

  // 1. PNG matches its SVG.
  for (const size of sizes) {
    const stem = tokens.icons.wordmarkFile.replace(/\{size\}/g, size);
    const svgPath = path.join(ICONS_DIR, `${stem}.svg`);
    const pngPath = path.join(ICONS_DIR, `${stem}.png`);
    const rendered = await sharp(fs.readFileSync(svgPath)).resize(size, size).png().toBuffer();
    const a = await sharp(rendered).raw().toBuffer();
    const b = await sharp(fs.readFileSync(pngPath)).raw().toBuffer();
    assert.strictEqual(a.length, b.length, `${stem}: channel count differs`);
    for (let i = 0; i < a.length; i++) {
      assert.strictEqual(a[i], b[i], `${stem}.png is not a pixel-exact render of ${stem}.svg at byte ${i}`);
    }
    checks++;
  }
  console.log(`  ✓ ${sizes.length} PNGs are pixel-exact renders of their SVGs`);

  // 2. Regenerating is a no-op.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'an5brand-'));
  try {
    await generate({ outDir: tmp, quiet: true });
    const committed = listFiles(ICONS_DIR);
    const fresh = listFiles(tmp);
    assert.deepStrictEqual(fresh, committed, `file list differs: ${fresh} vs ${committed}`);
    for (const file of committed) {
      const a = fs.readFileSync(path.join(ICONS_DIR, file));
      const b = fs.readFileSync(path.join(tmp, file));
      assert.ok(a.equals(b), `${file} is stale; re-run npm run generate:icons`);
    }
    checks++;
    console.log(`  ✓ Regenerating ${committed.length} files yields byte-identical output`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  // 3. Wordmark placement matches the tokens.
  const svgPath = path.join(ICONS_DIR, `${tokens.icons.wordmarkFile.replace(/\{size\}/g, tokens.icons.defaultSize)}.svg`);
  const box = await inkBox(fs.readFileSync(svgPath, 'utf8'));
  const cap = box.y1 - box.y0;
  const centre = (box.x0 + box.x1) / 2;
  const capTol = 0.3;
  const centreTol = 0.3;
  assert.ok(Math.abs(cap - tokens.wordmark.capHeight) <= capTol,
    `cap height ${cap.toFixed(2)} is not ${tokens.wordmark.capHeight} (+/-${capTol})`);
  assert.ok(Math.abs(box.y1 - tokens.wordmark.baseline) <= capTol,
    `baseline ${box.y1.toFixed(2)} is not ${tokens.wordmark.baseline} (+/-${capTol})`);
  assert.ok(Math.abs(centre - tokens.wordmark.centerX) <= centreTol,
    `centre ${centre.toFixed(2)} is not ${tokens.wordmark.centerX} (+/-${centreTol})`);
  console.log(`  ✓ Wordmark ink: cap ${cap.toFixed(2)}, baseline ${box.y1.toFixed(2)}, centre ${centre.toFixed(2)}`);

  console.log(`\n✅ ${checks} icon checks passed`);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});