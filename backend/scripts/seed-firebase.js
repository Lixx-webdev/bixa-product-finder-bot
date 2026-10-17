import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getProducts, getConcerns, getCategories } from '../services/firestoreService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedData() {
  console.log('--- BIXA Product Finder Data Validation & Seeding ---');

  const kbDir = path.resolve(__dirname, '../../knowledge_base');
  const jsonPath = path.join(kbDir, 'products_with_images.json');

  if (!fs.existsSync(jsonPath)) {
    console.error('Error: products_with_images.json not found at:', jsonPath);
    process.exit(1);
  }

  const rawProducts = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`✅ Loaded ${rawProducts.length} raw products from knowledge base JSON.`);

  // Test service queries
  const categories = await getCategories();
  console.log('✅ Categories computed:', categories.map(c => `${c.label}: ${c.count}`));

  const allProducts = await getProducts({});
  console.log(`✅ Total active products loaded in service: ${allProducts.length}`);

  const sampleHerbs = await getProducts({ category: 'HERBS', limit: 5 });
  console.log(`✅ Sample HERBS category count: ${sampleHerbs.length} (Sample: ${sampleHerbs[0]?.name})`);

  const sampleConcerns = await getConcerns({});
  console.log(`✅ Total health concerns loaded in service: ${sampleConcerns.length}`);

  console.log('--- Data Validation Completed Successfully! ---');
}

seedData();
