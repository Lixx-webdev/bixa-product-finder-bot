import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Loader2, Heart } from 'lucide-react';
import { trackProductFinderEvent } from '../../utils/analytics';
import { catalogRequest } from '../../utils/catalogClient';
import { getConcernIcon } from './concernIcons';
import WidgetFooter from './WidgetFooter';

const ShopByConcern = ({ onSelectConcern }) => {
  const [concerns, setConcerns] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchConcerns = async () => {
      setLoading(true);
      try {
        const path = searchQuery.trim()
          ? `/concerns?q=${encodeURIComponent(searchQuery.trim())}`
          : '/concerns';

        const data = await catalogRequest(path);

        if (isMounted) {
          if (data.success) {
            setConcerns(data.data || []);
          } else {
            setError('Failed to load health concerns');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Fetch concerns error:', err);
          setError('Network error while loading concerns.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchConcerns();
    return () => { isMounted = false; };
  }, [searchQuery]);

  const handleConcernClick = (concern) => {
    trackProductFinderEvent('concern_selected', {
      concernId: concern.id,
      concernName: concern.name,
      slug: concern.slug
    });
    onSelectConcern(concern);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-4 py-3.5 bg-white border-b border-gray-100">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search health concerns (e.g., Hair, Heart, Joint)..."
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-bixa-green/20 focus:border-bixa-green/40 transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 bixa-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-bixa-green" />
            <span className="text-xs font-medium">Loading wellness concerns...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 px-4 text-xs text-red-500 font-medium">
            {error}
          </div>
        ) : concerns.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-xl border border-dashed border-gray-200">
            <Heart className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-gray-700">No matching concerns</h4>
            <p className="text-[11px] text-gray-400 mt-1">Try another search term.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {concerns.map((concern) => {
              const Icon = getConcernIcon(concern.name);
              return (
                <button
                  key={concern.id || concern.slug}
                  onClick={() => handleConcernClick(concern)}
                  className="w-full text-left p-3.5 bg-white border-2 border-bixa-darkgreen/70 hover:bg-bixa-lightgreen/15 rounded-2xl transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 shrink-0 rounded-lg bg-bixa-lightgreen/60 flex items-center justify-center text-bixa-darkgreen">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <h4 className="font-heading text-sm font-bold text-bixa-darkgreen">
                      {concern.name}
                    </h4>
                  </div>
                  <ChevronRight className="w-4 h-4 text-bixa-darkgreen shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        <WidgetFooter variant="full" />
      </div>
    </div>
  );
};

export default ShopByConcern;
