import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Loader2, ListTree } from 'lucide-react';
import { trackProductFinderEvent } from '../../utils/analytics';
import WidgetFooter from './WidgetFooter';

// Intermediate screen shown after picking a concern that has multiple sub-concerns (e.g. Hair
// Wellness -> Hair Fall Support / Hair Growth Support / ...). Fetches the concern's parsed
// sections so each sub-concern can be selected individually.
const ConcernSubtopics = ({ concern, onSelectSubtopic }) => {
  const [sections, setSections] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchSections = async () => {
      if (!concern || !concern.slug) return;
      setLoading(true);
      setError(null);
      try {
        const apiBase = window.__BIXA_API_BASE__ || '/api/product-finder';
        const res = await fetch(`${apiBase}/concerns/${concern.slug}`);
        const data = await res.json();

        if (isMounted) {
          if (data.success && data.data?.sections?.length > 0) {
            setSections(data.data.sections);
          } else {
            setError('Failed to load sub-concerns');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching concern sub-concerns:', err);
          setError('Network error while loading sub-concerns.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSections();
    return () => { isMounted = false; };
  }, [concern]);

  const handleClick = (section) => {
    trackProductFinderEvent('concern_subtopic_selected', {
      concernId: concern?.id,
      concernName: concern?.name,
      subtopic: section.title
    });
    onSelectSubtopic(section);
  };

  const visibleSections = (sections || []).filter(s =>
    !searchQuery.trim() || s.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

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
            <span className="text-xs font-medium">Loading sub-concerns...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 px-4 text-xs text-red-500 font-medium">
            {error}
          </div>
        ) : visibleSections.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-xl border border-dashed border-gray-200">
            <ListTree className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-gray-700">No sub-concerns available</h4>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleSections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleClick(section)}
                className="w-full text-left p-3.5 bg-white border-2 border-bixa-darkgreen/70 hover:bg-bixa-lightgreen/15 rounded-2xl transition-colors flex items-center justify-between"
              >
                <h4 className="font-heading text-sm font-bold text-bixa-darkgreen">
                  {section.title.replace(/^\d+\.\s*/, '')}
                </h4>
                <ChevronRight className="w-4 h-4 text-bixa-darkgreen shrink-0" />
              </button>
            ))}
          </div>
        )}

        <WidgetFooter variant="minimal" />
      </div>
    </div>
  );
};

export default ConcernSubtopics;
