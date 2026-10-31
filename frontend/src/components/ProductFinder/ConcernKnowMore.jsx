import React from 'react';
import { Leaf } from 'lucide-react';
import { trackProductFinderEvent } from '../../utils/analytics';
import { parseConcernCopy } from './parseConcernCopy';
import AddToCartButton from './AddToCartButton';

const DOCTOR_CONSULTATION_URL = 'https://bixabotanical.in/pages/free-doctor-consultation';

// The expanded "Know More" screen for a sub-concern's recommended product, navigated to from the
// "Know More" link on ConcernDetail. Shows the fuller Ayurvedic rationale + benefits list that's
// hidden by default.
const ConcernKnowMore = ({ concern, subtopic, productId, onCartChange }) => {
  const products = subtopic?.products || [];
  const product = products.find((p) => p.id === productId) || products[0];
  const blocks = parseConcernCopy(subtopic?.knowMore);
  const introParagraphs = blocks.filter((b) => b.type === 'text');
  const mayHelpHeading = blocks.find((b) => b.type === 'may-help-heading');
  const checklist = blocks.find((b) => b.type === 'checklist');
  const doctorNote = blocks.find((b) => b.type === 'doctor-note');
  const disclaimer = blocks.find((b) => b.type === 'disclaimer');

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 bixa-scrollbar">
      {product && (
        <div className="flex gap-4 items-start">
          <img
            src={product.imageUrl || 'https://bixabotanical.in/cdn/shop/files/placeholder.jpg'}
            alt={product.name}
            className="w-28 h-28 shrink-0 object-contain bg-gray-50 rounded-xl"
            loading="lazy"
          />
          <div className="min-w-0">
            <h3 className="font-heading text-base font-bold text-bixa-darkgreen leading-snug">
              {product.name}
            </h3>
            {introParagraphs.map((p, i) => (
              <p key={i} className="text-xs text-gray-600 leading-relaxed mt-1.5">{p.text}</p>
            ))}
          </div>
        </div>
      )}

      {mayHelpHeading && checklist && (
        <div className="bg-bixa-lightgreen/35 rounded-2xl p-4 space-y-2.5">
          <p className="font-heading text-sm font-bold text-bixa-darkgreen">
            {mayHelpHeading.heading}
          </p>
          <ul className="space-y-2">
            {checklist.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <Leaf className="w-3.5 h-3.5 text-bixa-green shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {doctorNote && (
        <p className="text-xs text-gray-600 leading-relaxed">{doctorNote.text}</p>
      )}

      <div className="flex gap-2">
        <AddToCartButton
          product={product}
          trackingContext={{
            concernId: concern?.id,
            concernName: concern?.name,
            subtopic: subtopic?.title,
            context: 'know_more'
          }}
          onCartChange={onCartChange}
          className="flex-1 py-2.5"
        />
        <a
          href={DOCTOR_CONSULTATION_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackProductFinderEvent('talk_to_doctor_clicked', { context: 'know_more' })}
          className="flex-1 py-2.5 text-center bg-white border border-bixa-darkgreen/60 hover:bg-bixa-lightgreen/20 text-bixa-darkgreen text-xs font-bold rounded-full transition-colors"
        >
          Book Free Doctor Consultation
        </a>
      </div>

      {disclaimer && (
        <p className="text-[11px] italic text-gray-400 leading-relaxed">{disclaimer.text}</p>
      )}

      <div className="pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
        <span>🌿 100% Pure & Authentic Herbal Formulations</span>
      </div>
    </div>
  );
};

export default ConcernKnowMore;
