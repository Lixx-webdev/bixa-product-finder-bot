import React from 'react';
import { Youtube, Instagram, Linkedin, Facebook, Leaf } from 'lucide-react';
import { trackProductFinderEvent } from '../../utils/analytics';

// TODO: swap in BIXA's real social URLs once provided — currently a placeholder fallback so the
// icons are clickable without guessing at handles.
const SOCIAL_LINKS = [
  { key: 'youtube', Icon: Youtube, url: 'https://bixabotanical.in' },
  { key: 'instagram', Icon: Instagram, url: 'https://bixabotanical.in' },
  { key: 'linkedin', Icon: Linkedin, url: 'https://bixabotanical.in' },
  { key: 'facebook', Icon: Facebook, url: 'https://bixabotanical.in' }
];

const handleSocialClick = (key) => {
  trackProductFinderEvent('social_link_clicked', { network: key });
};

// Full footer (social row + tagline + leaf note) shown on list/menu screens. Detail-style screens
// use `variant="minimal"` for just the leaf note, matching the design mockup's reduced footer there.
const WidgetFooter = ({ variant = 'full' }) => {
  if (variant === 'minimal') {
    return (
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
        <Leaf className="w-3.5 h-3.5 text-bixa-green" />
        <span>100% Pure & Authentic Herbal Formulations</span>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-4 border-t border-gray-100 space-y-3">
      <div className="flex items-center justify-center gap-3">
        {SOCIAL_LINKS.map(({ key, Icon, url }) => (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleSocialClick(key)}
            className="w-9 h-9 rounded-full bg-bixa-lightgreen/60 flex items-center justify-center text-bixa-darkgreen hover:bg-bixa-lightgreen transition-colors"
            aria-label={key}
          >
            <Icon className="w-4 h-4" />
          </a>
        ))}
      </div>
      <p className="font-heading text-sm font-bold text-bixa-darkgreen text-center">
        Pure &nbsp;•&nbsp; Potent &nbsp;•&nbsp; Proven
      </p>
      <div className="pt-2 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
        <Leaf className="w-3.5 h-3.5 text-bixa-green" />
        <span>100% Pure & Authentic Herbal Formulations</span>
      </div>
    </div>
  );
};

export default WidgetFooter;
