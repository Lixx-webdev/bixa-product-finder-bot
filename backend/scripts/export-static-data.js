import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCategories, getConcerns, getConcernBySlug } from '../services/firestoreService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bakes the knowledge base into a static JSON file that the embeddable widget bundles, so the live
// site needs no running API. Uses the exact same service logic as the API (dedupe, classification,
// sub-concern parsing, recommended-product matching), so the widget sees identical data. The
// frontend's `npm run build` runs this first; run it manually after editing
// knowledge_base/products_with_images.json or backend/data/concerns_messages.json if using `npm run dev`.
const OUT_PATH = path.resolve(__dirname, '../../frontend/src/data/catalog.json');

async function exportStaticData() {
  const concerns = await getConcerns({});
  const concernDetails = {};
  for (const concern of concerns) {
    concernDetails[concern.slug] = await getConcernBySlug(concern.slug);
  }

  // Each product object is stored once in `products` and referenced by id everywhere else (concern
  // products, sub-concern products) to keep the bundle small; the widget's catalog client
  // re-expands the ids back into full objects.
  const products = {};
  const ref = (list) => list.map(p => { products[p.id] = p; return p.id; });

  const catalog = {
    generatedAt: new Date().toISOString(),
    categories: await getCategories(),
    products,
    concerns,
    concernDetails: Object.fromEntries(Object.entries(concernDetails).map(([slug, d]) => [slug, d && {
      ...d,
      products: ref(d.products || []),
      sections: (d.sections || []).map(s => ({ ...s, products: ref(s.products || []) }))
    }]))
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(catalog));

  console.log(`✅ Wrote ${path.relative(process.cwd(), OUT_PATH)} (${(fs.statSync(OUT_PATH).size / 1024).toFixed(0)} KB)`);
  console.log(`   Products: ${Object.keys(products).length}; concerns: ${concerns.length}`);
}

exportStaticData();
