<p align="center">
  <img src="Bixa%20Logo%20TM_Green.svg" alt="BIXA Botanical" width="160">
</p>

<h1 align="center">BIXA Product Finder</h1>

<p align="center">
  An embeddable shopping assistant for <a href="https://bixabotanical.in">bixabotanical.in</a> that helps visitors find the right Ayurvedic product for their health concern.
</p>

---

## Overview

BIXA Product Finder is a floating chat-style widget that sits in the corner of the BIXA Botanical website. Visitors open it and are guided through a short, button-driven conversation:

- **Shop by Concern:** pick a health concern (e.g. Hair Wellness), then a specific need (e.g. *Hair Fall & Thinning Support*), and get the recommended BIXA product with a short explanation, a "Best for" summary, and an **Add to Cart** button, so customers can collect several products and check out once.
- **Quick links:** book a free Ayurvedic doctor consultation, contact support, see current offers, make a bulk enquiry, or read the return policy.

### Purpose

The BIXA catalogue has 120+ herbs, capsules and combo packs, and many visitors arrive with a *problem* ("my hair is thinning") rather than a *product name*. The Product Finder bridges that gap with the brand's own expertise: every recommendation and every sentence shown comes from **pre-approved, human-written content**. **No generative AI is used**, so customers never see unreviewed health claims.

## Uses and benefits

**For customers**
- Find a suitable product in a few taps, without knowing Sanskrit or botanical herb names.
- Get a clear explanation of *why* a herb is recommended, with a "Know More" screen for the fuller Ayurvedic rationale.
- **Add to Cart** works without leaving the page, and a **View Cart & Checkout** button appears once the cart has items.
- An easy route to a free doctor consultation whenever they're unsure.
- Works full-screen on mobile and as a resizable floating panel on desktop.

**For BIXA**
- **Compliance-safe:** recommendations are deterministic and come only from approved copy. Every concern screen carries the educational-purposes disclaimer.
- **Higher conversion:** shorter path from "I have a concern" to checkout.
- **Insight:** analytics events (widget opened, concern selected, Add to Cart clicked, doctor link clicked, etc.) can feed the store's existing Google Analytics 4 through Google Tag Manager, showing what customers look for.
- **Easy to deploy:** one `<script>` tag on the Shopify theme; no Shopify app or theme rebuild needed.
- **Zero running cost, near-zero maintenance:** no server, database or hosting account. The widget is a single file stored in the Shopify theme, with all product and concern data built in.

## Tech stack

| Layer | Technology |
|---|---|
| Widget UI | React 18, Tailwind CSS 3, lucide-react icons, Playfair Display (Google Fonts) |
| Build tooling | Vite 5 (library mode: IIFE / UMD / ES bundles for embedding) |
| Data pipeline | Node.js scripts that turn the JSON knowledge base into the data bundled in the widget |
| Analytics | Google Analytics 4 (the store's existing `gtag` / Google Tag Manager) |
| Commerce | Shopify (bixabotanical.in): product pages and `/cart/{variant_id}:1` checkout permalinks |
| Hosting | None needed. The widget file is uploaded to the Shopify theme's assets |
| Optional API | Node.js (ES modules), Express 4, express-rate-limit, CORS, optional Google Cloud Firestore. Not needed for the live widget |

## How it works

```
knowledge_base/products_with_images.json ─┐
backend/data/concerns_messages.json ──────┤  npm run build (frontend/)
                                          ▼
              backend/scripts/export-static-data.js   (dedupe, classify, parse sub-concerns,
                                          │            match recommended products)
                                          ▼
              frontend/src/data/catalog.json ──► bundled into bixa-product-finder.iife.js
                                                              │
                                     uploaded to Shopify theme assets, loaded on every page
```

The live widget makes no calls to any server of ours. Its data is built in, and its analytics go to the store's Google Analytics. The `backend/` folder provides the data logic and checks used at build time. It can also run as a standalone API, but the widget doesn't need it.

## Project structure

```
bixa-product-finder/
├── backend/                      Data logic + optional Express API
│   ├── server.js                 App setup, CORS, rate limiting, port fallback
│   ├── routes/                   /product-finder/* endpoints
│   ├── services/firestoreService.js   All data access, product/concern logic
│   ├── config/firebase.js        Optional Firestore connection
│   ├── data/concerns_messages.json    Pre-approved concern copy (edit this)
│   └── scripts/                  export-static-data.js, validate-data.js, test-api.js, seed-firebase.js
├── frontend/                     React widget
│   ├── src/embed.jsx             Production entry: self-mounting widget
│   ├── src/App.jsx               Dev entry: mock BIXA storefront page
│   ├── src/data/catalog.json     Generated data bundled into the widget (don't edit by hand)
│   ├── src/utils/catalogClient.js  Answers the screens' data requests from catalog.json
│   └── src/components/ProductFinder/   One component per screen
└── knowledge_base/
    ├── products_with_images.json Product catalogue the API loads
    ├── bixa_catalog_scrape.json  Reference snapshot of the live Shopify catalogue
    └── concerns_data.json        Original source material (not read at runtime)
```

## Project rules

These rules are mandatory for anyone changing the widget.

1. **The live website is the source of truth.** Whatever the widget says or displays must match [bixabotanical.in](https://bixabotanical.in). If they differ, the website wins.
   - The widget lists exactly the concerns on the website's Shop By Wellness menu, no more and no fewer (18 as of October 2026). They're kept in `backend/data/live_concerns.json`.
   - It uses the website's exact wording for concerns and products, for example "Fitness Wellness" and "Respiratory Wellness".
   - Run `npm run check-live` in `backend/` after changing concerns or products, and before each release.
2. **One product per recommendation, for now.** The widget is a recommender, so each sub-concern shows one product: the first one its "we recommend" line names. To change this, update `MAX_RECOMMENDED_PRODUCTS` in `frontend/src/components/ProductFinder/ConcernDetail.jsx`.

## Getting started

**Prerequisites:** Node.js 18+ and npm.

```bash
cd backend && npm install            # needed: the build uses the backend's data logic
cd ../frontend && npm install
npm run data                         # generate src/data/catalog.json from the knowledge base
npm run dev                          # http://localhost:3000, with the widget in the bottom-right corner
```

No server needs to be running.

### Useful commands

| Where | Command | What it does |
|---|---|---|
| backend | `npm run check-live` | Compares the widget's concerns and recommended products with the live website |
| backend | `npm run validate` | Checks product data and that every recommended product in the concern copy matches a real product. Exits 1 on errors. |
| backend | `node scripts/test-api.js` | Smoke-tests all API endpoints |
| frontend | `npm run data` | Regenerates `src/data/catalog.json` from the knowledge base |
| frontend | `npm run build` | Regenerates the data, then builds `dist/bixa-product-finder.iife.js` |
| frontend | `npm run preview` | Previews the production build |

## Optional API

The live widget doesn't use it. It's kept for anyone who wants to serve the same data elsewhere. Run it with `cd backend && cp .env.example .env && npm run dev`. All endpoints are available under both `/product-finder` and `/api/product-finder`.

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

The widget ships as **one self-contained file**, `frontend/dist/bixa-product-finder.iife.js`, with its CSS built in. It renders inside a Shadow DOM, so the store theme's CSS can't change how it looks, and its CSS can't affect the store's pages.

1. Build the widget: `cd frontend && npm run build`.
2. In Shopify admin, go to **Online Store → Themes → ⋯ → Edit code**. Under **Assets**, upload `bixa-product-finder.iife.js`.
3. In `layout/theme.liquid`, add this line just before `</body>`:

```liquid
<script src="{{ 'bixa-product-finder.iife.js' | asset_url }}" defer></script>
```

4. Turn off the store's **Shopify Inbox** chat bubble, which uses the same bottom-right corner: **Online Store → Themes → Customize → App embeds →** switch off **Shopify Inbox** → **Save**. This is set separately for each theme.

Test on a duplicate of the live theme first (**⋯ → Duplicate**, then **⋯ → Preview**), then repeat the same steps on the live theme rather than publishing the copy, so no edits made to the live theme in the meantime are lost. To roll back, delete the script line and switch Shopify Inbox back on.

Analytics events are pushed to the page's `dataLayer` as `pf_*` events (e.g. `pf_concern_selected`). **The store loads Google Analytics through Google Tag Manager, so they reach GA4 only once GTM has a Custom Event trigger matching `^pf_` and a GA4 Event tag.** To use their parameters in GA4 reports, register them as custom dimensions.

Optional: setting `window.__BIXA_API_BASE__` before the script also sends events to a deployed copy of the optional API.

## Updating content

- **Concern messages:** edit `backend/data/concerns_messages.json`. Number each sub-concern (`1. Title`, `2. Title`, …), name the product in a line beginning *"we recommend …"*, and put a standalone `Know More` line before the longer explanation.
- **Products:** edit `knowledge_base/products_with_images.json` (name, category, image, `buy_link`, Shopify `variant_id`, `format`).
- **Always run `npm run validate` afterwards.** It catches broken links and product names that don't match.
- **Then publish:** run `npm run build` in `frontend/` and replace `bixa-product-finder.iife.js` in the Shopify theme assets. Content only changes on the live site when the file is re-uploaded.

## Challenges and solutions

| Challenge | Solution |
|---|---|
| **Every product appeared twice** in the knowledge base (one "About" row, one "Pricing & Available Sizes" row). | The API de-duplicates by product name at load time and keeps the row with the richer description (240 rows → 120 products). |
| **The source data has no product-type field**, so Herbs, Formulations and Combos couldn't be told apart directly. | Products are classified automatically from their names and sections. Herbs are split further into Powders and Capsules using the `format` field. |
| **Long concern messages were a wall of text.** | The copy follows a simple numbered format that the API parses into selectable sub-concerns, each with a short summary and an optional "Know More" screen. |
| **Recommendations had to match real products** without hand-maintaining a mapping table. | The API reads each sub-concern's *"we recommend X"* sentence and matches X against the catalogue. Combo packs are excluded so a pack containing the herb isn't recommended in place of the herb itself. |
| **Spelling differences broke matches silently.** The copy said "Bhringraj" while the product is "Bhring**a**raj", leaving 7 sub-concerns with no product. | The copy was corrected to the product's spelling (the product name is the source of truth), and `npm run validate` now detects any remaining mismatch automatically. |
| **Combo pack links were shuffled.** All 8 combos pointed to a *different* combo's page because of a data-entry offset. | Each combo was cross-checked by exact title against the live Shopify catalogue and its link corrected. Four discontinued products were removed rather than left with dead links. |
| **Customers buying several products had to check out separately for each**, because Buy Now went straight to checkout. | Each product stores its Shopify `variant_id`, and Add to Cart uses Shopify's AJAX cart to add it without leaving the page. The header cart count stays in step, and the widget links to the cart. If an add fails, the button links to the product page instead. |
| **Firebase isn't always configured** (local development, demos, or a credentials outage). | All data access goes through one service that tries Firestore and falls back to in-memory JSON on any error, so the API behaves the same with or without Firebase. |
| **A single maintainer, and a server would need an account, payment and monitoring.** If either lapsed, the widget would break silently. | The data is baked into the widget at build time using the same backend logic, and analytics go to the store's existing Google Analytics. Nothing has to run or be paid for: the widget is one file in the Shopify theme (121 KB compressed, loaded with `defer`). |
| **Embedding a React app into an existing Shopify theme.** | Vite builds a self-contained IIFE bundle that creates its own container, guards against loading twice, and reads its API URL from a global variable. |
| **The first embed build crashed on load** ("process is not defined") because Vite's library mode doesn't replace `process.env.NODE_ENV`. | The build now defines it at compile time, which also dropped React's development code (bundle 527 KB → 221 KB). |
| **CSS clashes with the live theme.** Tailwind's global reset would have restyled the whole store, and the theme's own `.flex`, `.gap-*` and `.py-3` classes (some `!important`) broke the widget's layout. | The widget renders inside a Shadow DOM with its CSS injected there and scoped to the widget root, so neither side can affect the other. The z-index is raised above theme overlays. |
| **Changes "not showing up" on test pages.** | Pages loading the built bundle serve whatever was last built. The fix was to rebuild `dist/` after each completed change and check for a stale build before debugging code. |
| **Port clashes and broken dev proxy** when several local servers were running. | The API retries on the next free port, and `.env.example` pins the port the frontend proxy expects. |
| **Many concerns don't have written content yet.** | Those concerns show a friendly "Content coming soon" card with a free doctor-consultation button instead of an empty screen. |
| **Analytics must never slow down or break shopping.** | Events are handed to the page's own Google Analytics tag (`gtag`/`dataLayer`), and any error is swallowed. No personal data is sent. |

## Known issues and roadmap

- **Content pending:** Brain, Libido, Nerve, Respiratory, Weight and Women Wellness show "Content coming soon" until their copy arrives.
- **Placeholder links:** the footer social-media links still need their real addresses.
- **Planned:** a Track My Order link on the home menu, once order tracking is set up on the store (removed until then).
- **Content edits need a re-upload:** after changing products or concern copy, rebuild and replace the widget file in Shopify.
- **`npm run seed` only validates data.** It does not yet write products to Firestore (only relevant to the optional API).
- **Planned:** live text chat with the Ayurvedic doctor during consultation hours (via tawk.to), with a leave-your-number form when the doctor is unavailable.

---

© BIXA Botanical. Internal project — not licensed for redistribution.
