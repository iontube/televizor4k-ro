// Generate the 4K-TV recommendations dataset from OUR 2Performant catalog (pretulverde.db).
// Output: src/data/recomandari.json — per-product: slug, name, brand, price, oldPrice, merchant,
// img (img.televizor4k.ro neutral host -> shared pool), affiliate (2P deeplink), parsed specs, and
// UNIQUE generated SEO prose (intro/guide/faq) so each product page is rich, not thin.
// Re-run nightly after the catalog rebuild -> products entering/leaving the feed are reflected.
import Database from '/sites/pretulverde.ro/node_modules/better-sqlite3/lib/index.js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DB = '/sites/pretulverde.ro/pretulverde.db';
const CAMPAIGN = JSON.parse(readFileSync('/sites/pretulverde.ro/_data/campaign.json', 'utf8'));
const AFF = '2ace29e87';
const IMG_HOST = 'https://img.televizor4k.ro';
const OUT = fileURLToPath(new URL('../src/data/recomandari.json', import.meta.url));

const db = new Database(DB, { readonly: true });
const rows = db.prepare(`SELECT id, slug, title, price, oldPrice, brand, brandSlug, merchant, merchantSlug, img, descr
  FROM products WHERE lower(title) LIKE '%televizor%'
  AND (lower(title) LIKE '%4k%' OR lower(title) LIKE '%uhd%' OR lower(title) LIKE '%ultra hd%')
  AND lower(title) NOT LIKE '%hd ready%' AND lower(title) NOT LIKE '%full hd%'
  AND lower(title) NOT LIKE '%cablu%' AND lower(title) NOT LIKE '%suport%' AND lower(title) NOT LIKE '%telecomand%'
  AND lower(title) NOT LIKE '%adaptor%' AND lower(title) NOT LIKE '%montaj%' AND lower(title) NOT LIKE '%comod%'
  AND lower(title) NOT LIKE '%mobil%' AND lower(title) NOT LIKE '%fotoliu%' AND lower(title) NOT LIKE '%ram_ tv%'
  AND price >= 500
  AND img IS NOT NULL AND img <> '' ORDER BY price DESC`).all();

// ---- helpers ----
const esc = (s) => String(s || '');
const money = (n) => Number(n).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' lei';
const sl = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 70).replace(/^-+|-+$/g, '');
const seedOf = (s) => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

// img: pool path /i/<ab>/<cd>/<hash>.webp -> neutral host /<keyword>-<hash>.webp
function imgUrl(poolImg, name) {
  const m = /([0-9a-f]{16})\.webp$/.exec(poolImg || '');
  if (!m) return '';
  return `${IMG_HOST}/${sl(name).slice(0, 55).replace(/-+$/, '')}-${m[1]}.webp`;
}

// parse TV specs from title + descr
function parseSpecs(t, descr, brand) {
  const s = (t + ' ' + (descr || '')).toLowerCase();
  let panel = 'LED';
  if (/mini ?led|qd-?miniled/.test(s)) panel = 'Mini LED';
  else if (/\boled\b/.test(s)) panel = 'OLED';
  else if (/\bqned\b/.test(s)) panel = 'QNED';
  else if (/\bqled\b/.test(s)) panel = 'QLED';
  else if (/\bnanocell|nano cell\b/.test(s)) panel = 'NanoCell';
  // diagonal: cm or inch
  let cm = null, inch = null;
  let mcm = t.match(/(\d{2,3})\s*cm/i); if (mcm) cm = +mcm[1];
  let min = t.match(/(\d{2,3})\s*(?:inch|"|''|inchi)/i); if (min) inch = +min[1];
  if (cm && !inch) inch = Math.round(cm / 2.54);
  if (inch && !cm) cm = Math.round(inch * 2.54);
  // smart platform
  let smart = '';
  if (/tizen/.test(s)) smart = 'Tizen (Samsung)';
  else if (/webos|web os/.test(s)) smart = 'webOS (LG)';
  else if (/google ?tv/.test(s)) smart = 'Google TV';
  else if (/android ?tv/.test(s)) smart = 'Android TV';
  else if (/smart/.test(s)) smart = 'Smart TV';
  const hdr = /hdr10\+|dolby vision|hdr/.test(s);
  const gaming = /120 ?hz|144 ?hz|hdmi 2\.1|gaming/.test(s);
  return { brand: brand || '', panel, inch, cm, smart, rezolutie: '4K Ultra HD', hdr, gaming };
}

// sizeClass for grouping
function sizeBand(inch) {
  if (!inch) return 'alte';
  if (inch <= 43) return 'mic';        // <=43"
  if (inch <= 55) return 'mediu';      // 50-55"
  if (inch <= 65) return 'mare';       // 58-65"
  return 'xl';                          // 70"+
}

// ---- unique SEO prose ----
function genProse(p, specs) {
  const r = rng(seedOf(p.slug));
  const b = specs.brand || 'acest producător';
  const sz = specs.inch ? `${specs.inch} inch (${specs.cm} cm)` : 'diagonala sa';
  const panelTxt = {
    'OLED': 'panou OLED cu pixeli autoiluminați, negru perfect și contrast infinit',
    'Mini LED': 'retroiluminare Mini LED cu mii de zone de local dimming pentru un contrast ridicat',
    'QLED': 'tehnologie QLED cu puncte cuantice (Quantum Dot) pentru culori vii și luminozitate mare',
    'QNED': 'panou QNED care combină Quantum Dot cu Mini LED pentru culori precise și negruri adânci',
    'NanoCell': 'tehnologie NanoCell pentru culori pure și unghiuri largi de vizionare',
    'LED': 'panou LED 4K cu procesare a imaginii pentru claritate bună la un preț accesibil',
  }[specs.panel] || 'panou 4K modern';
  const sizeAdvice = specs.inch
    ? (specs.inch <= 43 ? 'Diagonala compactă îl face potrivit pentru dormitor, bucătărie sau o cameră mică, de la o distanță de vizionare de 1,5–2 metri.'
      : specs.inch <= 55 ? 'Este diagonala cea mai populară pentru living-uri medii, ideală de la circa 2–2,5 metri distanță.'
      : specs.inch <= 65 ? 'O diagonală generoasă pentru living-uri spațioase, recomandată de la 2,5–3,5 metri pentru un efect imersiv.'
      : 'O diagonală foarte mare, gândită pentru living-uri ample și o experiență cinematografică, de la 3,5 metri în sus.')
    : 'Alege diagonala în funcție de distanța de vizionare din camera ta.';
  const intro = [
    `${esc(p.title)} este un televizor 4K de la ${b}, disponibil acum la ${money(p.price)}${p.oldPrice > p.price ? ` (redus de la ${money(p.oldPrice)})` : ''} prin ${esc(p.merchant)}. Folosește ${panelTxt}, la o rezoluție 4K Ultra HD care oferă de patru ori mai mulți pixeli decât un televizor Full HD.`,
    `Dacă te uiți după un televizor 4K ${specs.panel} echilibrat, ${esc(p.title)} merită pe lista scurtă. Vine cu ${panelTxt} și se găsește la ${money(p.price)} la ${esc(p.merchant)}, ${pick(r, ['o ofertă bună pentru specificațiile sale', 'un preț competitiv în segmentul său', 'un raport bun calitate-preț'])}.`,
  ];
  const guide = [
    `${sizeAdvice} La ${sz}, ${specs.panel === 'OLED' || specs.panel === 'Mini LED' ? 'panoul premium se vede cel mai bine în camere unde poți controla lumina, dar se descurcă și în living-uri luminoase' : 'imaginea 4K rămâne clară chiar și de aproape, datorită densității mari de pixeli'}.`,
    `${specs.smart ? `Partea de smart rulează pe ${specs.smart}, cu acces la aplicațiile de streaming populare (Netflix, YouTube, Prime Video, Disney+) direct din telecomandă.` : 'Televizorul include funcții smart pentru aplicații de streaming.'}${specs.hdr ? ' Suportă HDR, deci filmele și serialele compatibile beneficiază de un contrast și o gamă de culori mai bune.' : ''}${specs.gaming ? ' Pentru gaming, are caracteristici prietenoase cu consolele actuale (rată de refresh ridicată / HDMI 2.1), utile pentru PS5, Xbox Series X sau PC.' : ''}`,
  ];
  const faq = [
    { q: `Cât costă ${esc(p.title)}?`, a: `${esc(p.title)} costă ${money(p.price)} la ${esc(p.merchant)}${p.oldPrice > p.price ? `, redus de la ${money(p.oldPrice)}` : ''}. Prețul este actualizat periodic.` },
    { q: `Ce diagonală are?`, a: specs.inch ? `Are o diagonală de ${specs.inch} inch (${specs.cm} cm). ${sizeAdvice}` : `Verifică diagonala în secțiunea de specificații de mai sus.` },
    { q: `Ce tip de panou folosește?`, a: `Folosește ${panelTxt}, la rezoluție 4K Ultra HD.` },
    { q: `De unde îl pot cumpăra?`, a: `Îl găsești la ${esc(p.merchant)}, prin TeleVizor4K.ro — îți arătăm prețul curent și te ducem direct la ofertă.` },
  ];
  return { intro: pick(r, [intro[0], intro[1]]), guide, faq };
}

// ---- honest "modified" date: per-product content-hash ledger (persisted on the server, gitignored).
// A product's modified date only advances when its actual content (price/specs/name/img) changes -> we
// never tell Google a page was updated when it wasn't (no freshness yo-yo). See feedback-lastmod-pattern.
const LEDGER = fileURLToPath(new URL('../.cache/modified-ledger.json', import.meta.url));
const oldLedger = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, 'utf8')) : {};
const newLedger = {};
const BUILD_DATE = new Date().toISOString().slice(0, 10);            // YYYY-MM-DD (date granularity, no intraday churn)

// ---- build dataset ----
const seen = new Set();
const products = [];
for (const p of rows) {
  const img = imgUrl(p.img, p.title);
  if (!img) continue;
  const cu = (CAMPAIGN[p.merchantSlug] || {}).c;
  if (!cu) continue;                                  // skip if no 2P campaign (deeplink wouldn't track)
  // STABLE slug: title + the product's unique 2P id (same `unique` used in the affiliate deeplink).
  // Guarantees each URL is permanently tied to one product, immune to feed enter/leave reordering.
  const idKey = String(p.id).toLowerCase().replace(/[^a-z0-9]/g, '');
  const base = sl(p.title).slice(0, 58).replace(/-+$/, '');
  let slug = (base ? base + '-' : 'tv-') + idKey;
  if (seen.has(slug)) { let k = 2; while (seen.has(slug + '-' + k)) k++; slug += '-' + k; }  // safety net only
  seen.add(slug);
  const specs = parseSpecs(p.title, p.descr, p.brand);
  const affiliate = `https://event.2performant.com/events/click?ad_type=product_store&aff_code=${AFF}&unique=${encodeURIComponent(p.id)}&campaign_unique=${cu}`;
  const prose = genProse(p, specs);
  const mSlug = (p.merchant || '').replace(/\/+$/, '').split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'magazin';
  const M_NAMES = { evomag: 'evoMAG', dwyn: 'Dwyn', ozone: 'Ozone', flanco: 'Flanco', vonmag: 'Vonmag' };
  const mName = M_NAMES[mSlug] || (mSlug.charAt(0).toUpperCase() + mSlug.slice(1));
  const brandSlug = specs.brand ? sl(specs.brand) : '';
  const band = sizeBand(specs.inch);
  // content hash over the user-visible, change-worthy fields only
  const chash = seedOf(`${p.price}|${p.oldPrice}|${p.title}|${img}|${JSON.stringify(specs)}`);
  const prev = oldLedger[p.id];
  const modified = (prev && prev.h === chash) ? prev.m : BUILD_DATE;   // keep old date if unchanged
  // ledger stores slug/brand/band so a product that LATER leaves the feed can 301 to a similar one
  newLedger[p.id] = { h: chash, m: modified, s: slug, b: brandSlug, z: band, d: BUILD_DATE };
  products.push({
    slug, id: p.id, name: p.title, brand: specs.brand, brandSlug, price: p.price, oldPrice: p.oldPrice > p.price ? p.oldPrice : null,
    merchant: p.merchant, merchantSlug: mSlug, merchantName: mName, img, affiliate, modified,
    band,
    specs: { Brand: specs.brand || '—', Diagonală: specs.inch ? `${specs.inch}" (${specs.cm} cm)` : '—', Panou: specs.panel, Rezoluție: specs.rezolutie, ...(specs.smart ? { 'Sistem smart': specs.smart } : {}), ...(specs.hdr ? { HDR: 'Da' } : {}), ...(specs.gaming ? { Gaming: 'Da (120Hz/HDMI 2.1)' } : {}) },
    prose,
  });
}

// ---- dropped products -> 301 to a similar surviving one (mirrors the pretulverde server: removed
// product redirects, never bare 404). Detect ids that WERE in the ledger but are gone now; keep the
// redirect alive for RETAIN_DAYS (tombstone), then prune so the list stays bounded.
const RETAIN_DAYS = 150;
const cutoff = new Date(new Date(BUILD_DATE + 'T00:00:00Z').getTime() - RETAIN_DAYS * 864e5).toISOString().slice(0, 10);
const byBrandBand = {};                                              // current products indexed for similarity
for (const p of products) (byBrandBand[`${p.brandSlug}|${p.band}`] ||= []).push(p);
const brandPages = new Set();
{ const bc = {}; for (const p of products) if (p.brandSlug) bc[p.brandSlug] = (bc[p.brandSlug] || 0) + 1; for (const b in bc) if (bc[b] >= 4) brandPages.add(b); }
const dropped = {};
for (const id of Object.keys(oldLedger)) {
  if (newLedger[id]) continue;                                      // still live
  const e = oldLedger[id];
  if (!e || !e.s) continue;
  if ((e.d || '0') < cutoff) continue;                             // expired tombstone -> prune (drop the redirect)
  const sim = byBrandBand[`${e.b}|${e.z}`];
  const target = (sim && sim.length) ? `/tv/${sim[0].slug}/` : (brandPages.has(e.b) ? `/brand/${e.b}/` : '/recomandari/');
  dropped[e.s] = target;
  newLedger[id] = e;                                                // carry tombstone forward (keeps redirect until pruned)
}

mkdirSync(fileURLToPath(new URL('../src/data', import.meta.url)), { recursive: true });
writeFileSync(OUT, JSON.stringify(products));
mkdirSync(fileURLToPath(new URL('../.cache', import.meta.url)), { recursive: true });
writeFileSync(LEDGER, JSON.stringify(newLedger));
writeFileSync(fileURLToPath(new URL('../.cache/dropped.json', import.meta.url)), JSON.stringify(dropped));
const changed = products.filter((p) => p.modified === BUILD_DATE).length;
console.log(`  modified-ledger: ${changed}/${products.length} dated today; ${Object.keys(dropped).length} dropped-product 301s active`);
// stats
const bands = {}; for (const p of products) bands[p.band] = (bands[p.band] || 0) + 1;
const brands = {}; for (const p of products) brands[p.brand] = (brands[p.brand] || 0) + 1;
console.log(`generated ${products.length} TV products -> ${OUT}`);
console.log('  by size band:', JSON.stringify(bands));
console.log('  top brands:', Object.entries(brands).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}:${v}`).join(', '));
