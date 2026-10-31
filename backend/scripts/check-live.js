import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The live website is the source of truth for what the widget says. This compares the widget's
// concern names and recommended products with bixabotanical.in, and exits 1 on any difference.
const STORE = 'https://bixabotanical.in';
const HEADERS = { 'User-Agent': 'Mozilla/5.0' };
const readJson = (p) => JSON.parse(fs.readFileSync(path.resolve(__dirname, p), 'utf8'));
const clean = (s) => s.replace(/\s+/g, ' ').trim();

const liveConcerns = async () => {
  const html = await (await fetch(STORE, { headers: HEADERS })).text();
  const start = html.indexOf('Shop By Wellness');
  if (start < 0) throw new Error('"Shop By Wellness" menu not found on the homepage');
  const names = [];
  for (const m of html.slice(start, start + 20000).matchAll(/<a[^>]*href="\/collections\/([a-z0-9-]+)"[^>]*>\s*(?:<[^>]+>\s*)*([^<]+)</g)) {
    const name = clean(m[2]);
    if (!/wellness$/i.test(name)) break;
    if (!names.includes(name)) names.push(name);
  }
  return names;
};

const liveProducts = async () => {
  const products = [];
  for (let page = 1; ; page++) {
    const { products: batch } = await (await fetch(`${STORE}/products.json?limit=250&page=${page}`, { headers: HEADERS })).json();
    if (!batch.length) return products;
    products.push(...batch);
  }
};

const run = async () => {
  const errors = [];

  const website = await liveConcerns();
  const widget = readJson('../data/live_concerns.json');
  website.filter((n) => !widget.includes(n)).forEach((n) => errors.push(`Concern on the website but not in the widget: "${n}"`));
  widget.filter((n) => !website.includes(n)).forEach((n) => errors.push(`Concern in the widget but not on the website: "${n}"`));
  console.log(`Concerns: website ${website.length}, widget ${widget.length}`);

  const catalog = readJson('../../frontend/src/data/catalog.json');
  const byVariant = new Map();
  (await liveProducts()).forEach((p) => p.variants.forEach((v) => byVariant.set(String(v.id), p)));
  const recommended = Object.values(catalog.products);
  recommended.forEach((p) => {
    const live = byVariant.get(String(p.variantId));
    if (!live) errors.push(`Product not found on the website: "${p.name}" (variant ${p.variantId})`);
    else if (clean(live.title) !== clean(p.name)) errors.push(`Product name differs: widget "${clean(p.name)}", website "${clean(live.title)}"`);
  });
  console.log(`Recommended products checked: ${recommended.length}`);

  if (errors.length) {
    console.error(`\n${errors.length} difference(s) from the live website:`);
    errors.forEach((e) => console.error(` - ${e}`));
    process.exit(1);
  }
  console.log('Widget matches the live website.');
};

run().catch((err) => {
  console.error('Live check failed:', err.message);
  process.exit(1);
});
