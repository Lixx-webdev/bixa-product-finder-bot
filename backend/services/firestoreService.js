import { db } from '../config/firebase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Flag to determine if Cloud Firestore is active & authenticated
const isCloudFirestoreEnabled = Boolean(
  db && (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) || process.env.FIRESTORE_EMULATOR_HOST)
);

console.log(`[BIXA Service] Data Engine Mode: ${isCloudFirestoreEnabled ? 'Live Cloud Firestore' : 'High-Speed Local Dataset (<5ms response time)'}`);

// Parse a pre-approved concern message into its numbered sub-topics (e.g. "1. Hair Fall & Thinning
// Support\n...body...\n2. Hair-Growth Support\n...") so each one can be shown as a distinct,
// selectable sub-concern instead of a single wall of text. Messages without at least two numbered
// headers are treated as unstructured and return no sections.
const parseConcernSections = (message, products = []) => {
  if (!message || typeof message !== 'string') return [];

  const headerRegex = /(?:^|\n)\s*(\d{1,2})\.\s*([^\n]+)/g;
  const headers = [];
  let match;
  while ((match = headerRegex.exec(message)) !== null) {
    headers.push({ start: match.index, end: headerRegex.lastIndex, title: match[2].trim() });
  }

  if (headers.length < 2) return [];

  return headers.map((h, i) => {
    const bodyEnd = i + 1 < headers.length ? headers[i + 1].start : message.length;
    const body = message.slice(h.end, bodyEnd).trim();
    const { summary, knowMore } = splitKnowMore(body);
    return {
      id: `section-${i + 1}`,
      title: h.title,
      body,
      summary,
      knowMore,
      products: findMentionedProducts(body, products)
    };
  });
};

// A sub-concern's body is authored with a standalone "Know More" line separating the short,
// always-shown summary (recommendation + Best for + disclaimer) from the longer explanatory
// content (Ayurvedic rationale + benefits list) that's only revealed on demand. Bodies without
// that marker (unstructured concerns) have no separate Know More content.
const splitKnowMore = (body) => {
  const marker = body.match(/\n\s*Know More\s*\n/i);
  if (!marker) return { summary: body, knowMore: null };
  return {
    summary: body.slice(0, marker.index).trim(),
    knowMore: body.slice(marker.index + marker[0].length).trim()
  };
};

// Strips format/anatomy words and botanical (parenthetical) names down to the herb's own identity,
// e.g. "Karela Fruit Powder ( Momordica Charantian )" -> "karela", so the same herb sold as both a
// powder and a capsule product can be recognised as "the same product" regardless of which format a
// concern's text happens to name.
const herbKey = (name) => name
  .split('|')[0]
  .replace(/\(.*?\)/g, '')
  .replace(/dry extract.*$/i, '')
  .replace(/extract.*$/i, '')
  .replace(/\d+\s*(mg|g|kg|%|veg capsules|capsules|caps)\b.*$/i, '')
  .replace(/\b(root|leaf|leaves|herb|seed|fruit|bark|whole|resin)\b/gi, '')
  .replace(/\b(powder|capsules|capsule)\b/gi, '')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

// A sub-concern's body explicitly names the product(s) it recommends, e.g. "...we recommend Bixa
// botanical Rosemary Essential Oil and Bixa botanical Bhringraj Powder." — pull those names out and
// match them to real products so each sub-concern only shows the products it actually mentions,
// instead of every product under the parent concern's category. When the matched product's herb is
// also sold in another format (e.g. Powder + Capsules), that sibling product is included too, so
// shoppers see every way they can buy the recommended herb.
const findMentionedProducts = (sectionText, products) => {
  // The recommend sentence always sits on its own line — stop at the line break (or a period,
  // whichever comes first) rather than scanning ahead into the next paragraph, since some of
  // these sentences aren't period-terminated before the blank line.
  const recommendMatch = sectionText.match(/we recommend\s+([^\n.]+)/i);
  if (!recommendMatch) return [];

  const mentionedNames = recommendMatch[1]
    .replace(/bixa\s*botanical/gi, '')
    .replace(/\bbixa\b/gi, '')
    .split(/,|\band\b/i)
    .map(s => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const baseName = (name) => name.split(/[|(]/)[0].toLowerCase().replace(/\s+/g, ' ').trim();
  const tokens = (s) => s.split(/\s+/).filter(Boolean);

  const matched = [];
  const seenIds = new Set();
  const addProduct = (p) => {
    if (p && !seenIds.has(p.id)) {
      seenIds.add(p.id);
      matched.push(p);
    }
  };

  mentionedNames.forEach(mentioned => {
    const norm = mentioned.toLowerCase();
    const mentionedTokens = tokens(norm);
    const found = products.find(p => baseName(p.name) === norm)
      || products.find(p => { const b = baseName(p.name); return b.startsWith(norm) || norm.startsWith(b); })
      // e.g. mention "Amla Powder" should match product "Amla Fruit Powder (...)" — all mentioned
      // words present in the product's base name, regardless of extra words or order.
      || products.find(p => { const b = baseName(p.name); return mentionedTokens.every(t => b.includes(t)); })
      || products.find(p => p.name.toLowerCase().includes(norm));

    if (!found) return;
    addProduct(found);

    // Pull in same-herb siblings sold under a different format (Powder <-> Capsule) so both
    // options appear together under Recommended Products.
    const key = herbKey(found.name);
    if (key) {
      products
        .filter(p => p.id !== found.id && p.format && found.format && p.format !== found.format && herbKey(p.name) === key)
        .forEach(addProduct);
    }
  });

  return matched;
};

// Local memory store for instant <5ms responses
let localStore = {
  products: [],
  concerns: [],
  productConcerns: [],
  analyticsEvents: []
};

// Helper to load seed JSON files into local memory store
const loadLocalFallbackData = () => {
  try {
    const kbDir = path.resolve(__dirname, '../../knowledge_base');
    const jsonPath = path.join(kbDir, 'products_with_images.json');
    const messagesPath = path.resolve(__dirname, '../data/concerns_messages.json');
    
    let approvedMessages = {};
    if (fs.existsSync(messagesPath)) {
      approvedMessages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
    }

    if (fs.existsSync(jsonPath)) {
      const allRawProducts = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

      // The knowledge base lists each product twice (an "About" row with the
      // description and a "Pricing & Available Sizes" row) — keep one row per
      // product, preferring the "About" row for its richer text.
      const dedupedByName = new Map();
      allRawProducts.forEach(p => {
        const name = (p.product || p.section || '').trim();
        const existing = dedupedByName.get(name);
        if (!existing || (p.section && p.section.toLowerCase() === 'about')) {
          dedupedByName.set(name, p);
        }
      });
      const rawProducts = Array.from(dedupedByName.values());

      localStore.products = rawProducts.map((p, index) => {
        const name = (p.product || p.section || `Product ${index + 1}`).trim();
        const rawCategory = (p.category || 'General Wellness').trim();
        
        let specCategory = 'HERBS';
        if (p.section && p.section.toLowerCase().includes('formulation')) specCategory = 'FORMULATIONS';
        else if (p.section && p.section.toLowerCase().includes('combo')) specCategory = 'COMBOS';
        else if (name.toLowerCase().includes('combo') || name.toLowerCase().includes('pack')) specCategory = 'COMBOS';

        const rawFormat = (p.format || '').trim().toUpperCase();
        let format = null;
        if (rawFormat === 'POWDER') format = 'POWDER';
        else if (rawFormat === 'CAPSULE') format = 'CAPSULE';
        else if (rawFormat) format = 'OTHER';

        return {
          id: `prod_${index + 1}`,
          name: name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          category: specCategory,
          format,
          productType: rawCategory,
          imageUrl: p.image_url || 'https://bixabotanical.in/cdn/shop/files/placeholder.jpg',
          productUrl: p.buy_link || 'https://bixabotanical.in',
          // Direct-to-checkout cart permalink for the product's default variant (Shopify's
          // `/cart/{variantId}:1` pattern) — used by "Buy Now" so it skips the product page
          // entirely. Falls back to productUrl on the frontend if a product has no variant_id yet.
          checkoutUrl: p.variant_id ? `https://bixabotanical.in/cart/${p.variant_id}:1` : null,
          price: p.price || '₹299',
          active: true,
          sortName: name.toLowerCase().replace(/^bixa\s+botanical\s+/i, '').trim(),
          keywords: [name.toLowerCase(), rawCategory.toLowerCase(), specCategory.toLowerCase()],
          description: p.text || ''
        };
      });

      // Group concerns and attach pre-approved messages
      const concernMap = new Map();
      rawProducts.forEach(p => {
        const cat = (p.category || 'General Wellness').trim();
        if (!concernMap.has(cat)) {
          const catSlug = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          
          // Match pre-approved text case-insensitively
          let preApprovedCopy = approvedMessages[cat] || null;
          if (!preApprovedCopy) {
            const foundKey = Object.keys(approvedMessages).find(k => k.toLowerCase() === cat.toLowerCase());
            if (foundKey) preApprovedCopy = approvedMessages[foundKey];
          }

          if (!preApprovedCopy) {
            preApprovedCopy = `Discover authentic BIXA Botanical traditional herbal formulations for ${cat}. Supporting traditional Ayurvedic wellness, purity, and standard herbal efficacy.`;
          }

          const sections = parseConcernSections(preApprovedCopy);

          concernMap.set(cat, {
            id: catSlug,
            name: cat,
            slug: catSlug,
            message: preApprovedCopy,
            subConcerns: sections.map(s => s.title),
            displayOrder: concernMap.size + 1,
            active: true
          });
        }
      });
      
      localStore.concerns = Array.from(concernMap.values());

      // Create product concerns mappings
      localStore.productConcerns = localStore.products.map(p => ({
        productId: p.id,
        concernId: p.productType.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        displayOrder: 1,
        featured: true
      }));

      console.log(`[BIXA Service] Loaded ${localStore.products.length} products and ${localStore.concerns.length} concerns with pre-approved responses.`);
    }
  } catch (err) {
    console.error('Failed to load local fallback data:', err);
  }
};

// Initialize fallback on module load
loadLocalFallbackData();

export const getCategories = async () => {
  if (isCloudFirestoreEnabled) {
    try {
      const snapshot = await db.collection('products').where('active', '==', true).get();
      const counts = { HERBS: 0, FORMULATIONS: 0, COMBOS: 0 };
      const herbFormatCounts = { POWDER: 0, CAPSULE: 0, OTHER: 0 };
      snapshot.forEach(doc => {
        const data = doc.data();
        const cat = data.category || 'HERBS';
        if (counts[cat] !== undefined) counts[cat]++;
        if (cat === 'HERBS' && herbFormatCounts[data.format] !== undefined) herbFormatCounts[data.format]++;
      });
      return [
        { key: 'HERBS', label: 'Herbs', count: counts.HERBS, description: 'Pure, single-herb powders and extracts', formats: [
          { key: 'POWDER', label: 'Powders', count: herbFormatCounts.POWDER },
          { key: 'CAPSULE', label: 'Capsules', count: herbFormatCounts.CAPSULE },
          { key: 'OTHER', label: 'Seasonings/Essential Oils', count: herbFormatCounts.OTHER }
        ] },
        { key: 'FORMULATIONS', label: 'Formulations', count: counts.FORMULATIONS, description: 'Traditional Ayurvedic proprietary blends' },
        { key: 'COMBOS', label: 'Combos', count: counts.COMBOS, description: 'Curated wellness kits and value packs' }
      ];
    } catch (err) {
      console.warn('Firestore error in getCategories, using local store:', err.message);
    }
  }

  // Fast <5ms Local Response
  const counts = { HERBS: 0, FORMULATIONS: 0, COMBOS: 0 };
  const herbFormatCounts = { POWDER: 0, CAPSULE: 0, OTHER: 0 };
  localStore.products.forEach(p => {
    if (!p.active) return;
    if (counts[p.category] !== undefined) counts[p.category]++;
    if (p.category === 'HERBS' && herbFormatCounts[p.format] !== undefined) herbFormatCounts[p.format]++;
  });

  return [
    { key: 'HERBS', label: 'Herbs', count: counts.HERBS, description: 'Pure, single-herb powders and extracts', formats: [
      { key: 'POWDER', label: 'Powders', count: herbFormatCounts.POWDER },
      { key: 'CAPSULE', label: 'Capsules', count: herbFormatCounts.CAPSULE },
      { key: 'OTHER', label: 'Seasonings/Essential Oils', count: herbFormatCounts.OTHER }
    ] },
    { key: 'FORMULATIONS', label: 'Formulations', count: counts.FORMULATIONS, description: 'Traditional Ayurvedic proprietary blends' },
    { key: 'COMBOS', label: 'Combos', count: counts.COMBOS, description: 'Curated wellness kits and value packs' }
  ];
};

export const getProducts = async ({ category, format, letter, query, limit = 100 }) => {
  let productsList = [];

  if (isCloudFirestoreEnabled) {
    try {
      let ref = db.collection('products').where('active', '==', true);
      if (category) {
        ref = ref.where('category', '==', category.toUpperCase());
      }
      if (format) {
        ref = ref.where('format', '==', format.toUpperCase());
      }
      const snapshot = await ref.get();
      snapshot.forEach(doc => productsList.push({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.warn('Firestore error in getProducts, using local store:', err.message);
      productsList = [...localStore.products];
    }
  } else {
    productsList = [...localStore.products];
  }

  if (category) {
    productsList = productsList.filter(p => p.category.toUpperCase() === category.toUpperCase());
  }

  if (format) {
    productsList = productsList.filter(p => (p.format || '').toUpperCase() === format.toUpperCase());
  }

  if (query && query.trim() !== '') {
    const q = query.toLowerCase().trim();
    productsList = productsList.filter(p => 
      p.name.toLowerCase().includes(q) ||
      (p.productType && p.productType.toLowerCase().includes(q)) ||
      (p.keywords && p.keywords.some(k => k.toLowerCase().includes(q)))
    );
  }

  if (letter && letter.trim() !== '') {
    const l = letter.toUpperCase().trim();
    productsList = productsList.filter(p => {
      const sortName = (p.sortName || p.name).toUpperCase().trim();
      return sortName.startsWith(l);
    });
  }

  productsList.sort((a, b) => {
    const nameA = (a.sortName || a.name).toLowerCase();
    const nameB = (b.sortName || b.name).toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return productsList.slice(0, limit);
};

export const getConcerns = async ({ query } = {}) => {
  let list = [];

  if (isCloudFirestoreEnabled) {
    try {
      const snapshot = await db.collection('concerns').where('active', '==', true).orderBy('displayOrder').get();
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.warn('Firestore error in getConcerns, using local store:', err.message);
      list = [...localStore.concerns];
    }
  } else {
    list = [...localStore.concerns];
  }

  if (query && query.trim() !== '') {
    const q = query.toLowerCase().trim();
    list = list.filter(c => c.name.toLowerCase().includes(q));
  }

  list.sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99) || a.name.localeCompare(b.name));

  return list;
};

export const getConcernBySlug = async (slug) => {
  let concern = null;
  let recommendedProducts = [];

  if (isCloudFirestoreEnabled) {
    try {
      const snapshot = await db.collection('concerns').where('slug', '==', slug).limit(1).get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        concern = { id: doc.id, ...doc.data() };
        
        const mappingsSnap = await db.collection('product_concerns')
          .where('concernId', '==', concern.id)
          .orderBy('featured', 'desc')
          .orderBy('displayOrder', 'asc')
          .get();

        const productIds = mappingsSnap.docs.map(d => d.data().productId);
        if (productIds.length > 0) {
          const prodsSnap = await db.collection('products').where('__name__', 'in', productIds.slice(0, 3)).get();
          prodsSnap.forEach(pDoc => recommendedProducts.push({ id: pDoc.id, ...pDoc.data() }));
        }
      }
    } catch (err) {
      console.warn('Firestore error in getConcernBySlug, falling back:', err.message);
    }
  }

  if (!concern) {
    concern = localStore.concerns.find(c => c.slug === slug || c.id === slug);
    if (concern) {
      const mapped = localStore.productConcerns.filter(m => m.concernId === concern.id || m.concernId === slug);
      const prodIds = new Set(mapped.map(m => m.productId));
      recommendedProducts = localStore.products.filter(p => prodIds.has(p.id) || p.productType.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === slug);
    }
  }

  if (!concern) return null;

  // Combos are bundles, not the individual herb named in a sub-concern's text — exclude them so a
  // combo that merely contains that herb as one ingredient doesn't get matched in its place.
  const mentionCandidates = localStore.products.filter(p => p.category !== 'COMBOS');
  const sections = parseConcernSections(concern.message, mentionCandidates);

  // When the message has explicit sub-concerns, each one names its own products — show the union
  // of those (deduped) as the concern-level overview instead of an arbitrary category-based slice.
  if (sections.length > 0) {
    const seenIds = new Set();
    recommendedProducts = [];
    sections.forEach(s => s.products.forEach(p => {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        recommendedProducts.push(p);
      }
    }));
  }

  return {
    ...concern,
    sections,
    products: sections.length > 0 ? recommendedProducts : recommendedProducts.slice(0, 3)
  };
};

export const logAnalyticsEvent = async (eventData) => {
  const event = {
    sessionId: eventData.sessionId || 'anonymous',
    eventType: eventData.eventType || eventData.event,
    metadata: eventData.metadata || {},
    timestamp: new Date().toISOString()
  };

  if (isCloudFirestoreEnabled) {
    try {
      await db.collection('analytics_events').add(event);
      return { success: true, mode: 'firestore' };
    } catch (err) {
      console.warn('Failed to log event to Firestore:', err.message);
    }
  }

  localStore.analyticsEvents.push(event);
  return { success: true, mode: 'memory' };
};
