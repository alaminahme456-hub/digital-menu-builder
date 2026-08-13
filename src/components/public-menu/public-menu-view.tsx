'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Store,
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  UtensilsCrossed,
  X,
  FileX2,
  ChefHat,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/auth';
import type { Business, MenuCategory, MenuItem } from '@/lib/types';
import { FlipbookMenu } from '@/components/flipbook';

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

function getCategoryBtnStyle(template: string, primaryColor: string, isActive: boolean): React.CSSProperties {
  const t = template as TemplateName;
  if (isActive) {
    if (t === 'luxury' || t === 'dark') return { backgroundColor: primaryColor, color: '#fff' };
    if (t === 'colorful') return { background: `linear-gradient(135deg, ${primaryColor}, #ec4899)`, color: '#fff' };
    return { backgroundColor: primaryColor, color: '#fff' };
  }
  if (t === 'luxury' || t === 'dark') return { backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' };
  return { backgroundColor: '#f3f4f6', color: '#374151' };
}

/* ------------------------------------------------------------------ */
/*  Main Public Menu View                                               */
/* ------------------------------------------------------------------ */
export default function PublicMenuView({ slug, isPreview = false }: PublicMenuProps) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'flipbook' | 'list'>('flipbook');

  // Fetch data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function fetchMenu() {
      try {
        const [bizRes, catRes, itemRes] = await Promise.all([
          fetch(`/api/businesses/${slug}`),
          fetch(`/api/menu/categories?slug=${slug}`),
          fetch(`/api/menu/items?slug=${slug}`),
        ]);

        if (cancelled) return;

        if (!bizRes.ok) {
          setError('Business not found');
          return;
        }

        const bizData = await bizRes.json();
        const catData = await catRes.ok ? await catRes.json() : { categories: [] };
        const itemData = await itemRes.ok ? await itemRes.json() : { items: [] };

        setBusiness(bizData.business || bizData);
        setCategories(catData.categories || []);
        setItems(itemData.items || []);

        if (catData.categories?.length > 0) {
          setActiveCategory(catData.categories[0].id);
        }

        // Determine initial view mode based on business settings
        const biz = bizData.business || bizData;
        if (!biz.flipbookEnabled) {
          setViewMode('list');
        }
      } catch {
        if (!cancelled) setError('Failed to load menu');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMenu();
    return () => { cancelled = true; };
  }, [slug]);

  // Track analytics view
  useEffect(() => {
    if (business && !isPreview) {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: 'view', businessId: business.id }),
      }).catch(() => {});
    }
  }, [business, isPreview]);

  // Filter items by search and active category
  const filteredItems = useMemo(() => {
    let result = items;
    if (activeCategory) {
      result = result.filter((item) => item.categoryId === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, activeCategory, search]);

  /* ------------------------------------------------------------------ */
  /*  Loading state                                                      */
  /* ------------------------------------------------------------------ */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-emerald-600 animate-pulse" />
          </div>
          <p className="text-gray-500 text-sm">Loading menu...</p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Error state                                                        */
  /* ------------------------------------------------------------------ */
  if (error || !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {error || 'Menu Not Found'}
          </h2>
          <p className="text-gray-500 text-sm">
            This menu is no longer available or the link is incorrect.
          </p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Unpublished state                                                   */
  /* ------------------------------------------------------------------ */
  if (!isPreview && business.status !== 'published') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Menu Coming Soon</h2>
          <p className="text-gray-500 text-sm">
            This restaurant is still preparing their digital menu. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  const primaryColor = business.primaryColor || '#10b981';
  const secondaryColor = business.secondaryColor || '#059669';
  const templateName = business.templateName || 'modern';
  const fontMap: Record<string, React.CSSProperties['fontFamily']> = {
    inter: 'system-ui, -apple-system, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: '"Courier New", monospace',
    playfair: '"Playfair Display", Georgia, serif',
  };
  const fontFamily = fontMap[business.fontFamily] || fontMap.inter;

  /* ------------------------------------------------------------------ */
  /*  FLIPBOOK MODE                                                       */
  /* ------------------------------------------------------------------ */
  if (viewMode === 'flipbook' && business.flipbookEnabled) {
    return (
      <div className="min-h-screen bg-gray-100" style={{ fontFamily }}>
        {/* View mode switcher */}
        <div className="fixed top-3 right-3 z-[7000] flex gap-1 p-1 bg-white/90 backdrop-blur rounded-lg shadow-sm">
          <button
            onClick={() => setViewMode('flipbook')}
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
            style={{ backgroundColor: primaryColor, color: '#fff' }}
          >
            Flipbook
          </button>
          <button
            onClick={() => setViewMode('list')}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            List
          </button>
        </div>

        <FlipbookMenu
          business={business}
          categories={categories}
          items={items}
          isPreview={isPreview}
        />
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  LIST MODE (fallback / legacy)                                       */
  /* ------------------------------------------------------------------ */
  const headerTextColor = getHeaderTextColor(templateName);

  return (
    <div className={getTemplateClasses(templateName, primaryColor)} style={{ fontFamily }}>
      {/* View mode switcher */}
      {business.flipbookEnabled && (
        <div className="fixed top-3 right-3 z-50 flex gap-1 p-1 bg-white/90 backdrop-blur rounded-lg shadow-sm">
          <button
            onClick={() => setViewMode('flipbook')}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Flipbook
          </button>
          <button
            onClick={() => setViewMode('list')}
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
            style={{ backgroundColor: primaryColor, color: '#fff' }}
          >
            List
          </button>
        </div>
      )}

      {/* Header */}
      <div className={`${getHeaderBg(templateName, primaryColor)} ${headerTextColor} px-6 pt-8 pb-6`}>
        <div className="max-w-2xl mx-auto text-center">
          {business.logo ? (
            <img
              src={business.logo}
              alt={business.name}
              className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 shadow-lg ring-4 ring-white/20"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg ring-4 ring-white/20"
              style={{ backgroundColor: `${primaryColor}30`, color: headerTextColor === 'text-white' ? '#fff' : primaryColor }}
            >
              {business.name.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-2xl font-bold mb-1">{business.name}</h1>
          {business.description && (
            <p className={`text-sm opacity-80 line-clamp-2 max-w-md mx-auto ${headerTextColor === 'text-white' ? 'text-white/70' : 'text-gray-500'}`}>
              {business.description}
            </p>
          )}
          <div className={`flex flex-wrap items-center justify-center gap-3 mt-3 text-xs ${headerTextColor === 'text-white' ? 'text-white/60' : 'text-gray-400'}`}>
            {business.openingHours && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {business.openingHours}
              </span>
            )}
            {business.address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {business.address}
              </span>
            )}
            {business.whatsappOrder && (
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                Order via WhatsApp
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              style={{ focusRingColor: primaryColor }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="h-3.5 w-3.5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      {categories.length > 0 && (
        <div className="sticky top-[57px] z-20 bg-white/90 backdrop-blur border-b px-4 py-2">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all"
                  style={getCategoryBtnStyle(templateName, primaryColor, activeCategory === cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="max-w-2xl mx-auto p-4">
        {search && filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Search className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">No items match &ldquo;{search}&rdquo;</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <UtensilsCrossed className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">No items in this category</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 rounded-xl border border-gray-200/80 p-3 transition-shadow hover:shadow-md cursor-pointer"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-20 w-20 rounded-lg object-cover flex-shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="h-20 w-20 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl"
                    style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
                  >
                    {item.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                    {!item.available && (
                      <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                        Unavailable
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                  )}
                  <p className="text-sm font-bold mt-1.5" style={{ color: primaryColor }}>
                    {formatPrice(item.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-gray-400 border-t">
        Powered by <span className="font-semibold">MenuQR</span>
      </div>
    </div>
  );
}
