'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  BookOpen,
  Loader2,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Mail,
  Globe,
  Send,
} from 'lucide-react';
import type { Business, MenuUpload } from '@/lib/types';
import { formatPrice } from '@/lib/auth';
import { useSwipeGesture, useReducedMotion, useCanAnimate } from './use-swipe-gesture';

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
/*  PDF Page Renderer                                                   */
/* ------------------------------------------------------------------ */
function usePdfPages(url: string, pageCount: number) {
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
        // Dynamic import of pdfjs-dist
        const pdfjsLib = await import('pdfjs-dist');
        
        // Set worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        if (cancelled) return;

        const total = pdf.numPages;
        const images: string[] = [];

        for (let i = 1; i <= total; i++) {
          if (cancelled) break;
          const page = await pdf.getPage(i);
          const scale = 2; // High quality rendering
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: context!, viewport }).promise;

          if (cancelled) break;
          images.push(canvas.toDataURL('image/jpeg', 0.92));
          page.cleanup();
        }

        if (!cancelled) {
          setPageImages(images);
          setLoading(false);
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
  slow: '0.8s',
  medium: '0.5s',
  fast: '0.3s',
};

function buildUploadPages(publishedUpload: MenuUpload, pdfPageImages: string[]): PageItem[] {
  const pages: PageItem[] = [];

  // The cover page is always page 0 (handled separately in state)
  // Start content pages from index 1

  // Welcome page (index 1)
  pages.push({ type: 'welcome', title: 'Welcome' });

  if (publishedUpload.fileType === 'application/pdf' && pdfPageImages.length > 0) {
    // PDF: each rendered page becomes a book page
    for (let i = 0; i < pdfPageImages.length; i++) {
      pages.push({
        type: 'upload-page',
        title: `Menu - Page ${i + 1}`,
        imageUrl: pdfPageImages[i],
        pageIndex: i,
      });
    }
  } else {
    // Image: single page
    pages.push({
      type: 'upload-page',
      title: publishedUpload.fileName,
      imageUrl: publishedUpload.url,
      pageIndex: 0,
    });
  }

  // Contact page (always last)
  pages.push({ type: 'contact', title: 'Contact & Ordering' });

  return pages;
}

/* ------------------------------------------------------------------ */
/*  Upload Flipbook Component                                          */
/* ------------------------------------------------------------------ */
export default function UploadFlipbook({
  business,
  publishedUpload,
  isPreview = false,
}: UploadFlipbookProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isOpening, setIsOpening] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animDirection, setAnimDirection] = useState<'next' | 'prev'>('next');

  const bookRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const canAnimate = useCanAnimate();
  const shouldAnimate = business.flipbookAnimEnabled && !prefersReducedMotion && canAnimate;

  // Render PDF pages if needed
  const { pageImages: pdfPageImages, loading: pdfLoading, error: pdfError } = usePdfPages(
    publishedUpload.url,
    1
  );

  // Build pages: cover is implicit at index 0, content starts at 1
  const contentPages = useMemo(
    () => buildUploadPages(publishedUpload, pdfPageImages),
    [publishedUpload, pdfPageImages]
  );

  // Total pages = 1 (cover) + content pages
  const totalPages = 1 + contentPages.length;

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
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentPage, totalPages, isOpened, isFullscreen, goNext, goPrev]);

  // Swipe gesture
  const swipeHandlers = useSwipeGesture(
    {
      onSwipeLeft: isOpened ? goNext : undefined,
      onSwipeRight: isOpened ? goPrev : undefined,
    },
    40
  );

  const handleOpenBook = () => {
    setIsOpening(true);
    setTimeout(() => {
      setIsOpened(true);
      setIsOpening(false);
      setCurrentPage(1);
    }, shouldAnimate ? 700 : 50);
  };

  const handleCloseBook = () => {
    setIsOpened(false);
    setCurrentPage(0);
  };

  const animDuration = animDurationMap[business.flipbookAnimSpeed] || '0.5s';
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
  const isPdf = publishedUpload.fileType === 'application/pdf';

  /* ------------------------------------------------------------------ */
  /*  Page Tap Zones                                                    */
  /* ------------------------------------------------------------------ */
  const handlePageTap = (e: React.MouseEvent<HTMLDivElement>) => {
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
  /*  Render: Cover Page                                                */
  /* ------------------------------------------------------------------ */
  const renderCover = () => (
    <div
      className="flex flex-col items-center justify-center min-h-full relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        fontFamily,
      }}
    >
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(255,255,255,0.1) 30px, rgba(255,255,255,0.1) 60px)`,
      }} />
      <div className="relative z-10 flex flex-col items-center gap-5 px-8">
        {business.logo ? (
          <img src={business.logo} alt={business.name} className="w-24 h-24 rounded-2xl object-cover shadow-2xl ring-4 ring-white/20" />
        ) : (
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-2xl ring-4 ring-white/20 bg-white/15 backdrop-blur-sm">
            {business.name.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-bold text-white text-center tracking-tight">{business.name}</h1>
        {business.description && (
          <p className="text-white/75 text-base md:text-lg text-center max-w-sm leading-relaxed italic">
            &ldquo;{business.description}&rdquo;
          </p>
        )}
        <div className="w-16 h-0.5 bg-white/40 rounded-full" />
        <button
          onClick={handleOpenBook}
          className="mt-4 px-8 py-3.5 bg-white text-gray-900 rounded-full font-semibold text-base shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2"
        >
          <BookOpen className="w-5 h-5" />
          Tap to Open Menu
        </button>
        <p className="text-white/40 text-xs mt-2">Digital Menu</p>
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  Render: Welcome Page                                              */
  /* ------------------------------------------------------------------ */
  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center min-h-full p-8 text-center" style={{ fontFamily }}>
      <div className="w-12 h-1 rounded-full mb-6" style={{ backgroundColor: primaryColor }} />
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Welcome to {business.name}</h2>
      {welcomeMessage ? (
        <p className="text-gray-600 text-base leading-relaxed max-w-md">{welcomeMessage}</p>
      ) : (
        <p className="text-gray-600 text-base leading-relaxed max-w-md">
          Thank you for visiting us. Explore our menu and discover our offerings.
        </p>
      )}
      {business.openingHours && (
        <div className="mt-6 px-4 py-2 bg-gray-50 rounded-lg text-sm text-gray-500 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Opening Hours: {business.openingHours}
        </div>
      )}
      <div className="mt-8 text-sm text-gray-400">
        Swipe or tap arrows to navigate
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  Render: Uploaded Menu Page                                        */
  /* ------------------------------------------------------------------ */
  const renderUploadPage = (page: PageItem) => {
    if (!page.imageUrl) return null;
    return (
      <div className="min-h-full flex flex-col" style={{ fontFamily }}>
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            {page.title}
          </span>
          {page.pageIndex !== undefined && isPdf && (
            <span className="text-xs text-gray-300">
              Page {page.pageIndex + 1}
            </span>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center p-2 bg-gray-50">
          <img
            src={page.imageUrl}
            alt={page.title}
            className="max-w-full max-h-full object-contain rounded shadow-sm"
            style={{ aspectRatio: 'auto' }}
          />
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  Render: Contact & Ordering Page                                   */
  /* ------------------------------------------------------------------ */
  const renderContactPage = () => {
    const cleanPhone = business.whatsapp?.replace(/[^0-9]/g, '') || '';
    const greeting = business.whatsappGreeting || 'Hello, I would like to place an order:';

    const handleWhatsApp = () => {
      const message = encodeURIComponent(`${greeting}\n\nPlease share your menu and pricing. Thank you!`);
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8 text-center" style={{ fontFamily }}>
        <div className="w-12 h-1 rounded-full mb-6" style={{ backgroundColor: primaryColor }} />
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact & Ordering</h2>

        <div className="w-full max-w-xs space-y-3 text-sm">
          {business.phone && (
            <a href={`tel:${business.phone}`} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                <Phone className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-400">Phone</p>
                <p className="font-medium text-gray-900">{business.phone}</p>
              </div>
            </a>
          )}

          {business.whatsapp && (
            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-green-100 bg-green-50 hover:bg-green-100 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs text-green-600">WhatsApp</p>
                <p className="font-medium text-green-800">{business.whatsapp}</p>
              </div>
            </button>
          )}

          {business.address && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-400">Address</p>
                <p className="font-medium text-gray-900">{business.address}</p>
              </div>
            </div>
          )}

          {business.openingHours && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-400">Hours</p>
                <p className="font-medium text-gray-900">{business.openingHours}</p>
              </div>
            </div>
          )}
        </div>

        {business.whatsappOrder && business.whatsapp && (
          <button
            onClick={handleWhatsApp}
            className="mt-6 px-8 py-3 rounded-full text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2"
            style={{ backgroundColor: '#25D366' }}
          >
            <Send className="w-4 h-4" />
            Order on WhatsApp
          </button>
        )}

        <div className="mt-8 text-xs text-gray-400">
          Powered by <span className="font-semibold">BizFlip</span>
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  Render: Current Page Content                                       */
  /* ------------------------------------------------------------------ */
  const renderPageContent = () => {
    // Page 0 = cover
    if (currentPage === 0) return renderCover();

    // Pages 1+ = content pages (index into contentPages)
    const contentIndex = currentPage - 1;
    if (contentIndex < 0 || contentIndex >= contentPages.length) return null;

    const page = contentPages[contentIndex];

    switch (page.type) {
      case 'welcome':
        return renderWelcome();
      case 'upload-page':
        return renderUploadPage(page);
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
    if (isOpening) return 'animate-page-flip-open';
    if (isAnimating) {
      return animDirection === 'next' ? 'animate-page-flip-next' : 'animate-page-flip-prev';
    }
    return '';
  };

  /* ------------------------------------------------------------------ */
  /*  Loading PDF                                                       */
  /* ------------------------------------------------------------------ */
  if (isPdf && pdfLoading && isOpened) {
    return (
      <div className="w-full" style={{ fontFamily }}>
        <div className="relative w-full max-w-2xl mx-auto bg-white shadow-2xl overflow-hidden min-h-[70vh] md:min-h-[80vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
          <p className="text-sm text-gray-500">Loading menu pages...</p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Fullscreen Mode                                                    */
  /* ------------------------------------------------------------------ */
  if (isFullscreen) {
    return (
      <div ref={bookRef} className="fixed inset-0 z-[9999] bg-white overflow-hidden" style={{ fontFamily }}
        onTouchStart={swipeHandlers.onTouchStart}
        onTouchEnd={swipeHandlers.onTouchEnd}
      >
        <button onClick={() => setIsFullscreen(false)}
          className="absolute top-3 right-3 z-50 p-2 bg-white/90 backdrop-blur rounded-full shadow-md hover:shadow-lg transition-all"
        >
          <Minimize2 className="w-5 h-5 text-gray-700" />
        </button>
        <div className={`w-full h-full ${getPageTransitionClass()}`} onClick={handlePageTap}
          style={{ transition: shouldAnimate ? `transform ${animDuration} ease-in-out` : 'none', animationDuration: animDuration }}
        >
          {renderPageContent()}
        </div>
        {isOpened && (
          <FlipNavigation currentPage={currentPage} totalPages={totalPages} onPrev={goPrev} onNext={goNext}
            showPageNumbers={business.flipbookPageNumbers} primaryColor={primaryColor} />
        )}
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Normal Mode                                                        */
  /* ------------------------------------------------------------------ */
  return (
    <div className="w-full" style={{ fontFamily }}>
      <div ref={bookRef}
        className={`relative w-full max-w-2xl mx-auto bg-white shadow-2xl overflow-hidden ${isPreview ? '' : 'min-h-[70vh] md:min-h-[80vh]'}`}
        style={{ aspectRatio: isOpened ? undefined : '3/4', transition: shouldAnimate ? `all ${animDuration} cubic-bezier(0.4, 0, 0.2, 1)` : 'none' }}
        onTouchStart={swipeHandlers.onTouchStart}
        onTouchEnd={swipeHandlers.onTouchEnd}
      >
        {isOpened && business.flipbookFullscreen && (
          <button onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }}
            className="absolute top-3 right-3 z-50 p-2 bg-white/90 backdrop-blur rounded-full shadow-md hover:shadow-lg transition-all"
          >
            <Maximize2 className="w-4 h-4 text-gray-600" />
          </button>
        )}
        <div className={`w-full h-full cursor-pointer ${getPageTransitionClass()}`} onClick={handlePageTap}
          style={{ transition: shouldAnimate ? `transform ${animDuration} ease-in-out, opacity ${animDuration} ease-in-out` : 'none', animationDuration: animDuration }}
        >
          {renderPageContent()}
        </div>
        {isOpened && (
          <FlipNavigation currentPage={currentPage} totalPages={totalPages} onPrev={goPrev} onNext={goNext}
            showPageNumbers={business.flipbookPageNumbers} primaryColor={primaryColor} />
        )}
        {isOpened && currentPage > 0 && (
          <button onClick={(e) => { e.stopPropagation(); handleCloseBook(); }}
            className="absolute top-3 left-3 z-50 p-2 bg-white/90 backdrop-blur rounded-full shadow-md hover:shadow-lg transition-all"
          >
            <BookOpen className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
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

function FlipNavigation({ currentPage, totalPages, onPrev, onNext, showPageNumbers, primaryColor }: FlipNavigationProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-gradient-to-t from-black/20 to-transparent pointer-events-none">
      <button onClick={(e) => { e.stopPropagation(); onPrev(); }} disabled={currentPage <= 1}
        className="pointer-events-auto p-2 rounded-full bg-white/90 backdrop-blur shadow-md hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        <ChevronLeft className="w-5 h-5 text-gray-700" />
      </button>
      {showPageNumbers && (
        <div className="pointer-events-none px-3 py-1.5 bg-white/80 backdrop-blur rounded-full text-xs font-medium text-gray-600">
          {currentPage} / {totalPages - 1}
        </div>
      )}
      <button onClick={(e) => { e.stopPropagation(); onNext(); }} disabled={currentPage >= totalPages - 1}
        className="pointer-events-auto p-2 rounded-full bg-white/90 backdrop-blur shadow-md hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        <ChevronRight className="w-5 h-5 text-gray-700" />
      </button>
    </div>
  );
}
