import React from 'react';
import { Package, HeartHandshake, ChevronRight } from 'lucide-react';
import { trackProductFinderEvent } from '../../utils/analytics';
import WidgetFooter from './WidgetFooter';

const ShopMenu = ({ onSelectPath }) => {
  const handleClick = (path, eventName) => {
    trackProductFinderEvent(eventName);
    onSelectPath(path);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 p-5 overflow-y-auto bixa-scrollbar">
      <p className="font-heading text-base font-bold text-bixa-darkgreen mb-4">
        Choose How to Explore:
      </p>

      <div className="space-y-3">
        <button
          onClick={() => handleClick('PRODUCTS', 'shop_by_products_clicked')}
          className="w-full text-left p-4 bg-white hover:bg-gray-50 border-2 border-bixa-darkgreen/70 rounded-2xl transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 shrink-0 rounded-xl bg-bixa-lightgreen/60 flex items-center justify-center text-bixa-darkgreen">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-bold text-bixa-darkgreen">
                Shop by Products
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Browse Herbs, Formulations & Combos A-Z
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-bixa-darkgreen shrink-0" />
        </button>

        <button
          onClick={() => handleClick('CONCERN', 'shop_by_concern_clicked')}
          className="w-full text-left p-4 bg-white hover:bg-gray-50 border-2 border-bixa-darkgreen/70 rounded-2xl transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 shrink-0 rounded-xl bg-bixa-lightgreen/60 flex items-center justify-center text-bixa-darkgreen">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-bold text-bixa-darkgreen">
                Shop by Concern
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Find products tailored for specific health
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-bixa-darkgreen shrink-0" />
        </button>
      </div>

      <WidgetFooter variant="full" />
    </div>
  );
};

export default ShopMenu;
