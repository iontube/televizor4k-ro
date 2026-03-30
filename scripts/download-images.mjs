import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT_DIR = fileURLToPath(new URL('../public/assets/images/products', import.meta.url));
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const products = [
  { slug: 'samsung-qled-43q7f2', url: 'https://www.emag.ro/televizor-samsung-qled-43q7f2-108-cm-smart-4k-ultra-hd-clasa-g-model-2025-qe43q7f2auxxh/pd/D03GRT3BM/' },
  { slug: 'lg-qned-43qned70a6a', url: 'https://www.emag.ro/televizor-lg-qned-108-cm-smart-4k-ultra-hd-clasa-g-model-2025-43qned70a6a/pd/D863VJ3BM/' },
  { slug: 'tcl-led-55p6k', url: 'https://www.emag.ro/televizor-tcl-led-139-cm-smart-google-tv-4k-ultra-hd-clasa-e-model-2025-55p6k/pd/DJCFMB3BM/' },
  { slug: 'qled-star-light-55dm8600', url: 'https://www.emag.ro/televizor-qled-star-light-139-cm-smart-4k-ultra-hd-clasa-e-model-2025-55dm8600/pd/DMND643BM/' },
  { slug: 'metz-qled-43mqe7600', url: 'https://www.emag.ro/televizor-metz-qled-43mqe7600-109-cm-smart-google-tv-4k-ultra-hd-clasa-f-43mqe7600z/pd/DP2HH5YBM/' },
  { slug: 'diamant-by-horizon-55hl5530u-c', url: 'https://www.emag.ro/televizor-led-diamant-by-horizon-139-cm-smart-4k-ultra-hd-clasa-e-55hl5530u-c/pd/DXMBH4YBM/' },
  { slug: 'horizon-qled-65hq8590u-d', url: 'https://www.emag.ro/televizor-horizon-qled-164-cm-smart-google-tv-4k-ultra-hd-clasa-f-model-2024-65hq8590u-d/pd/DV420CYBM/' },
  { slug: 'tcl-qd-miniled-55c6k', url: 'https://www.emag.ro/televizor-tcl-qd-miniled-139-cm-smart-google-tv-4k-ultra-hd-100hz-clasa-f-model-2025-55c6k/pd/DF4FMB3BM/' },
  { slug: 'lg-led-65ua74003lb', url: 'https://www.emag.ro/televizor-lg-led-164-cm-smart-4k-ultra-hd-clasa-f-model-2025-65ua74003lb/pd/D163VJ3BM/' },
  { slug: 'jvc-qled-65vdq3500', url: 'https://www.emag.ro/televizor-jvc-qled-65vdq3500-164-cm-smart-4k-ultra-hd-clasa-e-lt-65vdq3500/pd/DDJL7Z3BM/' },
  { slug: 'samsung-led-65u8092', url: 'https://www.emag.ro/televizor-samsung-led-65u8092-163-cm-smart-4k-ultra-hd-clasa-g-model-2025-ue65u8092fuxxh/pd/DP3GRT3BM/' },
  { slug: 'sony-bravia-3-led-50s35', url: 'https://www.emag.ro/televizor-sony-bravia-3-led-50s35-126-cm-smart-google-tv-4k-ultra-hd-clasa-e-model-2025-k50s35b-cei/pd/D3527K3BM/' },
  { slug: 'sony-bravia-3-led-85s35', url: 'https://www.emag.ro/televizor-sony-bravia-3-led-85s35-215-cm-smart-google-tv-4k-ultra-hd-clasa-e-model-2025-k85s35bp-cei/pd/D4527K3BM/' },
  { slug: 'samsung-oled-65s85f', url: 'https://www.emag.ro/televizor-samsung-oled-65s85f-163-cm-smart-4k-ultra-hd-100-hz-clasa-f-model-2025-qe65s85faexxh/pd/D52GRT3BM/' },
  { slug: 'lg-oled-evo-65c52la', url: 'https://www.emag.ro/televizor-lg-oled-evo-65c52la-164-cm-smart-4k-ultra-hd-100-hz-clasa-f-model-2025-oled65c52la/pd/DJMLL73BM/' },
  { slug: 'philips-ambilight-qled-75pus8510', url: 'https://www.emag.ro/televizor-philips-ambilight-tv-qled-75pus8510-189-cm-smart-tv-4k-ultra-hd-clasa-e-model-2025-75pus8510-12/pd/DW692N3BM/' },
  { slug: 'xiaomi-qled-max', url: 'https://www.emag.ro/televizor-xiaomi-qled-max-252-cm-smart-google-tv-4k-ultra-hd-100-hz-clasa-g-model-2025-ela5692eu/pd/D2YBW8YBM/' },
  { slug: 'tcl-qd-miniled-115c7k', url: 'https://www.emag.ro/televizor-tcl-qd-miniled-291-cm-smart-google-tv-4k-ultra-hd-100hz-clasa-e-model-2025-115c7k/pd/DX4FMB3BM/' },
];

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function getImageUrl(pageUrl) {
  const res = await fetch(pageUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', 'Accept': 'text/html', 'Accept-Language': 'ro-RO,ro;q=0.9' },
  });
  const html = await res.text();
  const ogMatch = html.match(/property="og:image"\s+content="([^"]+)"/);
  if (ogMatch) return ogMatch[1];
  return null;
}

async function downloadImage(url, slug) {
  const outPath = `${OUT_DIR}/${slug}.webp`;
  if (existsSync(outPath)) { console.log('  SKIP (exists)'); return; }
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const sharp = (await import('sharp')).default;
    await sharp(buffer).resize(500, 500, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).webp({ quality: 85 }).toFile(outPath);
    console.log('  OK');
  } catch (e) { console.log('  FAIL: ' + e.message); }
}

console.log(`Downloading ${products.length} images...\n`);
for (const p of products) {
  console.log(p.slug + ':');
  const imgUrl = await getImageUrl(p.url);
  if (imgUrl) await downloadImage(imgUrl, p.slug);
  else console.log('  NO IMAGE');
  await delay(2000 + Math.random() * 3000);
}
console.log('\nDone!');
