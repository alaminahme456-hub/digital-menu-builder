'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  MessageCircle,
} from 'lucide-react';
import type { Business, MenuCategory, MenuItem } from '@/lib/types';
import { formatPrice } from '@/lib/auth';
import { useSwipeGesture, useReducedMotion, useCanAnimate, useBookDimensions } from './use-swipe-gesture';
import ProductDetailModal from './product-detail-modal';
import OrderBasket from './order-basket';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface FlipbookMenuProps {
  business: Business;
  categories: MenuCategory[];
  items: MenuItem[];
  isPreview?: boolean;
}

interface PageItem {
  type: 'cover' | 'welcome' | 'category' | 'contact';
  categoryId?: string;
  title: string;
  items?: MenuItem[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function buildPages(categories: MenuCategory[], items: MenuItem[], business: Business): PageItem[] {
  const pages: PageItem[] = [];
  pages.push({ type: 'cover', title: business.name });
  if (business.description) {
    pages.push({ type: 'welcome', title: 'Welcome' });
  }
  for (const cat of categories) {
    const catItems = items
      .filter((item) => item.categoryId === cat.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    if (catItems.length > 0) {
      pages.push({ type: 'category', categoryId: cat.id, title: cat.name, items: catItems });
    }
  }
  pages.push({ type: 'contact', title: 'Contact & Ordering' });
  return pages;
}

const animDurationMap: Record<string, string> = {
  slow: '0.6s',
  medium: '0.35s',
  fast: '0.2s',
};

/* ------------------------------------------------------------------ */
/*  Flipbook Menu Component — Always Fullscreen                        */
/* ------------------------------------------------------------------ */
export default function FlipbookMenu({
  business,
  categories,
  items,
  isPreview = false,
}: FlipbookMenuProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isOpening, setIsOpening] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animDirection, setAnimDirection] = useState<'next' | 'prev'>('next');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [basket, setBasket] = useState<Map<string, number>>(new Map());

  const bookRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const canAnimate = useCanAnimate();
  const shouldAnimate = business.flipbookAnimEnabled && !prefersReducedMotion && canAnimate;

  const pages = useMemo(() => buildPages(categories, items, business), [categories, items, business]);
  const totalPages = pages.length;

  const goNext = useCallback(() => {
    if (currentPage < totalPages - 1 && !isAnimating) {
      setAnimDirection('next');
      setIsAnimating(true);
      setTimeout(() => { setCurrentPage((p) => p + 1); setIsAnimating(false); }, shouldAnimate ? 80 : 0);
    }
  }, [currentPage, totalPages, isAnimating, shouldAnimate]);

  const goPrev = useCallback(() => {
    if (currentPage > 0 && !isAnimating) {
      setAnimDirection('prev');
      setIsAnimating(true);
      setTimeout(() => { setCurrentPage((p) => p - 1); setIsAnimating(false); }, shouldAnimate ? 80 : 0);
    }
  }, [currentPage, isAnimating, shouldAnimate]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') {
        if (selectedItem) setSelectedItem(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, selectedItem]);

  // Swipe — always active for navigation
  const swipeHandlers = useSwipeGesture(
    { onSwipeLeft: isOpened && !selectedItem ? goNext : undefined, onSwipeRight: isOpened && !selectedItem ? goPrev : undefined },
    30
  );

  const handleOpenBook = () => {
    setIsOpening(true);
    setTimeout(() => { setIsOpened(true); setIsOpening(false); setCurrentPage(1); }, shouldAnimate ? 500 : 30);
  };

  const handleCloseBook = () => { setIsOpened(false); setCurrentPage(0); };

  // Basket
  const addToBasket = useCallback((item: MenuItem, qty: number) => {
    setBasket((prev) => {
      const next = new Map(prev);
      if (qty <= 0) next.delete(item.id);
      else next.set(item.id, qty);
      return next;
    });
  }, []);

  const basketTotal = useMemo(() => {
    let total = 0, count = 0;
    basket.forEach((qty, id) => {
      const item = items.find((i) => i.id === id);
      if (item) { total += item.price * qty; count += qty; }
    });
    return { total, count };
  }, [basket, items]);

  const openWhatsApp = useCallback((singleItem?: MenuItem, singleQty?: number) => {
    const phone = business.whatsapp || '';
    if (!phone) return;
    let message: string;
    if (singleItem && singleQty) {
      message = `${business.whatsappGreeting}\n\n${singleItem.name} x ${singleQty} - ${formatPrice(singleItem.price * singleQty)}\n\nTotal: ${formatPrice(singleItem.price * singleQty)}`;
    } else {
      const lines: string[] = [`${business.whatsappGreeting}`, ''];
      basket.forEach((qty, id) => {
        const item = items.find((i) => i.id === id);
        if (item) lines.push(`${item.name} x ${qty} - ${formatPrice(item.price * qty)}`);
      });
      lines.push('', `Total: ${formatPrice(basketTotal.total)}`, '', 'Please confirm my order.');
      message = lines.join('\n');
    }
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  }, [business, items, basket, basketTotal.total]);

  const animDuration = animDurationMap[business.flipbookAnimSpeed] || '0.35s';
  const primaryColor = business.primaryColor || '#10b981';
  const secondaryColor = business.secondaryColor || '#059669';
  const fontMap: Record<string, React.CSSProperties['fontFamily']> = {
    inter: 'system-ui, -apple-system, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: '"Courier New", monospace',
    playfair: '"Playfair Display", Georgia, serif',
  };
  const fontFamily = fontMap[business.fontFamily] || fontMap.inter;

  const handlePageTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedItem || !isOpened || !business.flipbookInteractions) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.3) goPrev();
    else if (x > rect.width * 0.7) goNext();
  };

  const getPageTransitionClass = () => {
    if (!isOpened) return '';
    if (isOpening) return shouldAnimate ? 'animate-page-flip-open' : '';
    if (isAnimating) {
      if (shouldAnimate) return animDirection === 'next' ? 'animate-page-flip-next' : 'animate-page-flip-prev';
      return animDirection === 'next' ? 'animate-slide-right' : 'animate-slide-left';
    }
    return '';
  };

  /* ------------------------------------------------------------------ */
  /*  Render: Cover                                                      */
  /* ------------------------------------------------------------------ */
  const renderCover = () => (
    <div className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`, fontFamily }}>
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 25px, rgba(255,255,255,0.1) 25px, rgba(255,255,255,0.1) 50px)`,
      }} />
      <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
        {business.logo ? (
          <img src={business.logo} alt={business.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-2xl ring-3 ring-white/20" />
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-2xl ring-3 ring-white/20 bg-white/15">
            {business.name.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{business.name}</h1>
        {business.description && (
          <p className="text-white/70 text-sm sm:text-base max-w-xs">&ldquo;{business.description}&rdquo;</p>
        )}
        <div className="w-12 h-0.5 bg-white/30 rounded-full mt-1" />
        <button onClick={handleOpenBook}
          className="mt-3 px-7 py-3 bg-white text-gray-900 rounded-full font-semibold text-sm shadow-lg active:scale-95 transition-all flex items-center gap-2">
          <BookOpen className="w-4 h-4" />Tap to Open Menu
        </button>
        <p className="text-white/30 text-[10px] mt-1">{categories.length} categories &middot; {items.length} items</p>
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  Render: Welcome                                                    */
  /* ------------------------------------------------------------------ */
  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center w-full h-full p-6 sm:p-8 text-center overflow-y-auto" style={{ fontFamily }}>
      <div className="w-10 h-1 rounded-full mb-4" style={{ backgroundColor: primaryColor }} />
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Welcome to {business.name}</h2>
      {(business as Record<string, unknown>).welcomeMessage
        ? <p className="text-gray-600 text-sm leading-relaxed max-w-sm">{(business as Record<string, unknown>).welcomeMessage as string}</p>
        : business.description
          ? <p className="text-gray-600 text-sm leading-relaxed max-w-sm">{business.description}</p>
          : <p className="text-gray-600 text-sm leading-relaxed max-w-sm">Thank you for visiting. Explore our menu.</p>
      }
      <p className="mt-6 text-xs text-gray-300">Swipe or tap arrows to navigate</p>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  Render: Category                                                   */
  /* ------------------------------------------------------------------ */
  const renderCategoryPage = (page: PageItem) => {
    if (!page.items) return null;
    return (
      <div className="flex flex-col w-full h-full p-4 sm:p-6 overflow-y-auto" style={{ fontFamily }}>
        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: primaryColor }} />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">{page.title}</h2>
          <span className="text-[10px] text-gray-400 ml-auto">{page.items.length}</span>
        </div>
        <div className="grid gap-2 sm:gap-3 flex-1 min-h-0 overflow-y-auto pb-16 no-scrollbar">
          {page.items.map((item) => (
            <button
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                if (business.flipbookInteractions && item.available) setSelectedItem(item);
              }}
              disabled={!item.available || !business.flipbookInteractions}
              className={`flex gap-2.5 p-2.5 rounded-xl border text-left transition-all active:scale-[0.98] ${
                item.available && business.flipbookInteractions
                  ? 'hover:shadow-sm hover:border-gray-300 cursor-pointer'
                  : 'opacity-40 cursor-default'
              }`}
            >
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0" loading="lazy" decoding="async" />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center flex-shrink-0 text-lg font-bold"
                  style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                  {item.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h3>
                {item.description && <p className="text-gray-500 text-[11px] mt-0.5 line-clamp-1">{item.description}</p>}
                <p className="font-bold text-xs mt-1" style={{ color: primaryColor }}>{formatPrice(item.price)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  Render: Contact                                                    */
  /* ------------------------------------------------------------------ */
  const renderContactPage = () => (
    <div className="flex flex-col items-center justify-center w-full h-full p-6 sm:p-8 text-center overflow-y-auto" style={{ fontFamily }}>
      <div className="w-10 h-1 rounded-full mb-4" style={{ backgroundColor: primaryColor }} />
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Contact & Ordering</h2>
      <div className="space-y-2 text-xs sm:text-sm text-gray-600 mb-6">
        {business.address && <p>{business.address}</p>}
        {business.phone && <p>{business.phone}</p>}
        {business.whatsapp && <p>{business.whatsapp}</p>}
      </div>
      {business.whatsappOrder && business.whatsapp && basketTotal.count > 0 && (
        <button onClick={() => openWhatsApp()}
          className="px-7 py-3 rounded-full text-white font-semibold text-sm shadow-lg active:scale-95 transition-all"
          style={{ backgroundColor: '#25D366' }}>
          Order on WhatsApp ({formatPrice(basketTotal.total)})
        </button>
      )}
      {!business.whatsappOrder && (
        <div className="flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-xl text-sm text-gray-400">
          <MessageCircle className="w-4 h-4" />
          Ordering is currently unavailable
        </div>
      )}
      <p className="mt-6 text-[10px] text-gray-300">MADE BY <span className="font-semibold">ALTECH</span></p>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  Render: Current Page                                               */
  /* ------------------------------------------------------------------ */
  const renderPageContent = () => {
    const page = pages[currentPage];
    if (!page) return null;
    switch (page.type) {
      case 'cover': return renderCover();
      case 'welcome': return renderWelcome();
      case 'category': return renderCategoryPage(page);
      case 'contact': return renderContactPage();
      default: return null;
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Always Fullscreen — swipe anywhere on screen for navigation         */
  /* ------------------------------------------------------------------ */
  return (
    <div ref={bookRef}
      className="fixed inset-0 z-[9999] bg-white overflow-hidden flipbook-container safe-top safe-bottom"
      style={{ fontFamily }}
      onTouchStart={swipeHandlers.onTouchStart}
      onTouchMove={swipeHandlers.onTouchMove}
      onTouchEnd={swipeHandlers.onTouchEnd}>

      {/* Back to cover button */}
      {isOpened && currentPage > 0 && (
        <button onClick={(e) => { e.stopPropagation(); handleCloseBook(); }}
          className="absolute top-3 left-3 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-md"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
          <BookOpen className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Page content */}
      <div className={`w-full h-full flex items-center justify-center ${getPageTransitionClass()} flip-page`}
        onClick={handlePageTap} style={{ '--anim-duration': animDuration } as React.CSSProperties}>
        <div className="w-full h-full max-w-lg mx-auto">{renderPageContent()}</div>
      </div>

      {/* Navigation arrows at bottom */}
      {isOpened && <FlipNavigation currentPage={currentPage} totalPages={totalPages} onPrev={goPrev} onNext={goNext}
        showPageNumbers={business.flipbookPageNumbers} primaryColor={primaryColor} />}

      <OrderBasket items={items} basket={basket} onUpdate={addToBasket} onClear={() => setBasket(new Map())}
        onOrder={openWhatsApp} business={business} basketTotal={basketTotal} />
      {selectedItem && (
        <ProductDetailModal item={selectedItem} business={business} onClose={() => setSelectedItem(null)}
          onAddToBasket={addToBasket} onOrderDirect={(item, qty) => { openWhatsApp(item, qty); setSelectedItem(null); }} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FlipNavigation — Full-width swipe areas with visible arrows         */
/* ------------------------------------------------------------------ */
interface FlipNavigationProps {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  showPageNumbers: boolean;
  primaryColor: string;
}

function FlipNavigation({ currentPage, totalPages, onPrev, onNext, showPageNumbers, primaryColor }: FlipNavigationProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>

      {/* Left swipe area */}
      <div className="absolute left-0 top-0 bottom-0 w-[30%] pointer-events-auto flex items-center justify-start"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}>
        <div className="ml-2 flex items-center gap-1 opacity-40">
          <ChevronLeft className="w-6 h-6 text-gray-500" />
        </div>
      </div>

      {/* Right swipe area */}
      <div className="absolute right-0 top-0 bottom-0 w-[30%] pointer-events-auto flex items-center justify-end"
        onClick={(e) => { e.stopPropagation(); onNext(); }}>
        <div className="mr-2 flex items-center gap-1 opacity-40">
          <ChevronRight className="w-6 h-6 text-gray-500" />
        </div>
      </div>

      {/* Bottom navigation bar */}
      <div className="flex items-center justify-between px-3 pt-3">
        <button onClick={(e) => { e.stopPropagation(); onPrev(); }} disabled={currentPage <= 1}
          className="pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-gray-100 disabled:opacity-20 disabled:cursor-not-allowed active:scale-90 transition-all"
          aria-label="Previous page">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>

        {showPageNumbers && (
          <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-xs font-semibold text-gray-500 shadow-sm border border-gray-100">
            {currentPage} / {totalPages - 1}
          </div>
        )}

        <button onClick={(e) => { e.stopPropagation(); onNext(); }} disabled={currentPage >= totalPages - 1}
          className="pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-gray-100 disabled:opacity-20 disabled:cursor-not-allowed active:scale-90 transition-all"
          aria-label="Next page">
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>
    </div>
  );
}
