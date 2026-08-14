'use client';

import { useState, useEffect } from 'react';
import {
  Smartphone,
  Monitor,
  Maximize2,
  X,
  ImageOff,
  Clock,
  MessageCircle,
  BookOpen,
  List,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore, useAppStore } from '@/lib/store';
import type { Business, MenuCategory, MenuItem } from '@/lib/types';
import { formatPrice } from '@/lib/auth';
import { FlipbookMenu } from '@/components/flipbook';

type PreviewMode = 'mobile' | 'desktop' | 'fullscreen';
type PreviewStyle = 'flipbook' | 'list';

export default function PreviewPanel() {
  const { token } = useAuthStore();
  const { currentBusiness, previewMode, setPreviewMode, activeTemplate, templateAppliedAt } = useAppStore();
  const [mode, setMode] = useState<PreviewMode>(previewMode || 'mobile');
  const [previewStyle, setPreviewStyle] = useState<PreviewStyle>('flipbook');
  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [dataVersion, setDataVersion] = useState(0);

  // Sync with store
  useEffect(() => {
    if (previewMode) {
      setMode(previewMode);
    }
  }, [previewMode]);

  // ──────────────────────────────────────────────
  // INSTANT REACTIVITY: When template is applied
  // from Templates page, re-fetch business data
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (templateAppliedAt && currentBusiness?.id) {
      // Small delay to let the DB update settle
      const timer = setTimeout(() => {
        setDataVersion((v) => v + 1);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [templateAppliedAt, currentBusiness?.id]);

  const handleModeChange = (value: string) => {
    const newMode = value as PreviewMode;
    setMode(newMode);
    setPreviewMode(newMode);
  };

  // Fetch business data (re-fetches on dataVersion change)
  useEffect(() => {
    if (!currentBusiness?.id || !token) return;
    setLoading(true);
    async function fetchData() {
      try {
        const [bizRes, catRes, itemRes] = await Promise.all([
          fetch(`/api/businesses/${currentBusiness.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/menu/categories?businessId=${currentBusiness.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/menu/items?businessId=${currentBusiness.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (bizRes.ok) {
          const data = await bizRes.json();
          setBusiness(data.business);
        }
        if (catRes.ok) {
          const data = await catRes.json();
          setCategories(data.categories || []);
          if (data.categories?.length > 0) {
            setActiveCategory(data.categories[0].id);
          }
        }
        if (itemRes.ok) {
          const data = await itemRes.json();
          setItems(data.items || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBusiness?.id, token, dataVersion]);

  // Manual refresh button
  const handleRefresh = () => {
    setDataVersion((v) => v + 1);
  };

  const fontMap: Record<string, string> = {
    inter: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
    playfair: '"Playfair Display", serif',
  };

  const fontFamily = fontMap[business?.fontFamily || 'inter'] || 'font-sans';
  const primaryColor = business?.primaryColor || '#10b981';
  const secondaryColor = business?.secondaryColor || '#064e3b';
  const templateName = business?.templateName || 'modern';

  // Use activeTemplate from store for instant preview (optimistic)
  const effectiveTemplate = activeTemplate || templateName;

  const filteredItems = items.filter((item) => item.categoryId === activeCategory);

  const renderListMenuContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col gap-3 p-4">
          <Skeleton className="mx-auto h-12 w-48" />
          <Skeleton className="mx-auto h-4 w-24" />
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-20 flex-shrink-0 rounded-full" />
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-20 w-20 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (!business) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <ImageOff className="h-12 w-12" />
          <p className="text-sm">No business selected</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col min-h-full" style={{ fontFamily: fontFamily as React.CSSProperties['fontFamily'] }}>
        {/* Header */}
        <div
          className="relative px-6 pt-8 pb-6 text-center"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          }}
        >
          <div className="flex flex-col items-center gap-2">
            {business.logo ? (
              <img
                src={business.logo}
                alt={business.name}
                className="h-16 w-16 rounded-xl object-cover ring-2 ring-white/30"
              />
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold text-white ring-2 ring-white/30"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                {business.name.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-xl font-bold text-white">{business.name}</h1>
            {business.description && (
              <p className="text-sm text-white/80 line-clamp-2 max-w-xs">
                {business.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-white/70">
              {business.openingHours && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {business.openingHours}
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

        {/* Template indicator badge */}
        {activeTemplate && activeTemplate !== templateName && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-center">
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
              Previewing with &quot;{activeTemplate}&quot; template (draft)
            </span>
          </div>
        )}

        {/* Category Navigation */}
        {categories.length > 0 && (
          <div className="sticky top-0 z-10 bg-white border-b px-4 py-2">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: activeCategory === cat.id ? primaryColor : '#f3f4f6',
                    color: activeCategory === cat.id ? '#ffffff' : '#374151',
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className="flex-1 p-4">
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ImageOff className="h-10 w-10 mb-2" />
              <p className="text-sm">No categories yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add categories and items to see your menu
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <p className="text-sm">No items in this category</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-xl border p-3 transition-shadow hover:shadow-md"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-lg flex-shrink-0"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <span className="text-2xl">
                        {item.name.charAt(0)}
                      </span>
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
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
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
        <div className="text-center py-4 text-xs text-muted-foreground border-t">
          Powered by BizFlip
        </div>
      </div>
    );
  };

  const renderFlipbookContent = () => {
    if (loading || !business) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      );
    }

    // Build business with effective template for instant preview
    const effectiveBusiness = activeTemplate
      ? { ...business, templateName: activeTemplate }
      : business;

    return (
      <FlipbookMenu
        business={effectiveBusiness}
        categories={categories}
        items={items}
        isPreview={true}
      />
    );
  };

  // Fullscreen mode
  if (mode === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 bg-gray-100">
        {/* Exit button */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <div className="flex gap-1 p-1 bg-white rounded-lg shadow-md">
            <button
              onClick={() => setPreviewStyle('flipbook')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                previewStyle === 'flipbook' ? 'bg-charcoal text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Flipbook
            </button>
            <button
              onClick={() => setPreviewStyle('list')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                previewStyle === 'list' ? 'bg-charcoal text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleModeChange('mobile')}
            className="shadow-md"
          >
            <X className="mr-1.5 h-4 w-4" />
            Exit
          </Button>
        </div>
        <div className="h-full overflow-y-auto">
          {previewStyle === 'flipbook' ? renderFlipbookContent() : renderListMenuContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Mode & Style Selectors */}
      <div className="flex items-center gap-3">
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && handleModeChange(v)}
          className="rounded-lg border bg-muted/50"
        >
          <ToggleGroupItem value="mobile" className="gap-1.5 px-4">
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Mobile</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="desktop" className="gap-1.5 px-4">
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">Desktop</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="fullscreen" className="gap-1.5 px-4">
            <Maximize2 className="h-4 w-4" />
            <span className="hidden sm:inline">Fullscreen</span>
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg border">
          <button
            onClick={() => setPreviewStyle('flipbook')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              previewStyle === 'flipbook' ? 'bg-charcoal text-white' : 'text-gray-600 hover:bg-muted'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Flipbook
          </button>
          <button
            onClick={() => setPreviewStyle('list')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              previewStyle === 'list' ? 'bg-charcoal text-white' : 'text-gray-600 hover:bg-muted'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            List
          </button>
        </div>

        {/* Refresh button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-1.5"
          title="Refresh preview"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Template indicator */}
      {activeTemplate && activeTemplate !== templateName && (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
          <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 text-xs">
            Draft
          </Badge>
          <span className="text-xs text-amber-700 dark:text-amber-300">
            Showing &quot;{activeTemplate}&quot; template — <strong>Publish</strong> to make it live
          </span>
        </div>
      )}

      {/* Mobile Frame */}
      {mode === 'mobile' && (
        <div className="relative mx-auto">
          <div
            className="rounded-[3rem] border-[6px] border-gray-800 bg-gray-800 shadow-2xl overflow-hidden"
            style={{ width: '390px' }}
          >
            <div className="relative bg-gray-800">
              <div className="mx-auto h-6 w-32 rounded-b-2xl bg-gray-800" />
            </div>
            <div
              className="bg-white overflow-y-auto"
              style={{ height: '680px', width: '378px' }}
            >
              {previewStyle === 'flipbook' ? renderFlipbookContent() : renderListMenuContent()}
            </div>
            <div className="flex justify-center py-2 bg-gray-800">
              <div className="h-1 w-32 rounded-full bg-gray-500" />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Frame */}
      {mode === 'desktop' && (
        <div className="mx-auto w-full max-w-5xl">
          <div className="rounded-xl border shadow-xl overflow-hidden">
            <div className="flex items-center gap-2 bg-gray-100 border-b px-4 py-2.5">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 rounded-md bg-white border px-4 py-1 text-sm text-muted-foreground max-w-md w-full">
                  <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span className="truncate">
                    bizflip.app/p/{currentBusiness?.slug || '...'}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-y-auto" style={{ height: '700px' }}>
              <div className="mx-auto max-w-3xl">
                {previewStyle === 'flipbook' ? renderFlipbookContent() : renderListMenuContent()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info text */}
      <p className="text-xs text-muted-foreground text-center">
        {mode === 'mobile' && 'Previewing in mobile viewport (390px)'}
        {mode === 'desktop' && 'Previewing in desktop viewport (1280px)'}
        {' \u00B7 '}
        {previewStyle === 'flipbook' ? 'Flipbook mode' : 'List mode'}
        {' \u00B7 '}
        Template: <strong>{effectiveTemplate}</strong>
      </p>
    </div>
  );
}
