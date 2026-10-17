import React from 'react';
import { trackProductFinderEvent } from '../../utils/analytics';

const ProductCard = ({ product, isCombo = false }) => {
  if (!product) return null;

  const handleBuyNow = () => {
    const destination = product.checkoutUrl || product.productUrl;
    trackProductFinderEvent('product_buy_now_clicked', {
      productId: product.id,
      productName: product.name,
      destination,
      category: product.category
    });
    if (destination) {
      window.open(destination, '_blank', 'noopener,noreferrer');
    }
  };

  const handleViewDetails = () => {
    trackProductFinderEvent('product_view_clicked', {
      productId: product.id,
      productName: product.name,
      productUrl: product.productUrl,
      category: product.category
    });
    if (product.productUrl) {
      window.open(product.productUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex flex-col bg-white border-2 border-bixa-darkgreen/60 rounded-2xl overflow-hidden">
      <div className="relative aspect-square w-full bg-gray-50">
        {isCombo && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold uppercase bg-bixa-darkgreen text-white rounded-md z-10">
            Combo Pack
          </span>
        )}
        <img
          src={product.imageUrl || 'https://bixabotanical.in/cdn/shop/files/placeholder.jpg'}
          alt={product.name}
          className="w-full h-full object-contain p-3"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://bixabotanical.in/cdn/shop/files/placeholder.jpg';
          }}
        />
      </div>

      <div className="flex flex-col flex-1 p-3 items-center text-center">
        <h4 className="font-heading text-sm font-bold text-bixa-darkgreen leading-snug line-clamp-2">
          {product.name}
        </h4>

        <button
          onClick={handleBuyNow}
          disabled={!(product.checkoutUrl || product.productUrl)}
          className="w-full mt-3 py-2 bg-bixa-darkgreen hover:bg-bixa-green disabled:bg-gray-200 text-white text-xs font-bold rounded-full transition-colors"
        >
          Buy Now
        </button>
        <button
          onClick={handleViewDetails}
          className="text-[11px] font-semibold text-bixa-green underline mt-1.5"
        >
          View Product Details
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
