import React from 'react';
import ReactDOM from 'react-dom/client';
import ProductFinderWidget from './components/ProductFinder/ProductFinderWidget';
// Imported as a string (not a stylesheet) so it can be injected into the widget's shadow root below;
// this also means the build emits a single self-contained JS file with no separate style.css.
import widgetCss from './index.css?inline';

const HEADING_FONT_URL = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&display=swap';

(function initBixaProductFinder() {
  if (window.__BIXA_PRODUCT_FINDER_INIT__) return;
  window.__BIXA_PRODUCT_FINDER_INIT__ = true;

  // The widget renders inside a Shadow DOM so the host Shopify theme's CSS can't restyle it (the live
  // theme defines its own `.flex`, `.gap-*`, `.py-3`, `.grid`… with different values, some !important)
  // and the widget's CSS can't leak out onto the store's pages.
  const host = document.createElement('div');
  host.id = 'bixa-product-finder-widget-container';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  // `all: initial` stops inherited host-page text styles (letter-spacing, text-align…) crossing in.
  style.textContent = `:host { all: initial; }\n${widgetCss}`;
  shadow.appendChild(style);

  const mountPoint = document.createElement('div');
  shadow.appendChild(mountPoint);

  // @font-face rules aren't applied from inside a shadow root in every browser, so the heading font
  // is loaded on the host document instead (once).
  if (!document.querySelector(`link[href="${HEADING_FONT_URL}"]`)) {
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = HEADING_FONT_URL;
    document.head.appendChild(fontLink);
  }

  // No API URL is needed: product/concern data is bundled (see utils/catalogClient.js) and analytics
  // go to the store's Google Analytics. Setting window.__BIXA_API_BASE__ before this script is only
  // for optionally also sending analytics events to the backend in backend/.

  // Mount React Widget
  const root = ReactDOM.createRoot(mountPoint);
  root.render(
    <React.StrictMode>
      <ProductFinderWidget />
    </React.StrictMode>
  );

  console.log('🌿 BIXA Product Finder Widget initialized successfully!');
})();
