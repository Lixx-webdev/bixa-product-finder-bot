import React from 'react';
import { X, ChevronLeft } from 'lucide-react';

// `Icon` is optional — detail-style screens (ConcernDetail, ConcernKnowMore) render the header
// without the circular icon avatar, matching the design mockup. `onBack` is optional — the Home
// screen has no back arrow since it's the root of the navigation stack.
const ProductFinderHeader = ({ onClose, onBack, title = 'BIXA Product Finder', subtitle = 'Authentic Herbal & Ayurvedic Discovery', Icon }) => {
  return (
    <div className="flex items-center justify-between px-4 py-4 bg-bixa-darkgreen text-white">
      <div className="flex items-center gap-2.5 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="w-8 h-8 shrink-0 flex items-center justify-center text-white hover:bg-bixa-green/40 rounded-full transition-colors focus:outline-none"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {Icon && (
          <div className="w-10 h-10 shrink-0 rounded-full bg-bixa-green/70 flex items-center justify-center text-bixa-lightgreen">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-heading text-base font-bold tracking-wide leading-tight truncate">
            {title}
          </h3>
          <p className="text-[11px] text-bixa-lightgreen/70 leading-none mt-1 truncate">
            {subtitle}
          </p>
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-8 h-8 shrink-0 flex items-center justify-center text-bixa-lightgreen/80 hover:text-white rounded-full transition-colors focus:outline-none"
        aria-label="Close Product Finder"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ProductFinderHeader;
