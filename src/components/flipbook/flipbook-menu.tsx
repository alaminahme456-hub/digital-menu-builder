'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  BookOpen,
  Loader2,
} from 'lucide-react';
import type { Business, MenuCategory, MenuItem } from '@/lib/types';
import { formatPrice } from '@/lib/auth';
import { useSwipeGesture, useReducedMotion, useCanAnimate } from './use-swipe-gesture';
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

  // Cover page
  pages.push({ type: 'cover', title: business.name });

  // Welcome page
  if (business.description) {
    pages.push({ type: 'welcome', title: 'Welcome' });
  }

  // Category pages
  for (const cat of categories) {
    const catItems = items
      .filter((item) => item.categoryId === cat.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    if (catItems.length > 0) {
      pages.push({ type: 'category', categoryId: cat.id, title: cat.name, items: catItems });
    }
  }

  // Contact/Ordering page
  pages.push({ type: 'contact', title: 'Contact & Ordering' });

  return pages;
}

const animDurationMap: Record<string, string> = {
  slow: '0.8s',
  medium: '0.5s',
  fast: '0.3s',
};

/* ------------------------------------------------------------------ */
/*  Flipbook Menu Component                                            */
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animDirection, setAnimDirection] = useState<'next' | 'prev'>('next');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [basket, setBasket] = useState<Map<string, number>>(new Map());

  const bookRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const canAnimate = useCanAnimate();
  const shouldAnimate = business.flipbookAnimEnabled && !prefersReducedMotion && canAnimate;

  const pages = useMemo(
    () => buildPages(categories, items, business),
    [categories, items, business]
  );
  const totalPages = pages.length;

  const goNext = useCallback(() => {
    if (currentPage < totalPages - 1 && !isAnimating) {
      setAnimDirection('next');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentPage((p) => p + 1);
        setIsAnimating(false);
      }, shouldAnimate ? 100 : 0);
    }
  }, [currentPage, totalPages, isAnimating, shouldAnimate]);

  const goPrev = useCallback(() => {
    if (currentPage > 0 && !isAnimating) {
      setAnimDirection('prev');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentPage((p) => p - 1);
        setIsAnimating(false);
      }, shouldAnimate ? 100 : 0);
    }
  }, [currentPage, isAnimating, shouldAnimate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
      if (e.key === 'Escape') {
        if (isFullscreen) setIsFullscreen(false);
        if (selectedItem) setSelectedItem(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentPage, totalPages, isOpened, isFullscreen, selectedItem, goNext, goPrev]);

  // Swipe gesture
  const swipeHandlers = useSwipeGesture(
    {
      onSwipeLeft: isOpened && !selectedItem ? goNext : undefined,
      onSwipeRight: isOpened && !selectedItem ? goPrev : undefined,
    },
    40
  );

  const handleOpenBook = () => {
    setIsOpening(true);
    setTimeout(() => {
      setIsOpened(true);
      setIsOpening(false);
      setCurrentPage(1); // Skip to first content page
    }, shouldAnimate ? 700 : 50);
  };

  const handleCloseBook = () => {
    setIsOpened(false);
    setCurrentPage(0);
  };

  // Basket functions
  const addToBasket = useCallback((item: MenuItem, qty: number) => {
    setBasket((prev) => {
      const next = new Map(prev);
      const existing = next.get(item.id) || 0;
      if (qty <= 0) {
        next.delete(item.id);
      } else {
        next.set(item.id, qty);
      }
      return next;
    });
  }, []);

  const basketTotal = useMemo(() => {
    let total = 0;
    let count = 0;
    basket.forEach((qty, id) => {
      const item = items.find((i) => i.id === id);
      if (item) {
        total += item.price * qty;
        count += qty;
      }
    });
    return { total, count };
  }, [basket, items]);

  const openWhatsApp = useCallback(
    (singleItem?: MenuItem, singleQty?: number) => {
      const phone = business.whatsapp || '';
      if (!phone) return;

      let message: string;
      if (singleItem && singleQty) {
        message = `${business.whatsappGreeting}\n\n${singleItem.name} x ${singleQty} - ${formatPrice(singleItem.price * singleQty)}\n\nTotal: ${formatPrice(singleItem.price * singleQty)}\n\nPlease confirm my order. Thank you!`;
      } else {
        const lines: string[] = [`${business.whatsappGreeting}`, ''];
        basket.forEach((qty, id) => {
          const item = items.find((i) => i.id === id);
          if (item) {
            lines.push(`${item.name} x ${qty} - ${formatPrice(item.price * qty)}`);
          }
        });
        lines.push('', `Total: ${formatPrice(basketTotal.total)}`, '', 'Please confirm my order. Thank you!');
        message = lines.join('\n');
      }

      const encoded = encodeURIComponent(message);
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    },
    [business, items, basket, basketTotal.total]
  );

  const animDuration = animDurationMap[business.flipbookAnimSpeed] || '0.5s';
  const primaryColor = business.primaryColor || '#10b981';
  const secondaryColor = business.secondaryColor || '#059669';

  // Font mapping
  const fontMap: Record<string, React.CSSProperties['fontFamily']> = {
    inter: 'system-ui, -apple-system, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: '"Courier New", monospace',
    playfair: '"Playfair Display", Georgia, serif',
  };
  const fontFamily = fontMap[business.fontFamily] || fontMap.inter;

  /* ------------------------------------------------------------------ */
  /*  Page Tap Zones (left half = prev, right half = next)              */
  /* ------------------------------------------------------------------ */
  const handlePageTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedItem) return;
    if (!isOpened) return;
    if (!business.flipbookInteractions) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.35) {
      goPrev();
    } else if (x > rect.width * 0.65) {
      goNext();
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Render: Cover Page                                                 */
  /* ------------------------------------------------------------------ */
  const renderCover = () => (
    <div
      className="flex flex-col items-center justify-center min-h-full relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        fontFamily,
      }}
    >
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(255,255,255,0.1) 30px, rgba(255,255,255,0.1) 60px)`,
      }} />
      
      <div className="relative z-10 flex flex-col items-center gap-5 px-8">
        {/* Logo */}
        {business.logo ? (
          <img
            src={business.logo}
            alt={business.name}
            className="w-24 h-24 rounded-2xl object-cover shadow-2xl ring-4 ring-white/20"
          />
        ) : (
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-2xl ring-4 ring-white/20 bg-white/15 backdrop-blur-sm">
            {business.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Name */}
        <h1 className="text-3xl md:text-4xl font-bold text-white text-center tracking-tight">
          {business.name}
        </h1>

        {/* Tagline */}
        {business.description && (
          <p className="text-white/75 text-base md:text-lg text-center max-w-sm leading-relaxed italic">
            &ldquo;{business.description}&rdquo;
          </p>
        )}

        {/* Decorative line */}
        <div className="w-16 h-0.5 bg-white/40 rounded-full" />

        {/* Open Button */}
        <button
          onClick={handleOpenBook}
          className="mt-4 px-8 py-3.5 bg-white text-gray-900 rounded-full font-semibold text-base shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2"
        >
          <BookOpen className="w-5 h-5" />
          Tap to Open Menu
        </button>

        <p className="text-white/40 text-xs mt-2">{categories.length} categories &middot; {items.length} items</p>
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  Render: Welcome Page                                               */
  /* ------------------------------------------------------------------ */
  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center min-h-full p-8 text-center" style={{ fontFamily }}>
      <div className="w-12 h-1 rounded-full mb-6" style={{ backgroundColor: primaryColor }} />
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Welcome to {business.name}</h2>
      {business.description && (
        <p className="text-gray-600 text-base leading-relaxed max-w-md">{business.description}</p>
      )}
      {business.openingHours && (
        <div className="mt-6 px-4 py-2 bg-gray-50 rounded-lg text-sm text-gray-500">
          Opening Hours: {business.openingHours}
        </div>
      )}
      <div className="mt-8 text-sm text-gray-400">
        Swipe or tap arrows to navigate
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  Render: Category Page                                              */
  /* ------------------------------------------------------------------ */
  const renderCategoryPage = (page: PageItem) => {
    if (!page.items) return null;
    return (
      <div className="min-h-full p-6 md:p-8 flex flex-col" style={{ fontFamily }}>
        {/* Category header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: primaryColor }} />
          <h2 className="text-2xl font-bold text-gray-900">{page.title}</h2>
          <span className="text-sm text-gray-400 ml-auto">{page.items.length} items</span>
        </div>

        {/* Items grid */}
        <div className="grid gap-3 flex-1">
          {page.items.map((item, idx) => (
            <button
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                if (business.flipbookInteractions && item.available) {
                  setSelectedItem(item);
                }
              }}
              disabled={!item.available || !business.flipbookInteractions}
              className={`flex gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                item.available && business.flipbookInteractions
                  ? 'hover:shadow-md hover:border-gray-300 active:scale-[0.98] cursor-pointer'
                  : 'opacity-50 cursor-default'
              }`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* Item image */}
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover flex-shrink-0 shadow-sm"
                  loading="lazy"
                />
              ) : (
                <div
                  className="w-16 h-16 md:w-20 md:h-20 rounded-lg flex items-center justify-center flex-shrink-0 text-xl font-bold text-white"
                  style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                >
                  {item.name.charAt(0)}
                </div>
              )}
              {/* Item info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate">{item.name}</h3>
                </div>
                {item.description && (
                  <p className="text-gray-500 text-xs mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
                )}
                <p className="font-bold text-sm mt-1.5" style={{ color: primaryColor }}>
                  {formatPrice(item.price)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  Render: Contact Page                                               */
  /* ------------------------------------------------------------------ */
  const renderContactPage = () => (
    <div className="flex flex-col items-center justify-center min-h-full p-8 text-center" style={{ fontFamily }}>
      <div className="w-12 h-1 rounded-full mb-6" style={{ backgroundColor: primaryColor }} />
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact & Ordering</h2>
      
      <div className="space-y-3 text-sm text-gray-600 mb-8">
        {business.address && <p>{business.address}</p>}
        {business.phone && <p>Phone: {business.phone}</p>}
        {business.whatsapp && <p>WhatsApp: {business.whatsapp}</p>}
      </div>

      {business.whatsappOrder && business.whatsapp && basketTotal.count > 0 && (
        <button
          onClick={() => openWhatsApp()}
          className="px-8 py-3 rounded-full text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
          style={{ backgroundColor: '#25D366' }}
        >
          Order on WhatsApp ({formatPrice(basketTotal.total)})
        </button>
      )}

      <div className="mt-8 text-xs text-gray-400">
        Powered by MenuQR
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  Render: Current Page Content                                       */
  /* ------------------------------------------------------------------ */
  const renderPageContent = () => {
    const page = pages[currentPage];
    if (!page) return null;

    switch (page.type) {
      case 'cover':
        return renderCover();
      case 'welcome':
        return renderWelcome();
      case 'category':
        return renderCategoryPage(page);
      case 'contact':
        return renderContactPage();
      default:
        return null;
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Page Transition Styles                                            */
  /* ------------------------------------------------------------------ */
  const getPageTransitionClass = () => {
    if (!shouldAnimate || !isOpened) return '';

    if (isOpening) {
      return 'animate-page-flip-open';
    }

    if (isAnimating) {
      return animDirection === 'next'
        ? 'animate-page-flip-next'
        : 'animate-page-flip-prev';
    }

    return '';
  };

  /* ------------------------------------------------------------------ */
  /*  Fullscreen Mode                                                    */
  /* ------------------------------------------------------------------ */
  if (isFullscreen) {
    return (
      <div
        ref={bookRef}
        className="fixed inset-0 z-[9999] bg-white overflow-hidden"
        style={{ fontFamily }}
        onTouchStart={swipeHandlers.onTouchStart}
        onTouchEnd={swipeHandlers.onTouchEnd}
      >
        {/* Exit button */}
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-3 right-3 z-50 p-2 bg-white/90 backdrop-blur rounded-full shadow-md hover:shadow-lg transition-all"
        >
          <Minimize2 className="w-5 h-5 text-gray-700" />
        </button>

        {/* Page content */}
        <div
          className={`w-full h-full ${getPageTransitionClass()}`}
          onClick={handlePageTap}
          style={{
            transition: shouldAnimate ? `transform ${animDuration} ease-in-out` : 'none',
            animationDuration: animDuration,
          }}
        >
          {renderPageContent()}
        </div>

        {/* Navigation */}
        {isOpened && (
          <FlipNavigation
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={goPrev}
            onNext={goNext}
            showPageNumbers={business.flipbookPageNumbers}
            primaryColor={primaryColor}
          />
        )}

        {/* Basket */}
        <OrderBasket
          items={items}
          basket={basket}
          onUpdate={addToBasket}
          onClear={() => setBasket(new Map())}
          onOrder={openWhatsApp}
          business={business}
          basketTotal={basketTotal}
        />

        {/* Product detail modal */}
        {selectedItem && (
          <ProductDetailModal
            item={selectedItem}
            business={business}
            onClose={() => setSelectedItem(null)}
            onAddToBasket={addToBasket}
            onOrderDirect={(item, qty) => {
              openWhatsApp(item, qty);
              setSelectedItem(null);
            }}
          />
        )}
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Normal Mode                                                        */
  /* ------------------------------------------------------------------ */
  return (
    <div className="w-full" style={{ fontFamily }}>
      {/* Book container */}
      <div
        ref={bookRef}
        className={`relative w-full max-w-2xl mx-auto bg-white shadow-2xl overflow-hidden ${
          isPreview ? '' : 'min-h-[70vh] md:min-h-[80vh]'
        }`}
        style={{
          aspectRatio: isOpened ? undefined : '3/4',
          transition: shouldAnimate ? `all ${animDuration} cubic-bezier(0.4, 0, 0.2, 1)` : 'none',
        }}
        onTouchStart={swipeHandlers.onTouchStart}
        onTouchEnd={swipeHandlers.onTouchEnd}
      >
        {/* Fullscreen button */}
        {isOpened && business.flipbookFullscreen && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(true);
            }}
            className="absolute top-3 right-3 z-50 p-2 bg-white/90 backdrop-blur rounded-full shadow-md hover:shadow-lg transition-all"
          >
            <Maximize2 className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* Page content */}
        <div
          className={`w-full h-full cursor-pointer ${getPageTransitionClass()}`}
          onClick={handlePageTap}
          style={{
            transition: shouldAnimate ? `transform ${animDuration} ease-in-out, opacity ${animDuration} ease-in-out` : 'none',
            animationDuration: animDuration,
          }}
        >
          {renderPageContent()}
        </div>

        {/* Navigation */}
        {isOpened && (
          <FlipNavigation
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={goPrev}
            onNext={goNext}
            showPageNumbers={business.flipbookPageNumbers}
            primaryColor={primaryColor}
          />
        )}

        {/* Back to cover button */}
        {isOpened && currentPage > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCloseBook();
            }}
            className="absolute top-3 left-3 z-50 p-2 bg-white/90 backdrop-blur rounded-full shadow-md hover:shadow-lg transition-all"
          >
            <BookOpen className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>

      {/* Basket */}
      <OrderBasket
        items={items}
        basket={basket}
        onUpdate={addToBasket}
        onClear={() => setBasket(new Map())}
        onOrder={openWhatsApp}
        business={business}
        basketTotal={basketTotal}
      />

      {/* Product detail modal */}
      {selectedItem && (
        <ProductDetailModal
          item={selectedItem}
          business={business}
          onClose={() => setSelectedItem(null)}
          onAddToBasket={addToBasket}
          onOrderDirect={(item, qty) => {
            openWhatsApp(item, qty);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Flip Navigation Component                                           */
/* ------------------------------------------------------------------ */
interface FlipNavigationProps {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  showPageNumbers: boolean;
  primaryColor: string;
}

function FlipNavigation({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  showPageNumbers,
  primaryColor,
}: FlipNavigationProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-gradient-to-t from-black/20 to-transparent pointer-events-none">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        disabled={currentPage <= 1}
        className="pointer-events-auto p-2 rounded-full bg-white/90 backdrop-blur shadow-md hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        <ChevronLeft className="w-5 h-5 text-gray-700" />
      </button>

      {showPageNumbers && (
        <div className="pointer-events-none px-3 py-1.5 bg-white/80 backdrop-blur rounded-full text-xs font-medium text-gray-600">
          {currentPage} / {totalPages - 1}
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        disabled={currentPage >= totalPages - 1}
        className="pointer-events-auto p-2 rounded-full bg-white/90 backdrop-blur shadow-md hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        <ChevronRight className="w-5 h-5 text-gray-700" />
      </button>
    </div>
  );
}
