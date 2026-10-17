<p align="center">
  <img src="Bixa%20Logo%20TM_Green.svg" alt="BIXA Botanical" width="160">
</p>

<h1 align="center">BIXA Product Finder</h1>

<p align="center">
  An embeddable shopping assistant for <a href="https://bixabotanical.in">bixabotanical.in</a> that helps visitors find the right Ayurvedic product, by product type or by health concern.
</p>

---

## Overview

BIXA Product Finder is a floating chat-style widget that sits in the corner of the BIXA Botanical website. Visitors open it and are guided through a short, button-driven conversation:

- **Shop by Products:** browse the catalogue by tab (Powders, Capsules, Formulations, Combos).
- **Shop by Concern:** pick a health concern (e.g. Hair Wellness), then a specific need (e.g. *Hair Fall & Thinning Support*), and get the recommended BIXA product with a short explanation, a "Best for" summary, and a one-tap **Buy Now** that goes straight to checkout.
- **Quick links:** book a free Ayurvedic doctor consultation, track an order, contact support, see current offers, make a bulk enquiry, or read the return policy.

### Purpose

The BIXA catalogue has 120+ herbs, capsules and combo packs, and many visitors arrive with a *problem* ("my hair is thinning") rather than a *product name*. The Product Finder bridges that gap with the brand's own expertise: every recommendation and every sentence shown comes from **pre-approved, human-written content**. **No generative AI is used**, so customers never see unreviewed health claims.

## Uses and benefits

**For customers**
- Find a suitable product in a few taps, without knowing Sanskrit or botanical herb names.
- Get a clear explanation of *why* a herb is recommended, with a "Know More" screen for the fuller Ayurvedic rationale.
- **Buy Now** adds the product straight to the Shopify cart and checkout, skipping extra page loads.
- An easy route to a free doctor consultation whenever they're unsure.
- Works full-screen on mobile and as a resizable floating panel on desktop.

**For BIXA**
- **Compliance-safe:** recommendations are deterministic and come only from approved copy. Every concern screen carries the educational-purposes disclaimer.
- **Higher conversion:** shorter path from "I have a concern" to checkout.
- **Insight:** anonymous analytics events (widget opened, concern selected, Buy Now clicked, doctor link clicked, etc.) show what customers look for.
- **Easy to deploy:** one `<script>` tag on the Shopify theme; no Shopify app or theme rebuild needed.
- **Low running cost:** the API serves everything from memory and needs no database to run.

## Tech stack

| Layer | Technology |
|---|---|
| Widget UI | React 18, Tailwind CSS 3, lucide-react icons, Playfair Display (Google Fonts) |
| Build tooling | Vite 5 (library mode: IIFE / UMD / ES bundles for embedding) |
| API | Node.js (ES modules), Express 4, express-rate-limit, CORS, dotenv |
| Data | JSON knowledge base served from memory; optional Google Cloud Firestore via `firebase-admin` |
| Commerce | Shopify (bixabotanical.in): product pages and `/cart/{variant_id}:1` checkout permalinks |
| Hosting (planned) | API on Heroku; widget bundle loaded by a `<script>` tag on the Shopify theme |

## Project structure

```
bixa-product-finder/
├── backend/                      Express API
│   ├── server.js                 App setup, CORS, rate limiting, port fallback
│   ├── routes/                   /product-finder/* endpoints
│   ├── services/firestoreService.js   All data access, product/concern logic
│   ├── config/firebase.js        Optional Firestore connection
│   ├── data/concerns_messages.json    Pre-approved concern copy (edit this)
│   └── scripts/                  validate-data.js, test-api.js, seed-firebase.js
├── frontend/                     React widget
│   ├── src/embed.jsx             Production entry: self-mounting widget
│   ├── src/App.jsx               Dev entry: mock BIXA storefront page
│   └── src/components/ProductFinder/   One component per screen
└── knowledge_base/
    ├── products_with_images.json Product catalogue the API loads
    ├── bixa_catalog_scrape.json  Reference snapshot of the live Shopify catalogue
    └── concerns_data.json        Original source material (not read at runtime)
```

## Getting started

**Prerequisites:** Node.js 18+ and npm.

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env        # sets PORT=5057, which the frontend dev proxy expects
npm run dev                 # http://localhost:5057/health

# 2. Frontend (in a second terminal)
cd frontend
npm install
npm run dev                 # http://localhost:3000, with the widget in the bottom-right corner
```

Firebase is **optional**. With no credentials, the API automatically serves everything from the local JSON files.

### Useful commands

| Where | Command | What it does |
|---|---|---|
| backend | `npm run validate` | Checks product data and that every recommended product in the concern copy matches a real product. Exits 1 on errors. |
| backend | `node scripts/test-api.js` | Smoke-tests all API endpoints |
| frontend | `npm run build` | Builds the embeddable bundle into `frontend/dist/` |
| frontend | `npm run preview` | Previews the production build |

## API

All endpoints are available under both `/product-finder` and `/api/product-finder`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/categories` | Herbs / Formulations / Combos with counts (and Powder/Capsule counts for herbs) |
| GET | `/products?category=&format=&letter=&q=&limit=` | Product list with filters |
| GET | `/search?q=` | Product search |
| GET | `/concerns` | All health concerns |
| GET | `/concerns/:slug` | One concern with sub-concerns and their recommended products |
| POST | `/events` | Records an anonymous analytics event |
| GET | `/health` | Health check (root path) |

## Embedding on the BIXA website

1. Build the widget: `cd frontend && npm run build`.
2. Host `dist/bixa-product-finder.iife.js` and `dist/style.css` (e.g. upload them to Shopify theme assets).
3. Add the following to the theme, before `</body>`:

```html
<link rel="stylesheet" href="https://YOUR-HOST/style.css">
<script>window.__BIXA_API_BASE__ = 'https://YOUR-API-HOST/product-finder';</script>
<script src="https://YOUR-HOST/bixa-product-finder.iife.js"></script>
```

If `__BIXA_API_BASE__` isn't set, the widget falls back to the Heroku URL hard-coded in `src/embed.jsx`.

On the API server, set `NODE_ENV=production`. Browser requests are only accepted from bixabotanical.in; to allow other domains (e.g. the store's `*.myshopify.com` address used in the theme editor), list them in `CORS_ORIGINS`, comma-separated.

## Updating content

- **Concern messages:** edit `backend/data/concerns_messages.json`. Number each sub-concern (`1. Title`, `2. Title`, …), name the product in a line beginning *"we recommend …"*, and put a standalone `Know More` line before the longer explanation.
- **Products:** edit `knowledge_base/products_with_images.json` (name, category, image, `buy_link`, Shopify `variant_id`, `format`).
- **Always run `npm run validate` afterwards.** It catches broken links and product names that don't match.

## Challenges and solutions

| Challenge | Solution |
|---|---|
| **Every product appeared twice** in the knowledge base (one "About" row, one "Pricing & Available Sizes" row). | The API de-duplicates by product name at load time and keeps the row with the richer description (240 rows → 120 products). |
| **The source data has no product-type field**, so Herbs, Formulations and Combos couldn't be told apart directly. | Products are classified automatically from their names and sections. Herbs are split further into Powders and Capsules using the `format` field. |
| **Long concern messages were a wall of text.** | The copy follows a simple numbered format that the API parses into selectable sub-concerns, each with a short summary and an optional "Know More" screen. |
| **Recommendations had to match real products** without hand-maintaining a mapping table. | The API reads each sub-concern's *"we recommend X"* sentence and matches X against the catalogue. Combo packs are excluded so a pack containing the herb isn't recommended in place of the herb itself. |
| **The same herb is sold as both a powder and a capsule.** | A name normaliser strips format words and botanical names (e.g. *"Karela Fruit Powder (Momordica Charantia)"* → *"karela"*) to link both formats. The widget then shows a single primary product so customers aren't split between choices. |
| **Spelling differences broke matches silently.** The copy said "Bhringraj" while the product is "Bhring**a**raj", leaving 7 sub-concerns with no product. | The copy was corrected to the product's spelling (the product name is the source of truth), and `npm run validate` now detects any remaining mismatch automatically. |
| **Combo pack links were shuffled.** All 8 combos pointed to a *different* combo's page because of a data-entry offset. | Each combo was cross-checked by exact title against the live Shopify catalogue and its link corrected. Four discontinued products were removed rather than left with dead links. |
| **"Buy Now" landed on the product page**, adding an extra step before purchase. | Each product now stores its Shopify `variant_id`. Buy Now uses Shopify's `/cart/{variant_id}:1` permalink to go straight to checkout, falling back to the product page if needed. |
| **Firebase isn't always configured** (local development, demos, or a credentials outage). | All data access goes through one service that tries Firestore and falls back to in-memory JSON on any error, so the API behaves the same with or without Firebase. |
| **Embedding a React app into an existing Shopify theme.** | Vite builds a self-contained IIFE bundle that creates its own container, guards against loading twice, and reads its API URL from a global variable. |
| **Changes "not showing up" on test pages.** | Pages loading the built bundle serve whatever was last built. The fix was to rebuild `dist/` after each completed change and check for a stale build before debugging code. |
| **Port clashes and broken dev proxy** when several local servers were running. | The API retries on the next free port, and `.env.example` pins the port the frontend proxy expects. |
| **Many concerns don't have written content yet.** | Those concerns show a friendly "Content coming soon" card with a free doctor-consultation button instead of an empty screen. |
| **Analytics must never slow down or break shopping.** | Tracking calls are fire-and-forget and all errors are swallowed. Sessions are anonymous IDs with no personal data. |

## Known issues and roadmap

- **Formulations tab is empty:** the current classification never assigns `FORMULATIONS`, because the source data has no field that identifies them.
- **Four sub-concerns show no product** because the copy uses a different name from the catalogue: Majishtha → *Manjistha*, Fenugreek → *Methi Seeds*, Gudmar → *Gurmar Leaves*, Stevia Leaf → *Stevia Leaves*. Run `npm run validate` to see them.
- **Content pending:** only Blood, Diabetic, Heart and Hair Wellness have full sub-concern copy so far; the other 15 concerns show placeholders.
- **Placeholder links:** the Track My Order URL and the footer social-media links still need their real addresses.
- **`npm run seed` only validates data.** It does not yet write products to Firestore.
- **Planned:** live call-back with the Ayurvedic doctor during consultation hours, including a queue and phone-number capture.

---

© BIXA Botanical. Internal project — not licensed for redistribution.
