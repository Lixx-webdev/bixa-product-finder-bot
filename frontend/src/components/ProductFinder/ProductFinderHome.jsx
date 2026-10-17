import React from 'react';
import { X } from 'lucide-react';
import { trackProductFinderEvent } from '../../utils/analytics';
import BixaLogo from './BixaLogo';
import WidgetFooter from './WidgetFooter';

const DOCTOR_CONSULTATION_URL = 'https://bixabotanical.in/pages/free-doctor-consultation';

const MENU_ITEMS = [
  { key: 'shop', label: 'Shop', type: 'path', target: 'SHOP' },
  { key: 'doctor', label: 'Book Doctor Consultation', type: 'external', target: DOCTOR_CONSULTATION_URL },
  // TODO: replace with the real order-tracking destination once provided.
  { key: 'track', label: 'Track My Order', type: 'external', target: 'https://bixabotanical.in/apps/track' },
  { key: 'support', label: 'Contact Our Support Team', type: 'external', target: 'https://bixabotanical.in/pages/contact-us' },
  { key: 'offers', label: 'Current Offer Details', type: 'external', target: 'https://bixabotanical.in/pages/offers' },
  { key: 'bulk', label: 'For Bulk Enquiries', type: 'external', target: 'https://bixabotanical.in/pages/bulk-enquiry-new' },
  { key: 'returns', label: 'Return Policy', type: 'external', target: 'https://bixabotanical.in/pages/return-refund-policy' }
];

const ProductFinderHome = ({ onSelectPath, onClose }) => {
  const handleItemClick = (item) => {
    trackProductFinderEvent('home_menu_item_clicked', { item: item.key });
    if (item.type === 'path') {
      onSelectPath(item.target);
    } else {
      window.open(item.target, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto bixa-scrollbar bg-white relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-bixa-darkgreen hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
        aria-label="Close Product Finder"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex flex-col flex-1 min-h-0 px-6 pt-8 pb-5 justify-between">
        <div>
          <BixaLogo className="mb-6" />

          <h1 className="font-heading text-xl font-bold text-bixa-darkgreen text-center mb-5">
            How we May Help You?
          </h1>

          <div className="space-y-3.5">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => handleItemClick(item)}
                className="w-full py-3.5 px-5 bg-white border-2 border-bixa-darkgreen/80 hover:bg-bixa-lightgreen/20 rounded-2xl transition-colors"
              >
                <span className="font-heading text-sm font-bold text-bixa-darkgreen">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <WidgetFooter variant="full" />
      </div>
    </div>
  );
};

export default ProductFinderHome;
