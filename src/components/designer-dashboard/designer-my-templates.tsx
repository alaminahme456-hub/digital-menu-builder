'use client';

import React, { useEffect, useState } from 'react';
import {
  LayoutTemplate,
  Plus,
  Eye,
  Download,
  Heart,
  Star,
  Crown,
  PenTool,
  PackageOpen,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore, useAppStore } from '@/lib/store';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Template {
  id: string;
  name: string;
  templateType: string;
  category: string;
  status: string;
  totalViews: number;
  totalUses: number;
  totalPremiumUses: number;
  totalFavorites: number;
  previewImages: string[];
  ratingSum: number;
  ratingCount: number;
  createdAt: string;
  featured: boolean;
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

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor }: StatCardProps) {
  return (
    <Card className="py-5 transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`size-5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-charcoal truncate">{value}</p>
          <p className="text-xs text-charcoal/50 mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading Skeleton                                                   */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats skeletons */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="py-5">
            <CardContent className="flex items-center gap-4">
              <Skeleton className="size-11 rounded-xl" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Grid skeletons */}
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-gold/10 mb-4">
          <LayoutTemplate className="size-8 text-gold-dark" />
        </div>
        <h3 className="text-base font-semibold text-charcoal">No published templates</h3>
        <p className="mt-1 max-w-sm text-sm text-charcoal/50">
          Publish your first template to see it here in your public portfolio.
        </p>
        <Button onClick={onCreate} className="mt-5 bg-gold-dark hover:bg-gold-dark/90 text-white">
          <Plus className="size-4" />
          Create New Template
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Template Card                                                      */
/* ------------------------------------------------------------------ */

function TemplateCard({
  t,
  onClick,
}: {
  t: Template;
  onClick: (id: string) => void;
}) {
  const preview = t.previewImages?.[0];
  const rating =
    t.ratingCount > 0 ? (t.ratingSum / t.ratingCount).toFixed(1) : null;

  return (
    <Card
      className="group overflow-hidden cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => onClick(t.id)}
    >
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

        {/* Featured badge */}
        {t.featured && (
          <div className="absolute top-2.5 left-2.5">
            <Badge className="bg-gold-dark hover:bg-gold-dark/90 text-white border-0 gap-1">
              <Crown className="size-3" />
              Featured
            </Badge>
          </div>
        )}

        {/* Published badge */}
        <div className="absolute top-2.5 right-2.5">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 backdrop-blur-sm">
            Published
          </Badge>
        </div>
      </div>

      <CardContent className="space-y-3 pt-4 pb-5">
        {/* Name */}
        <h3 className="text-sm font-semibold text-charcoal truncate" title={t.name}>
          {t.name}
        </h3>

        {/* Category badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="text-[11px] border-charcoal/10 text-charcoal/60 capitalize"
          >
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
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function DesignerMyTemplates() {
  const { token } = useAuthStore();
  const { navigate } = useAppStore();
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch('/api/marketplace/designers/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load templates');
        return r.json();
      })
      .then(setData)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  /* Only published templates */
  const allTemplates = data?.recentTemplates ?? [];
  const published = allTemplates.filter((t) => t.status === 'published');

  /* Aggregate stats from published templates */
  const totalUses = published.reduce((s, t) => s + t.totalUses, 0);
  const totalFavorites = published.reduce((s, t) => s + t.totalFavorites, 0);
  const totalRatingSum = published.reduce((s, t) => s + t.ratingSum, 0);
  const totalRatingCount = published.reduce((s, t) => s + t.ratingCount, 0);
  const avgRating =
    totalRatingCount > 0
      ? (totalRatingSum / totalRatingCount).toFixed(1)
      : '0.0';

  const stats: StatCardProps[] = [
    {
      label: 'Total Published',
      value: String(published.length),
      icon: LayoutTemplate,
      iconBg: 'bg-gold/10',
      iconColor: 'text-gold-dark',
    },
    {
      label: 'Total Uses',
      value: totalUses.toLocaleString(),
      icon: Download,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Total Favorites',
      value: totalFavorites.toLocaleString(),
      icon: Heart,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-500',
    },
    {
      label: 'Average Rating',
      value: avgRating,
      icon: Star,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ];

  const handleCreate = () => navigate('#/designer/create');
  const handleCardClick = (_id: string) => navigate('#/designer/my-designs');

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gold/10">
            <LayoutTemplate className="size-5 text-gold-dark" />
          </div>
          <h1 className="text-xl font-semibold text-charcoal">My Templates</h1>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-gold-dark hover:bg-gold-dark/90 text-white"
        >
          <Plus className="size-4" />
          Create New
        </Button>
      </div>

      {/* Stats row */}
      <section>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </section>

      {/* Grid or empty state */}
      {published.length === 0 ? (
        <EmptyState onCreate={handleCreate} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {published.map((t) => (
            <TemplateCard key={t.id} t={t} onClick={handleCardClick} />
          ))}
        </div>
      )}
    </div>
  );
}
