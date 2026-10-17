import React from 'react';
import bixaLogoUrl from '../../assets/bixa-logo.svg';

// Official BIXA Botanical logo mark (icon + "bixa™" wordmark + "BOTANICAL" sub-label), supplied
// as a brand asset — the sub-label is already baked into the SVG, so nothing is added here.
const BixaLogo = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img src={bixaLogoUrl} alt="BIXA Botanical" className="h-14 w-auto" />
    </div>
  );
};

export default BixaLogo;
