import React from 'react';
import ProductFinderWidget from './components/ProductFinder/ProductFinderWidget';

function App() {
  return (
    <div className="min-h-screen bg-emerald-50/40 p-6 flex flex-col justify-between">
      {/* Mock BIXA Website Header */}
      <header className="max-w-5xl mx-auto w-full bg-white rounded-2xl shadow-xs border border-gray-200/80 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌿</span>
          <span className="text-lg font-bold text-bixa-darkgreen tracking-wide">
            BIXA BOTANICALS
          </span>
        </div>
        <nav className="hidden sm:flex items-center gap-6 text-xs font-semibold text-gray-600">
          <a href="#" className="hover:text-bixa-green">Home</a>
          <a href="#" className="hover:text-bixa-green">Shop Herbs</a>
          <a href="#" className="hover:text-bixa-green">Concerns</a>
          <a href="#" className="hover:text-bixa-green">About Us</a>
        </nav>
      </header>

      {/* Main Mock Content */}
      <main className="max-w-3xl mx-auto w-full text-center my-12 space-y-4">
        <span className="px-3 py-1 bg-bixa-lightgreen text-bixa-darkgreen text-xs font-bold rounded-full">
          Live Website Preview & Integration Test
        </span>
        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
          Discover Pure Ayurvedic & Herbal Remedies
        </h1>
        <p className="text-sm text-gray-600 max-w-xl mx-auto">
          Test the BIXA Product Finder floating widget at the bottom-right corner of this page.
        </p>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center text-xs text-gray-400 py-4">
        © 2026 BIXA Botanicals. All Rights Reserved.
      </footer>

      {/* Product Finder Widget */}
      <ProductFinderWidget />
    </div>
  );
}

export default App;
