import React, { useState, useEffect, useRef } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { trackProductFinderEvent } from '../../utils/analytics';
import { addToCart } from '../../utils/cart';

const ADDED_RESET_MS = 2000;

// Adds the product to the store's cart without leaving the page, so customers can collect several
// products and check out once. If the add fails, or the product has no variant, the button links to
// the product page instead.
const AddToCartButton = ({ product, trackingContext, onCartChange, className = '' }) => {
  const [status, setStatus] = useState('idle'); // idle | adding | added | failed
  const resetTimer = useRef(null);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const openProductPage = () => {
    if (product?.productUrl) window.open(product.productUrl, '_blank', 'noopener,noreferrer');
  };

  const handleClick = async () => {
    if (status === 'failed' || !product?.variantId) {
      openProductPage();
      return;
    }

    trackProductFinderEvent('concern_add_to_cart_clicked', {
      ...trackingContext,
      productId: product.id,
      productName: product.name
    });

    setStatus('adding');
    clearTimeout(resetTimer.current);
    try {
      const count = await addToCart(product.variantId);
      onCartChange?.(count);
      setStatus('added');
      resetTimer.current = setTimeout(() => setStatus('idle'), ADDED_RESET_MS);
    } catch (err) {
      console.error('Error adding to cart:', err);
      setStatus('failed');
    }
  };

  const showProductLink = status === 'failed' || !product?.variantId;

  return (
    <button
      onClick={handleClick}
      disabled={status === 'adding' || (showProductLink && !product?.productUrl)}
      aria-live="polite"
      className={`inline-flex items-center justify-center gap-1.5 bg-bixa-darkgreen hover:bg-bixa-green disabled:bg-gray-200 text-white text-xs font-bold rounded-full transition-colors ${className}`}
    >
      {status === 'adding' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {status === 'added' && <Check className="w-3.5 h-3.5" />}
      {status === 'adding' && 'Adding...'}
      {status === 'added' && 'Added'}
      {status === 'idle' && (product?.variantId ? 'Add to Cart' : 'View Product')}
      {status === 'failed' && "Couldn't add. View Product"}
    </button>
  );
};

export default AddToCartButton;
