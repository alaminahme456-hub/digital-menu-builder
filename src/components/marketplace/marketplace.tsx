'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Heart, Star, Eye, Store, Palette, BookOpen, Grid,
  Filter, ChevronRight, ArrowRight, Sparkles, TrendingUp,
  Clock, Users, Loader2, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore, useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface MarketplaceTemplate {
  id: string;
  name: string;
  description?: string;
  template_type: 'book_cover' | 'menu';
  category: string;
  style?: string;
  designer_id: string;
  designer_name: string;
  designer_username?: string;
  preview_images?: string[];
  rating: number;
  uses_count: number;
  featured: boolean;
  config?: Record<string, unknown>;
  created_at?: string;
}

interface MarketplaceDesigner {
  id: string;
  display_name: string;
  username: string;
  avatar_url?: string;
  specialty?: string[];
  template_count: number;
  rating: number;
}

const CATEGORIES = ['All', 'Luxury', 'Minimal', 'Modern', 'Editorial', 'Classic', 'Creative'];
const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'highest_rated', label: 'Highest Rated' },
  { value: 'featured', label: 'Featured' },
];

const CATEGORY_GRADIENTS: Record<string, string> = {
  luxury: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 40%, #C9A84C 100%)',
  minimal: 'linear-gradient(135deg, #FAF9F6 0%, #F0EDE6 100%)',
  modern: 'linear-gradient(135deg, #1A1A1A 0%, #374151 100%)',
  editorial: 'linear-gradient(135deg, #FAF9F6 0%, #E8D5A3 50%, #1A1A1A 100%)',
  classic: 'linear-gradient(135deg, #2C1810 0%, #8B6914 100%)',
  creative: 'linear-gradient(135deg, #1E3A5F 0%, #C9A84C 100%)',
};

// ──────────────────────────────────────────────
// Skeleton Cards
// ──────────────────────────────────────────────
function TemplateCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-black/[0.06] overflow-hidden">
      <Skeleton className="w-full aspect-[4/3]" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function DesignerCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-black/[0.06] p-6 flex flex-col items-center gap-3">
      <Skeleton className="w-16 h-16 rounded-full" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

// ──────────────────────────────────────────────
// Template Preview Image
// ──────────────────────────────────────────────
function TemplatePreview({ template }: { template: MarketplaceTemplate }) {
  const imageUrl = template.preview_images?.[0];
  const gradient = CATEGORY_GRADIENTS[template.category?.toLowerCase()] || CATEGORY_GRADIENTS.modern;

  return (
    <div className="relative w-full aspect-[4/3] overflow-hidden bg-ivory">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={template.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: gradient }}
        >
          <span className="text-white/40 text-3xl font-editorial font-light tracking-tight">
            {template.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      {template.featured && (
        <div className="absolute top-3 left-3">
          <Badge className="bg-gold/90 text-white text-[10px] px-2 py-0.5 rounded-full border-0 font-medium">
            <Sparkles className="w-3 h-3 mr-1" />
            Featured
          </Badge>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Template Card
// ──────────────────────────────────────────────
function TemplateCard({
  template, isApplied, isApplying, onApply, onToggleFavorite, isFavorited, onViewDesigner,
}: {
  template: MarketplaceTemplate;
  isApplied: boolean;
  isApplying: boolean;
  onApply: (t: MarketplaceTemplate) => void;
  onToggleFavorite: (id: string) => void;
  isFavorited: boolean;
  onViewDesigner: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="group bg-white rounded-xl border border-black/[0.06] shadow-premium overflow-hidden hover:shadow-premium-lg hover:border-black/[0.12] transition-all duration-300"
    >
      <TemplatePreview template={template} />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-editorial text-sm font-semibold text-charcoal leading-snug line-clamp-1">
            {template.name}
          </h3>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(template.id); }}
            className="flex-shrink-0 p-1 -mr-1 -mt-1 rounded-full hover:bg-black/[0.04] transition-colors"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`w-4 h-4 transition-all duration-200 ${
                isFavorited
                  ? 'fill-red-500 text-red-500 scale-110'
                  : 'text-black/25 group-hover:text-black/50'
              }`}
            />
          </button>
        </div>
        <button
          onClick={() => onViewDesigner(template.designer_id)}
          className="text-xs text-black/45 hover:text-gold-dark transition-colors truncate block"
        >
          by {template.designer_name}
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="secondary"
            className="bg-gold/10 text-gold-dark text-[10px] px-2 py-0.5 rounded-full border-0 font-medium uppercase tracking-wider"
          >
            {template.category}
          </Badge>
          {template.template_type === 'book_cover' && (
            <Badge variant="secondary" className="bg-charcoal/5 text-charcoal/60 text-[10px] px-2 py-0.5 rounded-full border-0 font-medium">
              <BookOpen className="w-2.5 h-2.5 mr-1" />Cover
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3 text-xs text-black/40">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-gold fill-gold" />
              <span className="font-medium text-black/60">{template.rating.toFixed(1)}</span>
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />{template.uses_count}
            </span>
          </div>
          <Button
            size="sm"
            disabled={isApplying || isApplied}
            onClick={() => onApply(template)}
            className={
              isApplied
                ? 'bg-gold/10 text-gold-dark hover:bg-gold/15 border-0 h-8 text-xs px-3 rounded-lg'
                : 'bg-charcoal hover:bg-charcoal-light text-white h-8 text-xs px-3 rounded-lg'
            }
          >
            {isApplying ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              : isApplied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : null}
            {isApplied ? 'Applied' : 'Apply'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────
// Featured Horizontal Scroll
// ──────────────────────────────────────────────
function FeaturedSection({ templates, onApply, onToggleFavorite, applyingId, favorites, onViewDesigner }:
  { templates: MarketplaceTemplate[]; onApply: (t: MarketplaceTemplate) => void; onToggleFavorite: (id: string) => void; applyingId: string | null; favorites: string[]; onViewDesigner: (id: string) => void }) {
  if (templates.length === 0) return null;
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-gold" />
          </div>
          <h2 className="font-editorial text-xl font-semibold text-charcoal">Featured This Week</h2>
        </div>
        <button className="text-xs text-black/40 hover:text-gold-dark flex items-center gap-1 transition-colors">
          View all <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
        {templates.map((t) => (
          <div key={t.id} className="flex-shrink-0 w-[260px] sm:w-[280px]">
            <TemplateCard
              template={t} isApplied={false} isApplying={applyingId === t.id}
              onApply={onApply} onToggleFavorite={onToggleFavorite}
              isFavorited={favorites.includes(t.id)} onViewDesigner={onViewDesigner}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────
// Designer Card
// ──────────────────────────────────────────────
function DesignerCard({ designer, onViewProfile }: { designer: MarketplaceDesigner; onViewProfile: (username: string) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-black/[0.06] shadow-premium p-6 flex flex-col items-center text-center hover:shadow-premium-lg hover:border-black/[0.12] transition-all duration-300"
    >
      <Avatar className="w-16 h-16 mb-3 ring-2 ring-black/[0.04]">
        <AvatarImage src={designer.avatar_url} alt={designer.display_name} />
        <AvatarFallback className="bg-charcoal text-white font-editorial text-lg">
          {designer.display_name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <h3 className="font-editorial text-sm font-semibold text-charcoal">{designer.display_name}</h3>
      <p className="text-xs text-black/40 mb-3">@{designer.username}</p>
      <div className="flex flex-wrap gap-1.5 justify-center mb-4">
        {designer.specialty?.slice(0, 3).map((s) => (
          <Badge key={s} variant="secondary" className="bg-gold/10 text-gold-dark text-[10px] px-2 py-0.5 rounded-full border-0 font-medium">
            {s}
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-black/40 mb-4">
        <span className="flex items-center gap-1">
          <Grid className="w-3 h-3" />
          <span className="font-medium text-black/60">{designer.template_count}</span> templates
        </span>
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3 text-gold fill-gold" />
          <span className="font-medium text-black/60">{designer.rating.toFixed(1)}</span>
        </span>
      </div>
      <Button
        variant="outline" size="sm" onClick={() => onViewProfile(designer.username)}
        className="w-full border-black/[0.08] hover:bg-charcoal/5 h-8 text-xs rounded-lg"
      >
        View Profile <ArrowRight className="w-3 h-3 ml-1.5" />
      </Button>
    </motion.div>
  );
}

// ──────────────────────────────────────────────
// Empty State
// ──────────────────────────────────────────────
function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-ivory flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-black/20" />
      </div>
      <h3 className="font-editorial text-base font-semibold text-charcoal/70 mb-1.5">{title}</h3>
      <p className="text-sm text-black/35 max-w-xs">{description}</p>
    </div>
  );
}

// ──────────────────────────────────────────────
// Reusable Template Grid
// ──────────────────────────────────────────────
function TemplateGrid({
  templates, loading, hasMore, loadingMore, onLoadMore,
  isTemplateApplied, applyingId, onApply, onToggleFavorite, favorites, onViewDesigner,
  emptyIcon, emptyTitle, emptyDesc,
}: {
  templates: MarketplaceTemplate[];
  loading: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  isTemplateApplied: (t: MarketplaceTemplate) => boolean;
  applyingId: string | null;
  onApply: (t: MarketplaceTemplate) => void;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
  onViewDesigner: (id: string) => void;
  emptyIcon: React.ElementType;
  emptyTitle: string;
  emptyDesc: string;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => <TemplateCardSkeleton key={i} />)}
      </div>
    );
  }

  if (templates.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDesc} />;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <AnimatePresence mode="popLayout">
          {templates.map((t) => (
            <TemplateCard
              key={t.id} template={t}
              isApplied={isTemplateApplied(t)} isApplying={applyingId === t.id}
              onApply={onApply} onToggleFavorite={onToggleFavorite}
              isFavorited={favorites.includes(t.id)} onViewDesigner={onViewDesigner}
            />
          ))}
        </AnimatePresence>
      </div>
      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button variant="outline" onClick={onLoadMore} disabled={loadingMore} className="border-black/[0.08] hover:bg-charcoal/5 rounded-lg">
            {loadingMore && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Load More
          </Button>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════
// MAIN MARKETPLACE COMPONENT
// ═══════════════════════════════════════════
export default function Marketplace() {
  const { token } = useAuthStore();
  const {
    currentBusiness, marketplaceFavorites, toggleMarketplaceFavorite,
    appliedMarketplaceTemplate, appliedMarketplaceCoverTemplate,
    setAppliedMarketplaceTemplate, setAppliedMarketplaceCoverTemplate, navigate,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState('discover');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [featured, setFeatured] = useState<MarketplaceTemplate[]>([]);
  const [designers, setDesigners] = useState<MarketplaceDesigner[]>([]);
  const [favorites, setFavorites] = useState<MarketplaceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [designersLoading, setDesignersLoading] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // ── Fetch Templates ──
  const fetchTemplates = useCallback(async (append = false) => {
    if (!append) setLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (activeTab === 'book_covers') params.set('type', 'book_cover');
      else if (activeTab === 'menu') params.set('type', 'menu');
      else if (filterType !== 'all') params.set('type', filterType);
      if (filterCategory !== 'All') params.set('category', filterCategory);
      if (search.trim()) params.set('search', search.trim());
      params.set('sort', sortBy);
      params.set('page', String(append ? page : 1));
      params.set('limit', '20');

      const res = await fetch(`/api/marketplace/templates?${params}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const list: MarketplaceTemplate[] = data.templates || data || [];
        setTemplates(append ? (prev) => [...prev, ...list] : list);
        setHasMore(list.length >= 20);
        if (!append) setPage(2); else setPage((p) => p + 1);
      }
    } catch { toast.error('Failed to load templates'); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [activeTab, filterType, filterCategory, search, sortBy, page, token]);

  // ── Fetch Featured ──
  const fetchFeatured = useCallback(async () => {
    try {
      const res = await fetch('/api/marketplace/templates?featured=true&limit=10', { headers });
      if (res.ok) { const d = await res.json(); setFeatured(d.templates || d || []); }
    } catch { /* silent */ }
  }, [token]);

  // ── Fetch Designers ──
  const fetchDesigners = useCallback(async (q = '') => {
    setDesignersLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (q) params.set('search', q);
      const res = await fetch(`/api/marketplace/designers?${params}`, { headers });
      if (res.ok) { const d = await res.json(); setDesigners(d.designers || d || []); }
    } catch { toast.error('Failed to load designers'); }
    finally { setDesignersLoading(false); }
  }, [token]);

  // ── Fetch Favorites ──
  const fetchFavorites = useCallback(async () => {
    setFavoritesLoading(true);
    try {
      const res = await fetch('/api/marketplace/favorites', { headers });
      if (res.ok) { const d = await res.json(); setFavorites(d.templates || d || []); }
    } catch { toast.error('Failed to load favorites'); }
    finally { setFavoritesLoading(false); }
  }, [token]);

  // ── Effects ──
  useEffect(() => { fetchFeatured(); }, [fetchFeatured]);
  useEffect(() => { setPage(1); fetchTemplates(false); }, [activeTab, filterType, filterCategory, search, sortBy]);
  useEffect(() => { if (activeTab === 'designers') fetchDesigners(search); }, [activeTab, search, fetchDesigners]);
  useEffect(() => { if (activeTab === 'favorites') fetchFavorites(); }, [activeTab, fetchFavorites]);

  // ── Toggle Favorite ──
  const handleToggleFavorite = useCallback(async (id: string) => {
    const wasFav = marketplaceFavorites.includes(id);
    toggleMarketplaceFavorite(id);
    try {
      await fetch('/api/marketplace/favorites', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ templateId: id, action: wasFav ? 'remove' : 'add' }),
      });
      if (activeTab === 'favorites') fetchFavorites();
    } catch { toggleMarketplaceFavorite(id); toast.error('Failed to update favorites'); }
  }, [marketplaceFavorites, toggleMarketplaceFavorite, token, activeTab, fetchFavorites]);

  // ── Apply Template (optimistic) ──
  const handleApply = useCallback(async (template: MarketplaceTemplate) => {
    if (!currentBusiness?.id) { toast.error('Please select a business first'); return; }
    setApplyingId(template.id);
    const prevMenu = appliedMarketplaceTemplate;
    const prevCover = appliedMarketplaceCoverTemplate;
    if (template.template_type === 'menu') setAppliedMarketplaceTemplate(template.id);
    else setAppliedMarketplaceCoverTemplate(template.id);

    try {
      const res = await fetch(`/api/marketplace/templates/${template.id}/apply`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ businessId: currentBusiness.id, templateType: template.template_type }),
      });
      if (!res.ok) throw new Error();

      if (template.template_type === 'menu') {
        await fetch(`/api/businesses/${currentBusiness.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ templateConfig: template.config }),
        });
      } else {
        await fetch(`/api/businesses/${currentBusiness.id}/cover-template`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ coverConfig: template.config }),
        });
      }
      toast.success(`"${template.name}" applied successfully`);
    } catch {
      if (template.template_type === 'menu') setAppliedMarketplaceTemplate(prevMenu);
      else setAppliedMarketplaceCoverTemplate(prevCover);
      toast.error('Failed to apply template');
    } finally { setApplyingId(null); }
  }, [currentBusiness, token, appliedMarketplaceTemplate, appliedMarketplaceCoverTemplate, setAppliedMarketplaceTemplate, setAppliedMarketplaceCoverTemplate]);

  // ── Navigation helpers ──
  const viewDesigner = useCallback((id: string) => navigate('/designer-profile', { designerId: id }), [navigate]);
  const viewDesignerProfile = useCallback((username: string) => navigate('/designer-profile', { username }), [navigate]);
  const loadMore = useCallback(() => fetchTemplates(true), [fetchTemplates]);
  const isApplied = (t: MarketplaceTemplate) =>
    t.template_type === 'menu' ? appliedMarketplaceTemplate === t.id : appliedMarketplaceCoverTemplate === t.id;

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-charcoal tracking-tight mb-2">Marketplace</h1>
          <p className="text-sm text-black/40 max-w-md">Discover premium templates crafted by world-class designers. Apply instantly to elevate your brand.</p>
        </div>

        {/* ── Search & Filters ── */}
        <div className="bg-white rounded-xl border border-black/[0.06] shadow-premium p-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/25" />
              <Input
                placeholder="Search templates, designers, styles..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-ivory/50 border-black/[0.06] rounded-lg text-sm focus-visible:ring-gold/30"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px] h-10 bg-ivory/50 border-black/[0.06] rounded-lg text-xs">
                  <Filter className="w-3.5 h-3.5 mr-1.5 text-black/35" /><SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="book_cover">Book Covers</SelectItem>
                  <SelectItem value="menu">Menu Templates</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[130px] h-10 bg-ivory/50 border-black/[0.06] rounded-lg text-xs">
                  <Palette className="w-3.5 h-3.5 mr-1.5 text-black/35" /><SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] h-10 bg-ivory/50 border-black/[0.06] rounded-lg text-xs">
                  {sortBy === 'popular' && <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-black/35" />}
                  {sortBy === 'newest' && <Clock className="w-3.5 h-3.5 mr-1.5 text-black/35" />}
                  {sortBy === 'highest_rated' && <Star className="w-3.5 h-3.5 mr-1.5 text-black/35" />}
                  {sortBy === 'featured' && <Sparkles className="w-3.5 h-3.5 mr-1.5 text-black/35" />}
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white border border-black/[0.06] rounded-xl p-1 h-auto gap-1">
            {[
              ['discover', Sparkles, 'Discover'],
              ['book_covers', BookOpen, 'Book Covers'],
              ['menu', Grid, 'Menus'],
              ['favorites', Heart, 'My Favorites'],
              ['designers', Users, 'Designers'],
            ].map(([val, Icon, label]) => (
              <TabsTrigger
                key={val} value={val}
                className="rounded-lg px-4 py-2.5 text-xs font-medium data-[state=active]:bg-charcoal data-[state=active]:text-white data-[state=inactive]:text-black/45 transition-all"
              >
                <Icon className="w-3.5 h-3.5 mr-1.5" />{label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── DISCOVER ── */}
          <TabsContent value="discover" className="mt-0">
            <FeaturedSection
              templates={featured} onApply={handleApply} onToggleFavorite={handleToggleFavorite}
              applyingId={applyingId} favorites={marketplaceFavorites} onViewDesigner={viewDesigner}
            />
            <div className="flex items-center gap-3 mb-5">
              <h2 className="font-editorial text-lg font-semibold text-charcoal">All Templates</h2>
              <span className="text-xs text-black/30">{templates.length} results</span>
            </div>
            <TemplateGrid
              templates={templates} loading={loading} hasMore={hasMore} loadingMore={loadingMore}
              onLoadMore={loadMore} isTemplateApplied={isApplied} applyingId={applyingId}
              onApply={handleApply} onToggleFavorite={handleToggleFavorite}
              favorites={marketplaceFavorites} onViewDesigner={viewDesigner}
              emptyIcon={Search} emptyTitle="No templates found"
              emptyDesc="Try adjusting your search or filters to find what you're looking for."
            />
          </TabsContent>

          {/* ── BOOK COVERS ── */}
          <TabsContent value="book_covers" className="mt-0">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-charcoal/5 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-charcoal/60" />
              </div>
              <h2 className="font-editorial text-lg font-semibold text-charcoal">Book Cover Templates</h2>
            </div>
            <TemplateGrid
              templates={templates} loading={loading} hasMore={hasMore} loadingMore={loadingMore}
              onLoadMore={loadMore} isTemplateApplied={isApplied} applyingId={applyingId}
              onApply={handleApply} onToggleFavorite={handleToggleFavorite}
              favorites={marketplaceFavorites} onViewDesigner={viewDesigner}
              emptyIcon={BookOpen} emptyTitle="No book cover templates"
              emptyDesc="We're curating new book covers. Check back soon for fresh designs."
            />
          </TabsContent>

          {/* ── MENUS ── */}
          <TabsContent value="menu" className="mt-0">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-charcoal/5 flex items-center justify-center">
                <Grid className="w-4 h-4 text-charcoal/60" />
              </div>
              <h2 className="font-editorial text-lg font-semibold text-charcoal">Menu Templates</h2>
            </div>
            <TemplateGrid
              templates={templates} loading={loading} hasMore={hasMore} loadingMore={loadingMore}
              onLoadMore={loadMore} isTemplateApplied={isApplied} applyingId={applyingId}
              onApply={handleApply} onToggleFavorite={handleToggleFavorite}
              favorites={marketplaceFavorites} onViewDesigner={viewDesigner}
              emptyIcon={Grid} emptyTitle="No menu templates"
              emptyDesc="New menu layouts are on the way. Stay tuned for updates."
            />
          </TabsContent>

          {/* ── MY FAVORITES ── */}
          <TabsContent value="favorites" className="mt-0">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <Heart className="w-4 h-4 text-red-400" />
              </div>
              <h2 className="font-editorial text-lg font-semibold text-charcoal">My Favorites</h2>
              <span className="text-xs text-black/30">{favorites.length} saved</span>
            </div>
            <TemplateGrid
              templates={favorites} loading={favoritesLoading} hasMore={false} loadingMore={false}
              onLoadMore={loadMore} isTemplateApplied={isApplied} applyingId={applyingId}
              onApply={handleApply} onToggleFavorite={handleToggleFavorite}
              favorites={marketplaceFavorites} onViewDesigner={viewDesigner}
              emptyIcon={Heart} emptyTitle="No favorites yet"
              emptyDesc="Tap the heart icon on any template to save it here for quick access."
            />
          </TabsContent>

          {/* ── DESIGNERS ── */}
          <TabsContent value="designers" className="mt-0">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-charcoal/5 flex items-center justify-center">
                <Users className="w-4 h-4 text-charcoal/60" />
              </div>
              <h2 className="font-editorial text-lg font-semibold text-charcoal">Designer Profiles</h2>
              <span className="text-xs text-black/30">{designers.length} designers</span>
            </div>
            {designersLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => <DesignerCardSkeleton key={i} />)}
              </div>
            ) : designers.length === 0 ? (
              <EmptyState icon={Store} title="No designers found" description="No designers match your search. Try a different query." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                <AnimatePresence mode="popLayout">
                  {designers.map((d) => (
                    <DesignerCard key={d.id} designer={d} onViewProfile={viewDesignerProfile} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
