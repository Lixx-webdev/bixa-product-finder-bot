import React from 'react';
import ReactDOM from 'react-dom/client';
import ProductFinderWidget from './components/ProductFinder/ProductFinderWidget';
import './index.css';

(function initBixaProductFinder() {
  if (window.__BIXA_PRODUCT_FINDER_INIT__) return;
  window.__BIXA_PRODUCT_FINDER_INIT__ = true;

  // Create isolated container element
  const container = document.createElement('div');
  container.id = 'bixa-product-finder-widget-container';
  document.body.appendChild(container);

  // Configure target API base URL
  if (!window.__BIXA_API_BASE__) {
    window.__BIXA_API_BASE__ = process.env.NODE_ENV === 'production' 
      ? 'https://bixa-product-finder-api.herokuapp.com/product-finder' 
      : '/api/product-finder';
  }

  // Mount React Widget
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <ProductFinderWidget />
    </React.StrictMode>
  );

  console.log('🌿 BIXA Product Finder Widget initialized successfully!');
})();
