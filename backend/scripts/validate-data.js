import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCategories, getProducts, getConcerns, getConcernBySlug } from '../services/firestoreService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sanity-checks the knowledge base before it ships: raw product rows are well-formed, and every
// sub-concern's "we recommend X" sentence resolves to a real product. Recommendation matching is
// spelling-exact (see findMentionedProducts), so a typo in concerns_messages.json silently renders
// "No products found" in the widget — this script surfaces those as errors instead.
async function validateData() {
  console.log('--- BIXA Product Finder Data Validation ---');
  const errors = [];
  const warnings = [];

  const jsonPath = path.resolve(__dirname, '../../knowledge_base/products_with_images.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ products_with_images.json not found at:', jsonPath);
    process.exit(1);
  }

  const rawProducts = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`✅ Loaded ${rawProducts.length} raw rows from products_with_images.json`);

  rawProducts.forEach((p, i) => {
    const label = `Row ${i + 1} (${p.product || 'unnamed'})`;
    if (!p.product) errors.push(`${label}: missing "product" name`);
    if (!p.category) warnings.push(`${label}: missing "category" (falls back to General Wellness)`);
    if (!p.image_url) warnings.push(`${label}: missing "image_url" (placeholder image shown)`);
    if (!p.buy_link) errors.push(`${label}: missing "buy_link"`);
    else if (!/^https:\/\/(www\.)?bixabotanical\.in\//.test(p.buy_link)) errors.push(`${label}: buy_link is not a bixabotanical.in URL: ${p.buy_link}`);
    if (!p.variant_id) warnings.push(`${label}: missing "variant_id" (Buy Now falls back to the product page)`);
    else if (!/^\d+$/.test(String(p.variant_id))) errors.push(`${label}: variant_id is not numeric: ${p.variant_id}`);
  });

  const categories = await getCategories();
  console.log('✅ Categories:', categories.map(c => `${c.label}: ${c.count}`).join(', '));

  const allProducts = await getProducts({ limit: 10000 });
  console.log(`✅ Unique products served: ${allProducts.length}`);

  const concerns = await getConcerns({});
  let structured = 0;
  let checkedSections = 0;
  for (const concern of concerns) {
    const detail = await getConcernBySlug(concern.slug);
    if (!detail?.sections?.length) continue;
    structured++;
    detail.sections.forEach(section => {
      if (!/we recommend/i.test(section.body)) return;
      checkedSections++;
      if (section.products.length === 0) {
        const named = (section.body.match(/we recommend\s+([^\n.]+)/i) || [])[1];
        errors.push(`${concern.name} → "${section.title}": no product matches "${named?.trim()}" (check spelling against products_with_images.json)`);
      }
    });
  }
  console.log(`✅ Concerns: ${concerns.length} (${structured} with sub-concern copy, ${concerns.length - structured} placeholder/generic)`);
  console.log(`✅ Checked ${checkedSections} sub-concern recommendations`);

  if (warnings.length) {
    console.log(`\n⚠️  ${warnings.length} warning(s):`);
    warnings.forEach(w => console.log(`   - ${w}`));
  }
  if (errors.length) {
    console.log(`\n❌ ${errors.length} error(s):`);
    errors.forEach(e => console.log(`   - ${e}`));
    process.exit(1);
  }

  console.log('\n--- Data Validation Passed ---');
}

validateData();
