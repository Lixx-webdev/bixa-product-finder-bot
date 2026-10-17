import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import ProductCard from './ProductCard';
import { trackProductFinderEvent } from '../../utils/analytics';

const TABS = [
  { key: 'POWDER', label: 'Powders', category: 'HERBS', format: 'POWDER' },
  { key: 'CAPSULE', label: 'Capsules', category: 'HERBS', format: 'CAPSULE' },
  { key: 'FORMULATIONS', label: 'Formulations', category: 'FORMULATIONS' },
  { key: 'COMBOS', label: 'Combos', category: 'COMBOS' }
];

const ShopByProducts = () => {
  const [activeTab, setActiveTab] = useState('POWDER');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tab = TABS.find((t) => t.key === activeTab);

  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = window.__BIXA_API_BASE__ || '/api/product-finder';
        const params = new URLSearchParams({ category: tab.category, limit: '100' });
        if (tab.format) params.append('format', tab.format);

        const res = await fetch(`${apiBase}/products?${params.toString()}`);
        const data = await res.json();

        if (isMounted) {
          if (data.success) {
            setProducts(data.data || []);
          } else {
            setError(data.error || 'Failed to load products');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Fetch products error:', err);
          setError("We're having trouble loading products right now.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => { isMounted = false; };
  }, [tab.category, tab.format]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    trackProductFinderEvent('product_tab_selected', { tab: key });
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {TABS.map((t, i) => (
            <React.Fragment key={t.key}>
              {i > 0 && <span className="text-gray-300">|</span>}
              <button
                onClick={() => handleTabChange(t.key)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${
                  activeTab === t.key
                    ? 'bg-bixa-darkgreen text-white'
                    : 'text-bixa-darkgreen hover:bg-bixa-lightgreen/30'
                }`}
              >
                {t.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 bixa-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-bixa-green" />
            <span className="text-xs font-medium">Loading products...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
            <p className="text-xs font-medium text-gray-700 mb-3">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-xl border border-dashed border-gray-200 mt-2">
            <span className="text-2xl mb-1">🌿</span>
            <h4 className="text-xs font-bold text-gray-800">No products found</h4>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id || product.slug} product={product} isCombo={tab.key === 'COMBOS'} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopByProducts;
