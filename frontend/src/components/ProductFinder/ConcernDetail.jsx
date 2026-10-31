import React, { useState, useEffect } from 'react';
import { Loader2, Home } from 'lucide-react';
import { trackProductFinderEvent } from '../../utils/analytics';
import { catalogRequest } from '../../utils/catalogClient';
import { parseConcernCopy } from './parseConcernCopy';
import AddToCartButton from './AddToCartButton';

const DOCTOR_CONSULTATION_URL = 'https://bixabotanical.in/pages/free-doctor-consultation';
// How many products one recommendation shows. The first one its copy names is used.
const MAX_RECOMMENDED_PRODUCTS = 1;

// Shows the recommended product(s) for a concern (or, when reached via ConcernSubtopics, for one
// of its sub-concerns), matching the "we recommend <product>" + "Best for:" design. Each
// sub-concern carries only the products its own message text names.
const ConcernDetail = ({ concern, subtopic, onBackToHome, onKnowMore, onCartChange }) => {
  const [concernData, setConcernData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchConcernDetail = async () => {
      if (!concern || !concern.slug) return;
      setLoading(true);
      try {
        const data = await catalogRequest(`/concerns/${concern.slug}`);

        if (isMounted) {
          if (data.success && data.data) {
            setConcernData(data.data);
          } else {
            setConcernData(concern);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching concern details:', err);
          setConcernData(concern);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchConcernDetail();
    return () => { isMounted = false; };
  }, [concern]);

  const activeConcern = concernData || concern;
  const products = (subtopic ? (subtopic.products || []) : (activeConcern?.products || [])).slice(0, MAX_RECOMMENDED_PRODUCTS);
  const displayMessage = subtopic ? (subtopic.summary ?? subtopic.body) : activeConcern?.message;
  const hasKnowMore = Boolean(subtopic?.knowMore);

  const blocks = parseConcernCopy(displayMessage);
  const leadProduct = blocks.find((b) => b.type === 'lead-product');
  const bestFor = blocks.find((b) => b.type === 'best-for');
  const doctorNote = blocks.find((b) => b.type === 'doctor-note');
  // Product notes and safety wording, e.g. "Individual results may vary..." or "Please note: ...".
  const notes = blocks.filter((b) => b.type === 'text' || b.type === 'disclaimer');
  const isPlaceholder = !leadProduct && products.length === 0;

  const handleKnowMoreClick = (product) => {
    trackProductFinderEvent('concern_know_more_opened', {
      concernId: activeConcern?.id,
      concernName: activeConcern?.name,
      subtopic: subtopic?.title,
      productId: product?.id,
      productName: product?.name
    });
    onKnowMore(product?.id);
  };

  const handleMainMenu = () => {
    trackProductFinderEvent('concern_go_to_main_menu_clicked', {
      concernId: activeConcern?.id,
      concernName: activeConcern?.name,
      subtopic: subtopic?.title
    });
    onBackToHome();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center gap-2 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin text-bixa-green" />
        <span className="text-xs font-medium">Loading recommendation...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 bixa-scrollbar">
      {isPlaceholder ? (
        <div className="space-y-4">
          <div className="bg-bixa-lightgreen/30 border border-bixa-green/20 rounded-2xl p-5 text-center">
            <p className="font-heading text-base font-bold text-bixa-darkgreen mb-2">
              Content coming soon
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              We're still preparing tailored recommendations for {activeConcern?.name}. In the
              meantime, our Ayurvedic doctor can guide you personally — free of charge.
            </p>
          </div>
          <a
            href={DOCTOR_CONSULTATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackProductFinderEvent('talk_to_doctor_clicked', { context: 'concern_placeholder' })}
            className="block w-full text-center py-3 bg-bixa-darkgreen hover:bg-bixa-green text-white rounded-full font-heading font-bold text-sm transition-colors"
          >
            Book a Free Doctor Consultation
          </a>
        </div>
      ) : (
        <>
          {leadProduct && (
            <div>
              <p className="text-sm text-gray-600">{leadProduct.lead}</p>
              <p className="font-heading text-lg font-bold text-bixa-darkgreen leading-snug mt-0.5">
                {leadProduct.product.split(/\s+and\s+/i).slice(0, MAX_RECOMMENDED_PRODUCTS).join(' and ')}
              </p>
            </div>
          )}

          {bestFor && (
            <div className="bg-bixa-lightgreen/35 rounded-2xl p-4">
              <p className="text-sm text-gray-800">
                <span className="font-bold">Best for:</span>{' '}
                {bestFor.items.join(', ')}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {products.map((product) => (
              <div key={product.id || product.slug} className="border-2 border-bixa-darkgreen/60 rounded-2xl p-3.5">
                <div className="flex gap-3">
                  <img
                    src={product.imageUrl || 'https://bixabotanical.in/cdn/shop/files/placeholder.jpg'}
                    alt={product.name}
                    className="w-20 h-20 shrink-0 object-contain bg-gray-50 rounded-xl"
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <h3 className="font-heading text-sm font-bold text-bixa-darkgreen leading-snug">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    {hasKnowMore && (
                      <button
                        onClick={() => handleKnowMoreClick(product)}
                        className="text-[11px] font-semibold text-bixa-green underline mt-1"
                      >
                        Know More
                      </button>
                    )}
                  </div>
                </div>

                <AddToCartButton
                  product={product}
                  trackingContext={{
                    concernId: activeConcern?.id,
                    concernName: activeConcern?.name,
                    subtopic: subtopic?.title
                  }}
                  onCartChange={onCartChange}
                  className="w-full py-2 mt-3"
                />
              </div>
            ))}
          </div>

          <div>
            <a
              href={DOCTOR_CONSULTATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackProductFinderEvent('talk_to_doctor_clicked', { context: 'concern_detail_card' })}
              className="block w-full py-2 text-center bg-white border border-bixa-darkgreen/60 hover:bg-bixa-lightgreen/20 text-bixa-darkgreen text-xs font-bold rounded-full transition-colors"
            >
              Book Free Doctor Consultation
            </a>

            <button
              onClick={handleMainMenu}
              className="w-full text-center text-[11px] font-semibold text-gray-500 hover:text-bixa-darkgreen mt-2 inline-flex items-center justify-center gap-1"
            >
              <Home className="w-3 h-3" />
              Main Menu
            </button>
          </div>

          {notes.map((note, i) => (
            <p key={i} className="text-[11px] text-gray-500 leading-relaxed">{note.text}</p>
          ))}

          {doctorNote && (
            <p className="text-xs text-gray-600 leading-relaxed">{doctorNote.text}</p>
          )}
        </>
      )}

      <div className="pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
        <span>🌿 100% Pure & Authentic Herbal Formulations</span>
      </div>
    </div>
  );
};

export default ConcernDetail;
