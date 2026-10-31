import React, { useState, useRef, useCallback, useEffect } from 'react';
import ProductFinderHeader from './ProductFinderHeader';
import ProductFinderHome from './ProductFinderHome';
import ShopByConcern from './ShopByConcern';
import ConcernSubtopics from './ConcernSubtopics';
import ConcernDetail from './ConcernDetail';
import ConcernKnowMore from './ConcernKnowMore';
import { getConcernIcon } from './concernIcons';
import { ScrollText, ShoppingCart } from 'lucide-react';
import { trackProductFinderEvent } from '../../utils/analytics';
import { getCartCount, openCartDrawer } from '../../utils/cart';

const DEFAULT_SIZE = { width: 400, height: 640 };
const MIN_SIZE = { width: 320, height: 420 };
const MAX_SIZE = { width: 640, height: 860 };

const ProductFinderWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  // HOME | CONCERN | CONCERN_SUBTOPICS | CONCERN_DETAIL | CONCERN_KNOWMORE
  const [currentScreen, setCurrentScreen] = useState('HOME');
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);
  const [knowMoreProductId, setKnowMoreProductId] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  // Real-time resizing (desktop/floating mode only — mobile stays full-screen by design).
  const [panelSize, setPanelSize] = useState(DEFAULT_SIZE);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 640);
  const resizeStateRef = useRef(null);

  useEffect(() => {
    const onViewportResize = () => setIsDesktop(window.innerWidth >= 640);
    window.addEventListener('resize', onViewportResize);
    return () => window.removeEventListener('resize', onViewportResize);
  }, []);

  const handleResizeMove = useCallback((e) => {
    const state = resizeStateRef.current;
    if (!state) return;
    const point = e.touches ? e.touches[0] : e;
    const deltaX = state.startX - point.clientX;
    const deltaY = state.startY - point.clientY;
    setPanelSize({
      width: Math.min(MAX_SIZE.width, Math.max(MIN_SIZE.width, state.startWidth + deltaX)),
      height: Math.min(MAX_SIZE.height, Math.max(MIN_SIZE.height, state.startHeight + deltaY))
    });
  }, []);

  const handleResizeEnd = useCallback(() => {
    resizeStateRef.current = null;
    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeEnd);
    window.removeEventListener('touchmove', handleResizeMove);
    window.removeEventListener('touchend', handleResizeEnd);
  }, [handleResizeMove]);

  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    const point = e.touches ? e.touches[0] : e;
    resizeStateRef.current = {
      startX: point.clientX,
      startY: point.clientY,
      startWidth: panelSize.width,
      startHeight: panelSize.height
    };
    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
    window.addEventListener('touchmove', handleResizeMove, { passive: false });
    window.addEventListener('touchend', handleResizeEnd);
  }, [panelSize, handleResizeMove, handleResizeEnd]);

  const toggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setCurrentScreen('HOME');
      trackProductFinderEvent('chatbot_opened');
      // Items may have been added or removed outside the widget. Off the store this request fails,
      // and the cart bar simply stays hidden.
      getCartCount().then(setCartCount).catch(() => {});
    }
  };

  const handleSelectPath = (path) => {
    setCurrentScreen(path);
  };

  const handleSelectConcern = (concern) => {
    setSelectedConcern(concern);
    setSelectedSubtopic(null);
    if (concern.subConcerns && concern.subConcerns.length > 0) {
      setCurrentScreen('CONCERN_SUBTOPICS');
    } else {
      setCurrentScreen('CONCERN_DETAIL');
    }
  };

  const handleSelectSubtopic = (subtopic) => {
    setSelectedSubtopic(subtopic);
    setCurrentScreen('CONCERN_DETAIL');
  };

  const handleBackToHome = () => setCurrentScreen('HOME');
  const handleBackToConcerns = () => setCurrentScreen('CONCERN');

  const handleBackFromDetail = () => {
    if (selectedSubtopic) {
      setCurrentScreen('CONCERN_SUBTOPICS');
    } else {
      setCurrentScreen('CONCERN');
    }
  };

  const handleKnowMore = (productId) => {
    setKnowMoreProductId(productId);
    setCurrentScreen('CONCERN_KNOWMORE');
  };
  const handleBackFromKnowMore = () => setCurrentScreen('CONCERN_DETAIL');

  const ConcernIcon = selectedConcern ? getConcernIcon(selectedConcern.name) : null;

  return (
    <div className="bixa-product-finder-root font-sans antialiased text-gray-800">
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="fixed bottom-5 right-5 z-[2147483000] flex items-center gap-2 px-4 py-3 bg-bixa-darkgreen hover:bg-bixa-green text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-4 focus:ring-bixa-green/20"
          aria-label="Open BIXA Product Finder"
        >
          <span className="text-lg leading-none">🌿</span>
          <span className="text-xs font-semibold tracking-wide">Find a BIXA Product</span>
        </button>
      )}

      {isOpen && (
        <div
          className="fixed bottom-0 right-0 sm:bottom-5 sm:right-5 z-[2147483000] w-full sm:w-[400px] h-[100dvh] sm:h-[640px] max-h-[100dvh] bg-white sm:rounded-3xl shadow-xl flex flex-col overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-200"
          style={isDesktop ? { width: panelSize.width, height: panelSize.height } : undefined}
        >
            {isDesktop && (
              <div
                onMouseDown={handleResizeStart}
                onTouchStart={handleResizeStart}
                className="absolute top-0 left-0 w-6 h-6 z-20 cursor-nwse-resize flex items-start justify-start p-1.5 touch-none"
                aria-label="Resize chat window"
                role="separator"
              >
                <div className="w-3 h-3 border-t-2 border-l-2 border-bixa-darkgreen/30 rounded-tl-sm" />
              </div>
            )}

            {currentScreen === 'HOME' && (
              <ProductFinderHome onSelectPath={handleSelectPath} onClose={toggleOpen} />
            )}

            {currentScreen !== 'HOME' && (
              <ProductFinderHeader
                onClose={toggleOpen}
                onBack={
                  currentScreen === 'CONCERN' ? handleBackToHome
                  : currentScreen === 'CONCERN_SUBTOPICS' ? handleBackToConcerns
                  : currentScreen === 'CONCERN_DETAIL' ? handleBackFromDetail
                  : currentScreen === 'CONCERN_KNOWMORE' ? handleBackFromKnowMore
                  : handleBackToHome
                }
                Icon={
                  currentScreen === 'CONCERN' ? ScrollText
                  : currentScreen === 'CONCERN_SUBTOPICS' ? ConcernIcon
                  : null
                }
                title={
                  currentScreen === 'CONCERN' ? 'Shop by Concern'
                  : currentScreen === 'CONCERN_SUBTOPICS' ? selectedConcern?.name
                  : currentScreen === 'CONCERN_DETAIL' ? (selectedSubtopic ? selectedSubtopic.title.replace(/^\d+\.\s*/, '') : selectedConcern?.name)
                  : currentScreen === 'CONCERN_KNOWMORE' ? (selectedSubtopic ? selectedSubtopic.title.replace(/^\d+\.\s*/, '') : selectedConcern?.name)
                  : 'BIXA Product Finder'
                }
                subtitle="Authentic Herbal & Ayurvedic Discovery"
              />
            )}

            {currentScreen !== 'HOME' && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
              {currentScreen === 'CONCERN' && (
                <ShopByConcern onSelectConcern={handleSelectConcern} />
              )}

              {currentScreen === 'CONCERN_SUBTOPICS' && (
                <ConcernSubtopics
                  concern={selectedConcern}
                  onSelectSubtopic={handleSelectSubtopic}
                />
              )}

              {currentScreen === 'CONCERN_DETAIL' && (
                <ConcernDetail
                  concern={selectedConcern}
                  subtopic={selectedSubtopic}
                  onBackToHome={handleBackToHome}
                  onKnowMore={handleKnowMore}
                  onCartChange={setCartCount}
                />
              )}

              {currentScreen === 'CONCERN_KNOWMORE' && (
                <ConcernKnowMore
                  concern={selectedConcern}
                  subtopic={selectedSubtopic}
                  productId={knowMoreProductId}
                  onBackToHome={handleBackToHome}
                  onCartChange={setCartCount}
                />
              )}
            </div>
            )}

            {currentScreen !== 'HOME' && cartCount > 0 && (
              <a
                href="/cart"
                onClick={(e) => {
                  trackProductFinderEvent('view_cart_clicked', { itemCount: cartCount });
                  if (openCartDrawer()) e.preventDefault();
                }}
                className="shrink-0 m-3 py-3 inline-flex items-center justify-center gap-2 bg-bixa-darkgreen hover:bg-bixa-green text-white text-sm font-bold rounded-full transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                View Cart & Checkout ({cartCount})
              </a>
            )}
          </div>
      )}
    </div>
  );
};

export default ProductFinderWidget;
