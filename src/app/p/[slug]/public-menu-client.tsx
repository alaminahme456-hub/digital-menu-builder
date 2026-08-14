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
  ChefHat,
  AlertCircle,
  BookOpen,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Send,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/auth';
import { FlipbookMenu, UploadFlipbook } from '@/components/flipbook';
import type { Business, MenuCategory, MenuItem, MenuUpload } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface PublicMenuClientProps {
  business: Record<string, unknown>;
  categories: Record<string, unknown>[];
  items: Record<string, unknown>[];
  uploads: Record<string, unknown>[];
  slug: string;
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
/*  WhatsApp order basket item                                          */
/* ------------------------------------------------------------------ */
interface BasketItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

/* ------------------------------------------------------------------ */
/*  Main Client Component                                               */
/* ------------------------------------------------------------------ */
export default function PublicMenuClient({ business: biz, categories: cats, items: rawItems, uploads, slug }: PublicMenuClientProps) {
  const business = biz as unknown as Business;
  const categories = cats as unknown as MenuCategory[];
  const items = rawItems as unknown as MenuItem[];

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'flipbook' | 'list'>(
    business.flipbookEnabled ? 'flipbook' : 'list'
  );
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [basket, setBasket] = useState<BasketItem[]>([]);

  // Set initial category — derive from categories instead of useEffect setState
  const effectiveActiveCategory = activeCategory || (categories.length > 0 ? categories[0].id : '');

  // Track analytics view
  useEffect(() => {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'view', businessId: business.id }),
    }).catch(() => {});
  }, [business.id]);

  // Filter items
  const filteredItems = useMemo(() => {
    let result = items;
    if (effectiveActiveCategory) {
      result = result.filter((item) => item.categoryId === effectiveActiveCategory);
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
  }, [items, effectiveActiveCategory, search]);

  // Basket helpers
  const addToBasket = (item: MenuItem) => {
    setBasket(prev => {
      const existing = prev.find(b => b.id === item.id);
      if (existing) {
        return prev.map(b => b.id === item.id ? { ...b, quantity: b.quantity + 1 } : b);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
    setSelectedItem(null);
  };

  const updateBasketQty = (id: string, delta: number) => {
    setBasket(prev => prev.map(b => {
      if (b.id !== id) return b;
      const newQty = b.quantity + delta;
      return newQty > 0 ? { ...b, quantity: newQty } : b;
    }).filter(b => b.quantity > 0));
  };

  const basketTotal = basket.reduce((sum, b) => sum + b.price * b.quantity, 0);
  const basketCount = basket.reduce((sum, b) => sum + b.quantity, 0);

  const sendWhatsAppOrder = () => {
    const phone = business.whatsapp?.replace(/[^0-9]/g, '');
    if (!phone) return;

    const greeting = business.whatsappGreeting || 'Hello, I would like to place an order:';
    const itemsStr = basket.map(b => `- ${b.name} x${b.quantity} (${formatPrice(b.price * b.quantity)})`).join('\n');
    const totalStr = `\n\nTotal: ${formatPrice(basketTotal)}`;
    const message = encodeURIComponent(`${greeting}\n\n${itemsStr}${totalStr}`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

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
  /*  UNPUBLISHED                                                        */
  /* ------------------------------------------------------------------ */
  if (business.status !== 'published') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">This Digital Experience is Currently Unavailable</h2>
          <p className="text-gray-500 text-sm">
            This business is updating their digital catalog. Please check back soon.
          </p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  PUBLISHED UPLOAD DETECTION                                         */
  /* ------------------------------------------------------------------ */
  const publishedUploads = uploads.filter((u: Record<string, unknown>) => u.published === true);
  const publishedUpload = publishedUploads.length > 0 ? publishedUploads[0] as unknown as MenuUpload : null;

  const hasPublishedUpload = !!publishedUpload;
  const hasManualItems = items.length > 0;

  /* ------------------------------------------------------------------ */
  /*  FLIPBOOK MODE — Published Upload Priority                           */
  /* ------------------------------------------------------------------ */
  if (viewMode === 'flipbook' && business.flipbookEnabled) {
    // If there's a published upload, use the upload flipbook
    if (hasPublishedUpload && publishedUpload) {
      return (
        <div className="bg-gray-100" style={{ fontFamily }}>
          <UploadFlipbook
            business={business}
            publishedUpload={publishedUpload}
            isPreview={false}
          />
        </div>
      );
    }

    // Otherwise, use the standard manual menu flipbook
    return (
      <div className="bg-gray-100" style={{ fontFamily }}>
        {/* View mode switcher — hidden on mobile for clean experience */}
        <div className="fixed top-3 right-3 z-[7000] hidden sm:flex gap-1 p-1 bg-white/90 backdrop-blur rounded-lg shadow-sm">
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

        {business.whatsappOrder && basket.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-[7000] safe-bottom p-3 max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border p-3 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{basketCount} item{basketCount > 1 ? 's' : ''}</p>
                <p className="text-xs text-muted-foreground">{formatPrice(basketTotal)}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setBasket([])}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button size="sm" style={{ backgroundColor: '#25D366', color: '#fff' }} onClick={sendWhatsAppOrder}>
                  <Send className="mr-1 h-4 w-4" />
                  Order on WhatsApp
                </Button>
              </div>
            </div>
          </div>
        )}

        <FlipbookMenu
          business={business}
          categories={categories}
          items={items}
          isPreview={false}
        />
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  LIST MODE                                                          */
  /* ------------------------------------------------------------------ */
  const headerTextColor = getHeaderTextColor(templateName);

  // If there's a published upload, show it in a simple viewer (non-flipbook list mode)
  if (hasPublishedUpload && publishedUpload && !business.flipbookEnabled) {
    const isImage = publishedUpload.fileType?.startsWith('image/');
    return (
      <div className={getTemplateClasses(templateName, primaryColor)} style={{ fontFamily }}>
        {/* Header */}
        <div className={`${getHeaderBg(templateName, primaryColor)} ${headerTextColor} px-6 pt-8 pb-6`}>
          <div className="max-w-2xl mx-auto text-center">
            {business.logo ? (
              <img src={business.logo} alt={business.name} className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 shadow-lg ring-4 ring-white/20" />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg ring-4 ring-white/20"
                style={{ backgroundColor: `${primaryColor}30`, color: headerTextColor === 'text-white' ? '#fff' : primaryColor }}>
                {business.name.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-2xl font-bold mb-1">{business.name}</h1>
            {business.description && (
              <p className={`text-sm opacity-80 line-clamp-2 max-w-md mx-auto ${headerTextColor === 'text-white' ? 'text-white/70' : 'text-gray-500'}`}>
                {business.description}
              </p>
            )}
          </div>
        </div>

        {/* Uploaded Menu Content */}
        <div className="max-w-2xl mx-auto p-4">
          <h2 className="text-lg font-bold mb-3 text-gray-900">Our Menu</h2>
          {isImage ? (
            <img src={publishedUpload.url} alt={publishedUpload.fileName} className="w-full rounded-xl shadow-md" />
          ) : (
            <div className="rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500 mb-3">{publishedUpload.fileName}</p>
              <a href={publishedUpload.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: primaryColor }}
              >
                View PDF Menu
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-6 text-xs text-gray-400 border-t">
          Powered by <span className="font-semibold">BizFlip</span>
        </div>
      </div>
    );
  }

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
                  style={getCategoryBtnStyle(templateName, primaryColor, effectiveActiveCategory === cat.id)}
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
                onClick={() => setSelectedItem(item)}
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

      {/* Product Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setSelectedItem(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {selectedItem.image && (
              <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-56 object-cover" />
            )}
            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-lg font-bold">{selectedItem.name}</h2>
                <button onClick={() => setSelectedItem(null)} className="p-1 hover:bg-gray-100 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {selectedItem.description && (
                <p className="text-sm text-gray-500 mb-3">{selectedItem.description}</p>
              )}
              <p className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
                {formatPrice(selectedItem.price)}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateBasketQty(selectedItem.id, -1)}
                    className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-gray-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-semibold text-lg w-8 text-center">
                    {basket.find(b => b.id === selectedItem.id)?.quantity || 0}
                  </span>
                  <button
                    onClick={() => updateBasketQty(selectedItem.id, 1)}
                    className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  onClick={() => addToBasket(selectedItem)}
                  disabled={!selectedItem.available}
                  style={{ backgroundColor: primaryColor, color: '#fff' }}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Order
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Basket (list mode) */}
      {business.whatsappOrder && basket.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50 max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border p-4 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{basketCount} item{basketCount > 1 ? 's' : ''}</p>
              <p className="text-xs text-muted-foreground">{formatPrice(basketTotal)}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setBasket([])}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button size="sm" style={{ backgroundColor: '#25D366', color: '#fff' }} onClick={sendWhatsAppOrder}>
                <Send className="mr-1 h-4 w-4" />
                Order on WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-6 text-xs text-gray-400 border-t">
        Powered by <span className="font-semibold">BizFlip</span>
      </div>
    </div>
  );
}
