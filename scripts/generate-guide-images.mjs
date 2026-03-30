import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const API_KEY = process.env.OPENAI_API_KEY;
const OUT_DIR = fileURLToPath(new URL('../public/assets/images', import.meta.url));

const images = [
  {
    filename: 'cum-alegi-cel-mai-bun-televizor-4k-ghid-complet-2026.webp',
    prompt: 'A modern living room with a large wall-mounted 4K television showing a vibrant nature documentary. Comfortable sofa in front, warm ambient lighting, minimalist Scandinavian interior design. Professional interior photography, editorial quality, warm natural tones.',
  },
  {
    filename: 'diferenta-led-qled-oled-miniled-televizor-4k-comparatie.webp',
    prompt: 'Close-up comparison of four TV display panels side by side showing the same colorful image - demonstrating different display technologies. Clean studio environment, professional product photography showing visible differences in contrast and color vibrancy between screens. Technical editorial style.',
  },
  {
    filename: 'ce-diagonala-televizor-4k-distanta-vizionare-55-65-75-inch.webp',
    prompt: 'A person sitting on a sofa at optimal viewing distance from a large 65-inch 4K television in a well-designed living room. Visual indication of the viewing distance. Clean modern interior, natural lighting from windows. Editorial lifestyle photography style.',
  },
  {
    filename: 'televizor-4k-gaming-ps5-xbox-hdmi-2-1-120hz.webp',
    prompt: 'A modern gaming setup with a large 4K television displaying a video game, PlayStation 5 console visible on the media unit, wireless controller on the couch. RGB ambient lighting, dark but stylish room. Professional gaming lifestyle photography.',
  },
  {
    filename: 'montaj-televizor-4k-pe-perete-living-modern.webp',
    prompt: 'A professional installing a large flat screen TV on a living room wall with a wall mount bracket. Clean white wall, tools visible, the TV being carefully positioned at eye level. Professional documentary photography style, bright and clean.',
  },
];

async function generateImage(prompt, filename) {
  console.log(`Generating: ${filename}`);
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-image-1', prompt, n: 1, size: '1536x1024', quality: 'high' }),
  });
  if (!res.ok) { console.error(`  FAIL: ${await res.text()}`); return; }
  const data = await res.json();
  const buffer = Buffer.from(data.data[0].b64_json, 'base64');
  const sharp = (await import('sharp')).default;
  await sharp(buffer).resize(1200, 600, { fit: 'cover' }).webp({ quality: 85 }).toFile(`${OUT_DIR}/${filename}`);
  console.log(`  OK`);
}

for (const img of images) { await generateImage(img.prompt, img.filename); }
console.log('Done!');
