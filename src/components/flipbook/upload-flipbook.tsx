'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Loader2,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Send,
} from 'lucide-react';
import type { Business, MenuUpload } from '@/lib/types';
import { formatPrice } from '@/lib/auth';
import { useSwipeGesture, useReducedMotion, useCanAnimate, useBookDimensions } from './use-swipe-gesture';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface UploadFlipbookProps {
  business: Business;
  publishedUpload: MenuUpload;
  isPreview?: boolean;
}

interface PageItem {
  type: 'cover' | 'welcome' | 'upload-page' | 'contact';
  title: string;
  imageUrl?: string;
  pageIndex?: number;
}

/* ------------------------------------------------------------------ */
/*  PDF Page Renderer — Progressive Loading                             */
/* ------------------------------------------------------------------ */
function usePdfPages(url: string) {
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || !url.endsWith('.pdf')) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function renderPages() {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        const total = pdf.numPages;
        const images: string[] = new Array(total).fill('');

        // Render first page immediately, rest progressively
        async function renderPage(i: number) {
          if (cancelled) return;
          const page = await pdf.getPage(i + 1);
          // Use scale 1.5 on mobile for performance, 2 on desktop
          const scale = window.innerWidth < 768 ? 1.5 : 2;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: context!, viewport }).promise;

          if (!cancelled) {
            images[i] = canvas.toDataURL('image/jpeg', 0.85);
            setPageImages([...images]);
          }
          page.cleanup();
          canvas.remove();
        }

        // Render first page immediately
        await renderPage(0);
        if (cancelled) return;
        setLoading(false);

        // Render remaining pages progressively
        for (let i = 1; i < total; i++) {
          await renderPage(i);
          if (cancelled) break;
          // Small delay to not block main thread
          await new Promise(r => setTimeout(r, 50));
        }
      } catch (err) {
        if (!cancelled) {
          console.error('PDF rendering error:', err);
          setError('Failed to load PDF pages');
          setLoading(false);
        }
      }
    }

    renderPages();
    return () => { cancelled = true; };
  }, [url]);

  return { pageImages, loading, error };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const animDurationMap: Record<string, string> = {
  slow: '0.6s',
  medium: '0.35s',
  fast: '0.2s',
};

function buildUploadPages(publishedUpload: MenuUpload, pdfPageImages: string[]): PageItem[] {
  const pages: PageItem[] = [];

  // Welcome page
  pages.push({ type: 'welcome', title: 'Welcome' });

  if (publishedUpload.fileType === 'application/pdf' && pdfPageImages.length > 0) {
    for (let i = 0; i < pdfPageImages.length; i++) {
      pages.push({
        type: 'upload-page',
        title: `Page ${i + 1}`,
        imageUrl: pdfPageImages[i],
        pageIndex: i,
      });
    }
  } else {
    pages.push({
      type: 'upload-page',
      title: publishedUpload.fileName,
      imageUrl: publishedUpload.url,
      pageIndex: 0,
    });
  }

  // Contact page
  pages.push({ type: 'contact', title: 'Contact' });

  return pages;
}

/* ------------------------------------------------------------------ */
/*  Upload Flipbook Component — Always Fullscreen                        */
/* ------------------------------------------------------------------ */
export default function UploadFlipbook({
  business,
  publishedUpload,
  isPreview = false,
}: UploadFlipbookProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isOpening, setIsOpening] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animDirection, setAnimDirection] = useState<'next' | 'prev'>('next');

  const bookRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const canAnimate = useCanAnimate();
  const shouldAnimate = business.flipbookAnimEnabled && !prefersReducedMotion && canAnimate;

  // Render PDF pages
  const { pageImages: pdfPageImages, loading: pdfLoading, error: pdfError } = usePdfPages(
    publishedUpload.url
  );

  // Build pages
  const contentPages = useMemo(
    () => buildUploadPages(publishedUpload, pdfPageImages),
    [publishedUpload, pdfPageImages]
  );
  const totalPages = 1 + contentPages.length;

  const goNext = useCallback(() => {
    if (currentPage < totalPages - 1 && !isAnimating) {
      setAnimDirection('next');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentPage((p) => p + 1);
        setIsAnimating(false);
      }, shouldAnimate ? 80 : 0);
    }
  }, [currentPage, totalPages, isAnimating, shouldAnimate]);

  const goPrev = useCallback(() => {
    if (currentPage > 0 && !isAnimating) {
      setAnimDirection('prev');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentPage((p) => p - 1);
        setIsAnimating(false);
      }, shouldAnimate ? 80 : 0);
    }
  }, [currentPage, isAnimating, shouldAnimate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  // Swipe gesture — always active
  const swipeHandlers = useSwipeGesture(
    {
      onSwipeLeft: isOpened ? goNext : undefined,
      onSwipeRight: isOpened ? goPrev : undefined,
    },
    30
  );

  const handleOpenBook = () => {
    setIsOpening(true);
    setTimeout(() => {
      setIsOpened(true);
      setIsOpening(false);
      setCurrentPage(1);
    }, shouldAnimate ? 500 : 30);
  };

  const handleCloseBook = () => {
    setIsOpened(false);
    setCurrentPage(0);
  };

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

  const welcomeMessage = (business as Record<string, unknown>).welcomeMessage as string || business.description || '';

  /* ------------------------------------------------------------------ */
  /*  Transition class                                                  */
  /* ------------------------------------------------------------------ */
  const getPageTransitionClass = () => {
    if (!isOpened) return '';
    if (isOpening) {
      return shouldAnimate ? 'animate-page-flip-open' : '';
    }
    if (isAnimating) {
      if (shouldAnimate) {
        return animDirection === 'next' ? 'animate-page-flip-next' : 'animate-page-flip-prev';
      }
      return animDirection === 'next' ? 'animate-slide-right' : 'animate-slide-left';
    }
    return '';
  };

  /* ------------------------------------------------------------------ */
  /*  Render: Cover                                                      */
  /* ------------------------------------------------------------------ */
  const renderCover = () => (
    <div
      className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`, fontFamily }}
    >
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
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">{business.name}</h1>
        {business.description && (
          <p className="text-white/70 text-sm sm:text-base max-w-xs leading-relaxed">&ldquo;{business.description}&rdquo;</p>
        )}
        <div className="w-12 h-0.5 bg-white/30 rounded-full mt-1" />
        <button
          onClick={handleOpenBook}
          className="mt-3 px-7 py-3 bg-white text-gray-900 rounded-full font-semibold text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          Tap to Open
        </button>
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  Render: Welcome                                                    */
  /* ------------------------------------------------------------------ */
  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center w-full h-full p-6 sm:p-8 text-center overflow-y-auto" style={{ fontFamily }}>
      <div className="w-10 h-1 rounded-full mb-4 sm:mb-6" style={{ backgroundColor: primaryColor }} />
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Welcome to {business.name}</h2>
      <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-sm">
        {welcomeMessage || 'Thank you for visiting us. Explore our menu and discover our offerings.'}
      </p>
      {business.openingHours && (
        <div className="mt-4 sm:mt-6 px-3 py-2 bg-gray-50 rounded-lg text-xs sm:text-sm text-gray-500 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          {business.openingHours}
        </div>
      )}
      <p className="mt-6 text-xs text-gray-300">Swipe or tap arrows to navigate</p>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  Render: Upload Page                                                */
  /* ------------------------------------------------------------------ */
  const renderUploadPage = (page: PageItem) => {
    if (!page.imageUrl) return null;
    return (
      <div className="flex flex-col w-full h-full overflow-hidden" style={{ fontFamily }}>
        <div className="px-3 pt-2 pb-1 flex items-center justify-between flex-shrink-0">
          <span className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider">
            {page.title}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center p-1.5 sm:p-2 bg-gray-50/50 min-h-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={page.imageUrl}
            alt={page.title}
            className="max-w-full max-h-full object-contain rounded shadow-sm"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  Render: Contact                                                    */
  /* ------------------------------------------------------------------ */
  const renderContactPage = () => {
    const cleanPhone = business.whatsapp?.replace(/[^0-9]/g, '') || '';
    const greeting = business.whatsappGreeting || 'Hello, I would like to place an order:';

    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-6 sm:p-8 text-center overflow-y-auto" style={{ fontFamily }}>
        <div className="w-10 h-1 rounded-full mb-4 sm:mb-6" style={{ backgroundColor: primaryColor }} />
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Contact & Ordering</h2>

        <div className="w-full max-w-xs space-y-2.5 text-sm">
          {business.phone && (
            <a href={`tel:${business.phone}`} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                <Phone className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium text-gray-900 text-left truncate">{business.phone}</span>
            </a>
          )}
          {business.whatsapp && (
            <button
              onClick={() => {
                const msg = encodeURIComponent(`${greeting}\n\nPlease share your menu and pricing. Thank you!`);
                window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-green-100 bg-green-50/80 hover:bg-green-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white flex-shrink-0">
                <MessageCircle className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium text-green-800 text-left truncate">{business.whatsapp}</span>
            </button>
          )}
          {business.address && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium text-gray-900 text-left truncate">{business.address}</span>
            </div>
          )}
          {business.openingHours && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium text-gray-900 text-left truncate">{business.openingHours}</span>
            </div>
          )}
        </div>

        {business.whatsappOrder && business.whatsapp && (
          <button
            onClick={() => {
              const msg = encodeURIComponent(`${greeting}\n\nPlease share your menu and pricing. Thank you!`);
              window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
            }}
            className="mt-5 px-7 py-3 rounded-full text-white font-semibold text-sm shadow-lg active:scale-95 transition-all duration-200 flex items-center gap-2"
            style={{ backgroundColor: '#25D366' }}
          >
            <Send className="w-4 h-4" />
            Order on WhatsApp
          </button>
        )}
        {!business.whatsappOrder && (
          <div className="mt-5 flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-xl text-sm text-gray-400">
            <MessageCircle className="w-4 h-4" />
            Ordering is currently unavailable
          </div>
        )}

        <p className="mt-6 text-[10px] text-gray-300">MADE BY <span className="font-semibold">ALTECH</span></p>
      </div>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  Render: Current Page                                               */
  /* ------------------------------------------------------------------ */
  const renderPageContent = () => {
    if (currentPage === 0) return renderCover();
    const idx = currentPage - 1;
    if (idx < 0 || idx >= contentPages.length) return null;
    const page = contentPages[idx];
    switch (page.type) {
      case 'welcome': return renderWelcome();
      case 'upload-page': return renderUploadPage(page);
      case 'contact': return renderContactPage();
      default: return null;
    }
  };

  /* ------------------------------------------------------------------ */
  /*  PDF Loading                                                        */
  /* ------------------------------------------------------------------ */
  if (pdfLoading && isOpened) {
    return (
      <div className="flipbook-container fixed inset-0 z-[9999] flex items-center justify-center bg-white" style={{ fontFamily }}>
        <div className="text-center gap-3 flex flex-col items-center">
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: primaryColor }} />
          <p className="text-xs text-gray-400">Loading menu pages...</p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Always Fullscreen — swipe anywhere for navigation                   */
  /* ------------------------------------------------------------------ */
  return (
    <div
      ref={bookRef}
      className="fixed inset-0 z-[9999] bg-white overflow-hidden flipbook-container safe-top safe-bottom"
      style={{ fontFamily }}
      onTouchStart={swipeHandlers.onTouchStart}
      onTouchMove={swipeHandlers.onTouchMove}
      onTouchEnd={swipeHandlers.onTouchEnd}
    >
      {/* Back to cover button */}
      {isOpened && currentPage > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); handleCloseBook(); }}
          className="absolute top-3 left-3 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-md"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
          <BookOpen className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Page content */}
      <div
        className={`w-full h-full flex items-center justify-center ${getPageTransitionClass()} flip-page`}
        onClick={(e) => {
          // Tap zones for navigation
          if (!isOpened || !business.flipbookInteractions) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width * 0.3) goPrev();
          else if (x > rect.width * 0.7) goNext();
        }}
        style={{ '--anim-duration': animDuration } as React.CSSProperties}
      >
        <div className="w-full h-full max-w-lg mx-auto">
          {renderPageContent()}
        </div>
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FlipNavigation — Full-width swipe areas + bottom arrows              */
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
    <div
      className="absolute bottom-0 left-0 right-0 z-40 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
    >
      {/* Left swipe zone */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[30%] pointer-events-auto flex items-center justify-start"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
      >
        <div className="ml-2 flex items-center gap-1 opacity-40">
          <ChevronLeft className="w-6 h-6 text-gray-500" />
        </div>
      </div>

      {/* Right swipe zone */}
      <div
        className="absolute right-0 top-0 bottom-0 w-[30%] pointer-events-auto flex items-center justify-end"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
      >
        <div className="mr-2 flex items-center gap-1 opacity-40">
          <ChevronRight className="w-6 h-6 text-gray-500" />
        </div>
      </div>

      {/* Bottom navigation bar */}
      <div className="flex items-center justify-between px-3 pt-3">
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          disabled={currentPage <= 1}
          className="pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-gray-100 disabled:opacity-20 disabled:cursor-not-allowed active:scale-90 transition-all"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>

        {showPageNumbers && (
          <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-xs font-semibold text-gray-500 shadow-sm border border-gray-100">
            {currentPage} / {totalPages - 1}
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          disabled={currentPage >= totalPages - 1}
          className="pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-gray-100 disabled:opacity-20 disabled:cursor-not-allowed active:scale-90 transition-all"
          aria-label="Next page"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>
    </div>
  );
}
