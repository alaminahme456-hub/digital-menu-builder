'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  Store,
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  UtensilsCrossed,
  Plus,
  Minus,
  ShoppingCart,
  X,
  FileX2,
  ChefHat,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { formatPrice } from '@/lib/auth';
import type { Business, MenuCategory, MenuItem, WhatsAppOrderItem } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface PublicMenuProps {
  slug: string;
  isPreview?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Template helpers                                                   */
/* ------------------------------------------------------------------ */
type TemplateName =
  | 'modern' | 'classic' | 'luxury' | 'minimal' | 'fastfood'
  | 'cafe' | 'pizza' | 'dark' | 'colorful' | 'elegant';

function getTemplateClasses(template: string, primaryColor: string): string {
  const t = template as TemplateName;
  const base = 'min-h-screen';
  const overrides: Record<TemplateName, string> = {
    modern: 'bg-white text-gray-900',
    classic: 'bg-amber-50/50 text-gray-900 font-serif',
    luxury: 'bg-gray-950 text-gray-100',
    minimal: 'bg-white text-gray-900',
    fastfood: 'bg-yellow-50 text-gray-900',
    cafe: 'bg-orange-50/40 text-gray-900',
    pizza: 'bg-red-50/30 text-gray-900',
    dark: 'bg-[#1a1a2e] text-gray-100',
    colorful: 'bg-white text-gray-900',
    elegant: 'bg-stone-50 text-gray-800',
  };
  return `${base} ${overrides[t] ?? overrides.modern}`;
}

function getHeaderBg(template: string, primaryColor: string): string {
  const t = template as TemplateName;
  const map: Record<TemplateName, string> = {
    modern:   `bg-gradient-to-br from-white via-white to-gray-50`,
    classic:  `bg-gradient-to-br from-amber-100 via-amber-50 to-orange-50`,
    luxury:   `bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900`,
    minimal:  `bg-white border-b border-gray-200`,
    fastfood: `bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400`,
    cafe:     `bg-gradient-to-br from-amber-800 via-amber-700 to-yellow-800`,
    pizza:    `bg-gradient-to-br from-green-700 via-green-600 to-red-700`,
    dark:     `bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]`,
    colorful: `bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400`,
    elegant:  `bg-gradient-to-br from-stone-100 via-stone-50 to-stone-100`,
  };
  return map[t] ?? map.modern;
}

function getHeaderTextColor(template: string): string {
  const dark = ['luxury', 'dark', 'fastfood', 'cafe', 'pizza', 'colorful'];
  return dark.includes(template) ? 'text-white' : 'text-gray-900';
}

function getHeaderSubTextColor(template: string): string {
  const dark = ['luxury', 'dark', 'fastfood', 'cafe', 'pizza', 'colorful'];
  return dark.includes(template) ? 'text-white/80' : 'text-gray-500';
}

function getCardClasses(template: string): string {
  const t = template as TemplateName;
  const map: Record<TemplateName, string> = {
    modern:   'bg-white border border-gray-100 shadow-sm',
    classic:  'bg-white/90 border border-amber-200/60 shadow-sm',
    luxury:   'bg-gray-900 border border-gray-700/50 shadow-lg shadow-black/20',
    minimal:  'bg-white border border-gray-200 shadow-none',
    fastfood: 'bg-white border-2 border-gray-200 shadow-md rounded-2xl',
    cafe:     'bg-white/90 border border-amber-200/50 shadow-sm',
    pizza:    'bg-white border border-red-200/40 shadow-sm',
    dark:     'bg-[#16213e] border border-gray-700/40 shadow-md',
    colorful: 'bg-white border border-gray-100 shadow-sm',
    elegant:  'bg-white border border-stone-200/60 shadow-sm',
  };
  return map[t] ?? map.modern;
}

function getSectionTitleClasses(template: string): string {
  const t = template as TemplateName;
  const map: Record<TemplateName, string> = {
    modern:   'text-gray-900',
    classic:  'text-amber-900 font-serif',
    luxury:   'text-[#D4AF37] uppercase tracking-wider',
    minimal:  'text-gray-900 font-light',
    fastfood: 'text-gray-900 font-extrabold text-xl',
    cafe:     'text-amber-900',
    pizza:    'text-green-800 font-bold',
    dark:     'text-gray-200',
    colorful: 'text-gray-900 font-bold',
    elegant:  'text-stone-700 font-light tracking-wide',
  };
  return map[t] ?? map.modern;
}

function getAccentColor(template: string, primaryColor: string): string {
  const t = template as TemplateName;
  const map: Record<TemplateName, string> = {
    modern:   primaryColor || '#10b981',
    classic:  '#b45309',
    luxury:   '#D4AF37',
    minimal:  '#374151',
    fastfood: '#f97316',
    cafe:     '#8B4513',
    pizza:    '#dc2626',
    dark:     '#38bdf8',
    colorful: '#8b5cf6',
    elegant:  '#78716c',
  };
  return map[t] ?? (primaryColor || '#10b981');
}

function getPlaceholderGradient(template: string, accent: string): string {
  const t = template as TemplateName;
  const map: Record<TemplateName, string> = {
    modern:   'from-emerald-100 to-emerald-50',
    classic:  'from-amber-100 to-amber-50',
    luxury:   'from-gray-700 to-gray-800',
    minimal:  'from-gray-100 to-gray-50',
    fastfood: 'from-orange-200 to-yellow-100',
    cafe:     'from-amber-200 to-orange-100',
    pizza:    'from-red-200 to-green-100',
    dark:     'from-gray-700 to-gray-800',
    colorful: 'from-purple-200 to-pink-100',
    elegant:  'from-stone-200 to-stone-100',
  };
  return map[t] ?? map.modern;
}

function getPlaceholderIconColor(template: string): string {
  const dark = ['luxury', 'dark'];
  return dark.includes(template) ? 'text-gray-500' : 'text-gray-300';
}

function getDividerColor(template: string, accent: string): string {
  const t = template as TemplateName;
  const map: Record<TemplateName, string> = {
    modern:   'border-gray-200',
    classic:  'border-amber-200',
    luxury:   'border-[#D4AF37]/30',
    minimal:  'border-gray-300',
    fastfood: 'border-orange-200',
    cafe:     'border-amber-200',
    pizza:    'border-green-300',
    dark:     'border-gray-700',
    colorful: 'border-purple-200',
    elegant:  'border-stone-200',
  };
  return map[t] ?? map.modern;
}

function getPriceColor(template: string, accent: string): string {
  const t = template as TemplateName;
  const map: Record<TemplateName, string> = {
    modern:   'text-emerald-600',
    classic:  'text-amber-700',
    luxury:   'text-[#D4AF37]',
    minimal:  'text-gray-900',
    fastfood: 'text-orange-600',
    cafe:     'text-amber-700',
    pizza:    'text-red-600',
    dark:     'text-sky-400',
    colorful: 'text-purple-600',
    elegant:  'text-stone-600',
  };
  return map[t] ?? map.modern;
}

function getFloatingBtnClass(template: string, accent: string): string {
  const dark = ['dark', 'luxury'];
  return dark.includes(template)
    ? 'bg-white text-gray-900 hover:bg-gray-100'
    : `text-white hover:opacity-90`;
}

/* ------------------------------------------------------------------ */
/*  Opening hours helper                                               */
/* ------------------------------------------------------------------ */
function isOpenNow(openingHours: string | null): boolean {
  if (!openingHours) return true;
  try {
    const parsed = JSON.parse(openingHours);
    if (!Array.isArray(parsed) || parsed.length === 0) return true;
    const now = new Date();
    const dayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const todayEntry = parsed[dayIndex];
    if (!todayEntry || !todayEntry.open || todayEntry.closed) return false;
    const [openH, openM] = todayEntry.open.split(':').map(Number);
    const [closeH, closeM] = todayEntry.close.split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } catch {
    return true;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function PublicMenuView({ slug, isPreview = false }: PublicMenuProps) {
  /* ---- State ---- */
  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [unpublished, setUnpublished] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [orderItems, setOrderItems] = useState<WhatsAppOrderItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const categoryNavRef = useRef<HTMLDivElement>(null);
  const isScrollingFromClick = useRef(false);

  /* ---- Derived template values ---- */
  const template = business?.templateName ?? 'modern';
  const accent = getAccentColor(template, business?.primaryColor ?? '');
  const headerBg = getHeaderBg(template, business?.primaryColor ?? '');
  const headerText = getHeaderTextColor(template);
  const headerSubText = getHeaderSubTextColor(template);

  /* ---- Fetch data ---- */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/menu/categories?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) {
          if (res.status === 404) setNotFound(true);
          else setNotFound(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        const biz = data.business ?? data;
        if (biz.status && biz.status !== 'published') {
          setUnpublished(true);
          setLoading(false);
          return;
        }
        setBusiness(biz);
        const cats: MenuCategory[] = (biz.categories ?? data.categories ?? []).sort(
          (a: MenuCategory, b: MenuCategory) => a.sortOrder - b.sortOrder
        );
        cats.forEach((c: MenuCategory) => {
          if (c.items) c.items.sort((a: MenuItem, b: MenuItem) => a.sortOrder - b.sortOrder);
        });
        setCategories(cats);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  /* ---- Track analytics ---- */
  useEffect(() => {
    if (isPreview || !business) return;
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: business.id, eventType: 'view' }),
    }).catch(() => {});
  }, [business, isPreview]);

  /* ---- Filtered items ---- */
  const filteredCategories = useMemo(() => {
    let cats = categories;
    if (activeCategory !== 'all') {
      cats = cats.filter((c) => c.id === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      cats = cats
        .map((c) => ({
          ...c,
          items: (c.items ?? []).filter(
            (i) =>
              i.name.toLowerCase().includes(q) ||
              (i.description?.toLowerCase().includes(q) ?? false)
          ),
        }))
        .filter((c) => (c.items ?? []).length > 0);
    }
    return cats;
  }, [categories, activeCategory, searchQuery]);

  /* ---- Order helpers ---- */
  const addToOrder = useCallback((item: MenuItem) => {
    setOrderItems((prev) => {
      const existing = prev.find((o) => o.name === item.name);
      if (existing) {
        return prev.map((o) =>
          o.name === item.name ? { ...o, quantity: o.quantity + 1 } : o
        );
      }
      return [...prev, { name: item.name, price: item.price, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((index: number, delta: number) => {
    setOrderItems((prev) => {
      const next = [...prev];
      next[index].quantity += delta;
      if (next[index].quantity <= 0) next.splice(index, 1);
      return next;
    });
  }, []);

  const orderTotal = useMemo(
    () => orderItems.reduce((sum, o) => sum + o.price * o.quantity, 0),
    [orderItems]
  );

  const orderCount = useMemo(
    () => orderItems.reduce((sum, o) => sum + o.quantity, 0),
    [orderItems]
  );

  const isInOrder = useCallback((itemName: string) => {
    return orderItems.some((o) => o.name === itemName);
  }, [orderItems]);

  const getItemQty = useCallback((itemName: string) => {
    return orderItems.find((o) => o.name === itemName)?.quantity ?? 0;
  }, [orderItems]);

  /* ---- WhatsApp order ---- */
  const sendWhatsAppOrder = useCallback(() => {
    if (!business?.whatsapp || orderItems.length === 0) return;
    const lines = orderItems.map(
      (o) => `${o.name} x${o.quantity} — ${formatPrice(o.price * o.quantity)}`
    );
    const message =
      `🍽️ Order from ${business.name}\n\n` +
      lines.join('\n') +
      `\n\nTotal: ${formatPrice(orderTotal)}`;
    const phone = business.whatsapp.replace(/[^0-9]/g, '');
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
    setDrawerOpen(false);
  }, [business, orderItems, orderTotal]);

  /* ---- Category scroll ---- */
  const scrollToCategory = useCallback((catId: string) => {
    setActiveCategory(catId);
    if (catId === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    isScrollingFromClick.current = true;
    const el = categoryRefs.current[catId];
    if (el) {
      const offset = 200;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setTimeout(() => { isScrollingFromClick.current = false; }, 1000);
  }, []);

  /* ---- Scroll spy ---- */
  useEffect(() => {
    if (activeCategory !== 'all' || !categories.length) return;
    const handleScroll = () => {
      if (isScrollingFromClick.current) return;
      const scrollTop = window.scrollY;
      const offset = 220;
      let currentId = 'all';
      for (const cat of categories) {
        const el = categoryRefs.current[cat.id];
        if (el && el.offsetTop - offset <= scrollTop) {
          currentId = cat.id;
        }
      }
      if (currentId !== activeCategory && activeCategory === 'all') {
        setActiveCategory(currentId);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories, activeCategory]);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  /* ---- CSS custom properties for theming ---- */
  const cssVars = {
    '--menu-accent': accent,
  } as React.CSSProperties;

  /* ---- Loading skeleton ---- */
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-[60px] w-[60px] rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <Skeleton className="h-4 w-full max-w-sm" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-10 w-full mt-4" />
        </div>
        <div className="px-6 space-y-6 mt-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---- Not found ---- */
  if (notFound) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <FileX2 className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">This menu is not available</h2>
          <p className="text-gray-500 text-sm">
            The menu you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  /* ---- Unpublished ---- */
  if (unpublished) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Menu Unavailable</h2>
          <p className="text-gray-500 text-sm">
            This menu is currently unavailable. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  if (!business) return null;

  const open = isOpenNow(business.openingHours);
  const cardCls = getCardClasses(template);
  const sectionTitleCls = getSectionTitleClasses(template);
  const dividerCls = getDividerColor(template, accent);
  const priceColor = getPriceColor(template, accent);
  const placeholderGrad = getPlaceholderGradient(template, accent);
  const placeholderIcon = getPlaceholderIconColor(template);

  return (
    <div
      className={getTemplateClasses(template, business.primaryColor)}
      style={cssVars}
    >      {/* =================== HEADER =================== */}
      <header
        className={`relative pt-safe-top ${headerBg} transition-colors`}
      >
        <div className="px-4 pt-6 pb-6 sm:px-6 sm:pt-8 sm:pb-8">
          {/* Logo + Name row */}
          <div className="flex items-start gap-3 sm:gap-4">
            {business.logo ? (
              <img
                src={business.logo}
                alt={business.name}
                className="h-[60px] w-[60px] rounded-full object-cover border-2 border-white/30 shadow-md flex-shrink-0"
              />
            ) : (
              <div
                className="h-[60px] w-[60px] rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                style={{ backgroundColor: `${accent}20`, border: `2px solid ${accent}40` }}
              >
                <Store className="w-7 h-7" style={{ color: accent }} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className={`text-2xl sm:text-3xl font-bold leading-tight truncate ${headerText}`}>
                {business.name}
              </h1>
              {business.category && (
                <Badge
                  className="mt-1.5"
                  style={{
                    backgroundColor: `${accent}20`,
                    color: accent,
                    borderColor: `${accent}30`,
                  }}
                  variant="outline"
                >
                  {business.category}
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          {business.description && (
            <p className={`mt-3 text-sm leading-relaxed ${headerSubText}`}>
              {business.description}
            </p>
          )}

          {/* Info items */}
          <div className="mt-4 space-y-2">
            {/* Status */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                  open
                    ? 'bg-emerald-500/20 text-emerald-600'
                    : 'bg-red-500/20 text-red-500'
                }`}
                style={
                  !open
                    ? undefined
                    : ['luxury', 'dark'].includes(template)
                    ? { backgroundColor: `${accent}20`, color: accent }
                    : undefined
                }
              >
                <Clock className="w-3 h-3" />
                {open ? 'Open Now' : 'Closed'}
              </span>
            </div>

            {/* Address */}
            {business.address && (
              <div className={`flex items-center gap-2 text-sm ${headerSubText}`}>
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="line-clamp-1">{business.address}</span>
              </div>
            )}

            {/* Phone + WhatsApp row */}
            <div className="flex items-center gap-4">
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className={`flex items-center gap-2 text-sm ${headerSubText} hover:underline min-h-[44px] flex items-center`}
                >
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{business.phone}</span>
                </a>
              )}
              {business.whatsapp && (
                <a
                  href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 text-sm ${headerSubText} hover:underline min-h-[44px] flex items-center`}
                >
                  <MessageCircle className="w-4 h-4 flex-shrink-0" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* =================== SEARCH BAR (sticky) =================== */}
      <div
        className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 sm:px-6"
        style={{
          backgroundColor:
            ['dark', 'luxury'].includes(template) ? 'rgba(26,26,46,0.95)' : undefined,
          borderColor:
            ['dark', 'luxury'].includes(template) ? 'rgba(255,255,255,0.1)' : undefined,
        }}
      >
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            ['dark', 'luxury'].includes(template) ? 'text-gray-500' : 'text-gray-400'
          }`} />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all min-h-[44px] ${
              ['dark', 'luxury'].includes(template)
                ? 'bg-white/10 text-white placeholder-gray-500 border border-white/10 focus:border-white/30'
                : 'bg-gray-100 text-gray-900 placeholder-gray-400 focus:bg-gray-50 focus:ring-2'
            }`}
            style={{
              ...(template !== 'dark' && template !== 'luxury'
                ? { '--tw-ring-color': `${accent}30` } as React.CSSProperties
                : undefined),
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center ${
                ['dark', 'luxury'].includes(template) ? 'text-gray-400' : 'text-gray-400'
              }`}
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* =================== CATEGORY NAV (sticky) =================== */}
      {categories.length > 0 && (
        <div
          ref={categoryNavRef}
          className={`sticky top-[57px] z-20 border-b px-4 py-2.5 sm:px-6 ${
            ['dark', 'luxury'].includes(template)
              ? 'bg-[#1a1a2e]/95 backdrop-blur-md border-white/10'
              : 'bg-white/95 backdrop-blur-md border-gray-100'
          }`}
        >
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => scrollToCategory('all')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[44px] flex items-center ${
                activeCategory === 'all'
                  ? 'text-white shadow-sm'
                  : ['dark', 'luxury'].includes(template)
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={
                activeCategory === 'all'
                  ? { backgroundColor: accent }
                  : undefined
              }
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap min-h-[44px] flex items-center ${
                  activeCategory === cat.id
                    ? 'text-white shadow-sm'
                    : ['dark', 'luxury'].includes(template)
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={
                  activeCategory === cat.id
                    ? { backgroundColor: accent }
                    : undefined
                }
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* =================== MENU CONTENT =================== */}
      <main className="px-4 py-6 sm:px-6 pb-28">
        {/* No categories */}
        {categories.length === 0 && !searchQuery && (
          <div className="text-center py-20 space-y-3">
            <div
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${accent}15` }}
            >
              <ChefHat className="w-8 h-8" style={{ color: accent }} />
            </div>
            <h3 className="text-lg font-semibold">Menu coming soon</h3>
            <p className="text-sm text-gray-500">
              This business hasn&apos;t added any menu items yet.
            </p>
          </div>
        )}

        {/* No search results */}
        {searchQuery.trim() && filteredCategories.length === 0 && (
          <div className="text-center py-20 space-y-3">
            <div
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${accent}15` }}
            >
              <Search className="w-8 h-8" style={{ color: accent }} />
            </div>
            <h3 className="text-lg font-semibold">
              No items found for &apos;{searchQuery}&apos;
            </h3>
            <p className="text-sm text-gray-500">Try a different search term.</p>
          </div>
        )}

        {/* Category sections */}
        {filteredCategories.map((category) => {
          const items = category.items ?? [];
          const availableItems = items;
          return (
            <section
              key={category.id}
              ref={(el) => { categoryRefs.current[category.id] = el; }}
              className="mt-8 first:mt-0"
              id={`category-${category.id}`}
            >
              {/* Section heading */}
              <div className="flex items-center gap-3 mb-4">
                <h2 className={`text-lg sm:text-xl font-bold ${sectionTitleCls}`}>
                  {category.name}
                </h2>
                <div className={`flex-1 h-px ${dividerCls}`} />
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${accent}15`, color: accent }}
                >
                  {availableItems.length}
                </span>
              </div>

              {/* No items in category after filter */}
              {availableItems.length === 0 && (
                <div className="text-center py-12 space-y-2">
                  <UtensilsCrossed className={`w-8 h-8 mx-auto ${placeholderIcon}`} />
                  <p className="text-sm text-gray-500">No items available</p>
                </div>
              )}

              {/* Items grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableItems.map((item) => {
                  const inOrder = isInOrder(item.name);
                  const qty = getItemQty(item.name);
                  return (
                    <article
                      key={item.id}
                      className={`
                        group relative rounded-xl overflow-hidden transition-shadow duration-200 hover:shadow-md
                        ${cardCls}
                        ${!item.available ? 'opacity-60' : ''}
                      `}
                    >
                      {/* Image / Placeholder */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${placeholderGrad}`}
                          >
                            <UtensilsCrossed className={`w-10 h-10 ${placeholderIcon}`} />
                          </div>
                        )}

                        {/* Unavailable overlay */}
                        {!item.available && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-sm font-semibold bg-black/60 px-3 py-1 rounded-full">
                              Unavailable
                            </span>
                          </div>
                        )}

                        {/* Add button overlay */}
                        {item.available && business.whatsappOrder && !inOrder && (
                          <button
                            onClick={() => addToOrder(item)}
                            className="absolute bottom-2 right-2 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
                            style={{ backgroundColor: accent }}
                            aria-label={`Add ${item.name} to order`}
                          >
                            <Plus className="w-5 h-5 text-white" />
                          </button>
                        )}

                        {/* Quantity control overlay */}
                        {item.available && business.whatsappOrder && inOrder && (
                          <div className="absolute bottom-2 right-2 flex items-center gap-1 shadow-lg rounded-full overflow-hidden">
                            <button
                              onClick={() => {
                                const idx = orderItems.findIndex((o) => o.name === item.name);
                                if (idx >= 0) updateQuantity(idx, -1);
                              }}
                              className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-white transition-colors"
                              style={{ backgroundColor: accent }}
                              aria-label={`Decrease ${item.name} quantity`}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="min-w-[44px] min-h-[44px] flex items-center justify-center text-sm font-bold bg-white/95 text-gray-900">
                              {qty}
                            </span>
                            <button
                              onClick={() => addToOrder(item)}
                              className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-white transition-colors"
                              style={{ backgroundColor: accent }}
                              aria-label={`Increase ${item.name} quantity`}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Card body */}
                      <div className="p-3 sm:p-4">
                        <h3
                          className={`font-semibold text-sm sm:text-base leading-tight line-clamp-1 ${
                            ['dark', 'luxury'].includes(template) ? 'text-gray-100' : 'text-gray-900'
                          }`}
                        >
                          {item.name}
                        </h3>
                        {item.description && (
                          <p
                            className={`mt-1 text-xs sm:text-sm leading-relaxed line-clamp-2 ${
                              ['dark', 'luxury'].includes(template) ? 'text-gray-400' : 'text-gray-500'
                            }`}
                          >
                            {item.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`text-base sm:text-lg font-bold ${priceColor}`}>
                            {formatPrice(item.price)}
                          </span>
                          {/* Add to order text button (mobile alternative) */}
                          {item.available && business.whatsappOrder && !inOrder && (
                            <button
                              onClick={() => addToOrder(item)}
                              className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors min-h-[44px] flex items-center"
                              style={{
                                color: accent,
                                backgroundColor: `${accent}15`,
                              }}
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      {/* =================== WHATSAPP ORDER DRAWER =================== */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent
          className={`max-h-[85vh] ${
            ['dark', 'luxury'].includes(template)
              ? 'bg-[#1a1a2e] border-white/10'
              : ''
          }`}
        >
          <DrawerHeader>
            <DrawerTitle
              className={
                ['dark', 'luxury'].includes(template) ? 'text-white' : ''
              }
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" style={{ color: accent }} />
                Your Order
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${accent}20`, color: accent }}
                >
                  {orderCount}
                </span>
              </div>
            </DrawerTitle>
          </DrawerHeader>

          <div
            className={`flex-1 overflow-y-auto px-4 max-h-[50vh] ${
              ['dark', 'luxury'].includes(template)
                ? 'scrollbar-thin'
                : ''
            }`}
            style={
              ['dark', 'luxury'].includes(template)
                ? { scrollbarColor: 'rgba(255,255,255,0.2) transparent' }
                : undefined
            }
          >
            {orderItems.length === 0 ? (
              <div className="py-8 text-center">
                <UtensilsCrossed
                  className={`w-10 h-10 mx-auto mb-2 ${placeholderIcon}`}
                />\n                <p
                  className={`text-sm ${
                    ['dark', 'luxury'].includes(template)
                      ? 'text-gray-500'
                      : 'text-gray-400'
                  }`}
                >
                  Your cart is empty
                </p>
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {orderItems.map((orderItem, idx) => (
                  <div
                    key={orderItem.name}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      ['dark', 'luxury'].includes(template)
                        ? 'bg-white/5'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium text-sm truncate ${
                          ['dark', 'luxury'].includes(template)
                            ? 'text-gray-200'
                            : 'text-gray-900'
                        }`}
                      >
                        {orderItem.name}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${
                          ['dark', 'luxury'].includes(template)
                            ? 'text-gray-500'
                            : 'text-gray-400'
                        }`}
                      >
                        {formatPrice(orderItem.price)} each
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(idx, -1)}
                        className={`min-w-[36px] min-h-[36px] w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                          ['dark', 'luxury'].includes(template)
                            ? 'bg-white/10 text-gray-300 hover:bg-white/20'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        aria-label={`Decrease quantity`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span
                        className={`w-6 text-center font-semibold text-sm ${
                          ['dark', 'luxury'].includes(template)
                            ? 'text-white'
                            : 'text-gray-900'
                        }`}
                      >
                        {orderItem.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(idx, 1)}
                        className={`min-w-[36px] min-h-[36px] w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                          ['dark', 'luxury'].includes(template)
                            ? 'bg-white/10 text-gray-300 hover:bg-white/20'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        aria-label={`Increase quantity`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span
                      className={`font-semibold text-sm w-20 text-right ${priceColor}`}
                    >
                      {formatPrice(orderItem.price * orderItem.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DrawerFooter
            className={`border-t ${
              ['dark', 'luxury'].includes(template)
                ? 'border-white/10'
                : 'border-gray-200'
            }`}
          >
            {orderItems.length > 0 && (
              <div className="flex items-center justify-between w-full px-1 mb-2">
                <span
                  className={`font-semibold ${
                    ['dark', 'luxury'].includes(template)
                      ? 'text-gray-300'
                      : 'text-gray-700'
                  }`}
                >
                  Total
                </span>
                <span className={`text-xl font-bold ${priceColor}`}>
                  {formatPrice(orderTotal)}
                </span>
              </div>
            )}
            <button
              onClick={sendWhatsAppOrder}
              disabled={orderItems.length === 0}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all min-h-[44px] flex items-center justify-center gap-2 ${
                orderItems.length === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:opacity-90 active:scale-[0.98]'
              }`}
              style={{
                backgroundColor: orderItems.length > 0 ? accent : '#9ca3af',
                color:
                  ['luxury', 'dark'].includes(template) && orderItems.length > 0
                    ? '#000'
                    : '#fff',
              }}
            >
              <MessageCircle className="w-4 h-4" />
              Send Order via WhatsApp
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* =================== FLOATING WHATSAPP BUTTON =================== */}
      {business.whatsappOrder && orderCount > 0 && (
        <button
          onClick={() => setDrawerOpen(true)}
          className={`
            fixed bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2.5
            pl-5 pr-6 py-3.5 rounded-full shadow-2xl
            transition-all duration-200 active:scale-95
            ${getFloatingBtnClass(template, accent)}
          `}
          style={
            !['dark', 'luxury'].includes(template)
              ? { backgroundColor: accent }
              : undefined
          }
          aria-label={`View order — ${orderCount} items`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="font-semibold text-sm">
            View Order ({orderCount})
          </span>
          <span
            className={`
              absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px]
              rounded-full text-xs font-bold flex items-center justify-center text-white
            `}
            style={{ backgroundColor: '#ef4444' }}
          >
            {orderCount}
          </span>
        </button>
      )}

      {/* =================== INLINE SCROLLBAR HIDE =================== */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .pt-safe-top {
          padding-top: env(safe-area-inset-top, 0px);
        }
        .pb-safe-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
