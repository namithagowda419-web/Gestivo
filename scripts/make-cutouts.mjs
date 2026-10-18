import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateCutouts() {
  console.log('[Cutout Generator] Processing mascot cutouts in public/assets...');

  // 1. Process kids-pets.jpeg -> kids-pets.png
  console.log('  1. Creating kids-pets.png (black background cutout)...');
  const kpObj = await sharp('public/assets/kids-pets.jpeg')
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const kpData = kpObj.data;
  for (let i = 0; i < kpData.length; i += 4) {
    const r = kpData[i];
    const g = kpData[i + 1];
    const b = kpData[i + 2];
    const maxVal = Math.max(r, g, b);
    if (maxVal < 18) {
      kpData[i + 3] = 0;
    } else if (maxVal < 36) {
      kpData[i + 3] = Math.round(((maxVal - 18) / 18) * 255);
    }
  }

  await sharp(kpData, {
    raw: {
      width: kpObj.info.width,
      height: kpObj.info.height,
      channels: 4
    }
  })
  .png({ compressionLevel: 8 })
  .toFile('public/assets/kids-pets.png');
  console.log('  -> kids-pets.png generated successfully.');

  // 2. Process pink-cat.jpeg -> pink-cat.png
  console.log('  2. Creating pink-cat.png (white background cutout)...');
  const pcObj = await sharp('public/assets/pink-cat.jpeg')
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pcData = pcObj.data;
  for (let i = 0; i < pcData.length; i += 4) {
    const r = pcData[i];
    const g = pcData[i + 1];
    const b = pcData[i + 2];
    const minVal = Math.min(r, g, b);
    if (minVal > 248) {
      pcData[i + 3] = 0;
    } else if (minVal > 235) {
      pcData[i + 3] = Math.round(((248 - minVal) / 13) * 255);
    }
  }

  await sharp(pcData, {
    raw: {
      width: pcObj.info.width,
      height: pcObj.info.height,
      channels: 4
    }
  })
  .png({ compressionLevel: 8 })
  .toFile('public/assets/pink-cat.png');
  console.log('  -> pink-cat.png generated successfully.');

  // 3. Process girl-bunny.jpeg -> girl-bunny.png
  // The girl is centered with bunny, books and pencils.
  // We produce a clean high-res circular/pill vignette avatar png that clips the outer checkerboard.
  console.log('  3. Creating girl-bunny.png (cropped portrait with rounded aesthetic)...');
  const gbMeta = await sharp('public/assets/girl-bunny.jpeg').metadata();
  const width = gbMeta.width || 1374;
  const height = gbMeta.height || 1145;

  // Create an SVG mask for circular/blob avatar frame
  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2 + 10);
  const rx = Math.round(width * 0.42);
  const ry = Math.round(height * 0.46);

  const maskSvg = Buffer.from(
    `<svg width="${width}" height="${height}">
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#ffffff" />
    </svg>`
  );

  const maskBuffer = await sharp(maskSvg).toBuffer();

  await sharp('public/assets/girl-bunny.jpeg')
    .composite([{ input: maskBuffer, blend: 'dest-in' }])
    .png({ compressionLevel: 8 })
    .toFile('public/assets/girl-bunny.png');
  console.log('  -> girl-bunny.png generated successfully.');

  console.log('[Cutout Generator] All 3 PNG cutouts generated in public/assets/');
}

generateCutouts().catch(err => {
  console.error('Cutout generation error:', err);
  process.exit(1);
});
