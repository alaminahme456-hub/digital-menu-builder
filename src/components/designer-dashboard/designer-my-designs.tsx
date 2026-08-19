'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  PenTool,
  Plus,
  Search,
  Eye,
  Download,
  Heart,
  Star,
  Pencil,
  Trash2,
  LayoutTemplate,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { useAuthStore, useAppStore } from '@/lib/store';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TemplateStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'removed';

type TemplateType = 'book_cover' | 'menu';

interface Template {
  id: string;
  name: string;
  description: string;
  templateType: TemplateType;
  category: string;
  status: TemplateStatus;
  totalViews: number;
  totalUses: number;
  totalPremiumUses: number;
  totalFavorites: number;
  previewImages: string[];
  createdAt: string;
  ratingSum: number;
  ratingCount: number;
}

interface ApiData {
  designer: Record<string, unknown>;
  stats: Record<string, number>;
  recentTemplates: Template[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmtNaira = (v: number) => '₦' + (v || 0).toLocaleString('en-NG');

const statusConfig: Record<string, { label: string; className: string }> = {
  draft:     { label: 'Draft',     className: 'bg-gray-100 text-gray-600 border-gray-200' },
  pending:   { label: 'Pending',   className: 'bg-amber-50 text-amber-600 border-amber-200' },
  published: { label: 'Published', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  rejected:  { label: 'Rejected',  className: 'bg-red-50 text-red-600 border-red-200' },
  removed:   { label: 'Removed',   className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const filterTabs: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'pending', label: 'Pending' },
  { key: 'published', label: 'Published' },
  { key: 'rejected', label: 'Rejected' },
];

/* ------------------------------------------------------------------ */
/*  Loading Skeleton                                                   */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <Skeleton className="aspect-[4/3] rounded-t-xl" />
          <CardContent className="space-y-3 pt-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */

function EmptyState({ onCreate, hasFilters }: { onCreate: () => void; hasFilters: boolean }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-gold/10 mb-4">
          <LayoutTemplate className="size-8 text-gold-dark" />
        </div>
        <h3 className="text-base font-semibold text-charcoal">
          {hasFilters ? 'No matching designs' : 'No designs yet'}
        </h3>
        <p className="mt-1 max-w-sm text-sm text-charcoal/50">
          {hasFilters
            ? 'Try adjusting your search or filter to find what you\'re looking for.'
            : 'Create your first menu template and start earning from the ALTECH marketplace.'}
        </p>
        {!hasFilters && (
          <Button onClick={onCreate} className="mt-5 bg-gold-dark hover:bg-gold-dark/90 text-white">
            <Plus className="size-4" />
            Create Your First Design
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Design Card                                                        */
/* ------------------------------------------------------------------ */

function DesignCard({
  t,
  onEdit,
  onDelete,
}: {
  t: Template;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = statusConfig[t.status] ?? statusConfig.draft;
  const preview = t.previewImages?.[0];
  const rating = t.ratingCount > 0 ? (t.ratingSum / t.ratingCount).toFixed(1) : null;

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      {/* Preview image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-champagne/40 to-ivory">
        {preview ? (
          <img
            src={preview}
            alt={t.name}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <PenTool className="size-10 text-charcoal/15" />
          </div>
        )}
        {/* Status badge overlay */}
        <div className="absolute top-2.5 right-2.5">
          <Badge variant="outline" className={`${cfg.className} backdrop-blur-sm`}>
            {cfg.label}
          </Badge>
        </div>
      </div>

      <CardContent className="space-y-3 pt-4 pb-5">
        {/* Name */}
        <h3 className="text-sm font-semibold text-charcoal truncate" title={t.name}>
          {t.name}
        </h3>

        {/* Category + type badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[11px] border-charcoal/10 text-charcoal/60 capitalize">
            {t.category}
          </Badge>
          <Badge
            variant="outline"
            className="text-[11px] border-gold/30 bg-gold/10 text-gold-dark capitalize"
          >
            {t.templateType.replace('_', ' ')}
          </Badge>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-charcoal/50">
          <span className="flex items-center gap-1" title="Views">
            <Eye className="size-3.5" />
            {t.totalViews}
          </span>
          <span className="flex items-center gap-1" title="Uses">
            <Download className="size-3.5" />
            {t.totalUses}
          </span>
          <span className="flex items-center gap-1" title="Favorites">
            <Heart className="size-3.5" />
            {t.totalFavorites}
          </span>
        </div>

        {/* Rating */}
        {rating && (
          <div className="flex items-center gap-1 text-xs">
            <Star className="size-3.5 fill-gold text-gold" />
            <span className="font-medium text-charcoal">{rating}</span>
            <span className="text-charcoal/40">({t.ratingCount})</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs text-charcoal/70 hover:text-gold-dark hover:border-gold/40"
            onClick={() => onEdit(t.id)}
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-charcoal/40 hover:text-red-600 hover:border-red-200"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Design</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &ldquo;{t.name}&rdquo;? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => onDelete(t.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function DesignerMyDesigns() {
  const { token } = useAuthStore();
  const { navigate } = useAppStore();
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch('/api/marketplace/designers/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load designs');
        return r.json();
      })
      .then(setData)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const templates = data?.recentTemplates ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      const matchSearch = !q || t.name.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [templates, search, statusFilter]);

  const handleCreate = () => navigate('#/designer/create');
  const handleEdit = (id: string) => navigate(`#/designer/create?edit=${id}`);
  const handleDelete = (id: string) => {
    toast.success('Design deleted successfully');
    setData((prev) =>
      prev
        ? { ...prev, recentTemplates: prev.recentTemplates.filter((t) => t.id !== id) }
        : prev,
    );
  };

  if (loading) return <LoadingSkeleton />;

  const hasFilters = search.trim() !== '' || statusFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gold/10">
            <LayoutTemplate className="size-5 text-gold-dark" />
          </div>
          <h1 className="text-xl font-semibold text-charcoal">My Designs</h1>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-gold-dark hover:bg-gold-dark/90 text-white"
        >
          <Plus className="size-4" />
          Create New Design
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-charcoal/30" />
        <Input
          placeholder="Search designs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 border-charcoal/10 focus-visible:ring-gold/30"
        />
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {filterTabs.map((tab) => {
          const active = statusFilter === tab.key;
          return (
            <Button
              key={tab.key}
              variant={active ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(tab.key)}
              className={
                active
                  ? 'bg-charcoal text-ivory hover:bg-charcoal/90'
                  : 'text-charcoal/60 hover:text-charcoal border-charcoal/10'
              }
            >
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Grid or empty state */}
      {filtered.length === 0 ? (
        <EmptyState onCreate={handleCreate} hasFilters={hasFilters} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <DesignCard key={t.id} t={t} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
