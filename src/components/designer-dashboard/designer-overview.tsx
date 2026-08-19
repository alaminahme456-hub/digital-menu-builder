'use client';

import React, { useEffect, useState } from 'react';
import {
  PenTool,
  CheckCircle,
  Eye,
  Wallet,
  Clock,
  Banknote,
  Plus,
  Pencil,
  ImageOff,
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

interface Designer {
  displayName: string;
  username: string;
  avatar: string;
  bio: string;
  country: string;
  specialties: string[];
  totalTemplates: number;
  totalUses: number;
  totalEarnings: number;
  availableBalance: number;
  pendingEarnings: number;
  ratingSum: number;
  ratingCount: number;
}

interface Template {
  id: string;
  name: string;
  category: string;
  status: 'draft' | 'pending' | 'published' | 'rejected';
  previewImages?: string[];
  uses?: number;
  earnings?: number;
}

interface ApiData {
  designer: Designer;
  stats: Record<string, number>;
  recentTemplates: Template[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmtNaira = (v: number) => '₦' + (v || 0).toLocaleString('en-NG');

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-600 border-amber-200' },
  published: { label: 'Published', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-600 border-red-200' },
};

/* ------------------------------------------------------------------ */
/*  Stat Card                                                           */
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
/*  Skeleton Grid                                                      */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <>
      {/* Stat skeletons */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
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
      {/* Table skeleton */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Card>
          <CardContent className="py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b last:border-0 border-black/[0.04]">
                <Skeleton className="size-12 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
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
          <PackageOpen className="size-8 text-gold-dark" />
        </div>
        <h3 className="text-base font-semibold text-charcoal">No designs yet</h3>
        <p className="mt-1 max-w-sm text-sm text-charcoal/50">
          Create your first menu template and start earning from the ALTECH marketplace.
        </p>
        <Button onClick={onCreate} className="mt-5 bg-gold-dark hover:bg-gold-dark/90 text-white">
          <Plus className="size-4" />
          Create Your First Design
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Template Row                                                       */
/* ------------------------------------------------------------------ */

function TemplateRow({ t, onEdit }: { t: Template; onEdit: (id: string) => void }) {
  const cfg = statusConfig[t.status] ?? statusConfig.draft;
  const preview = t.previewImages?.[0];

  const content = (
    <>
      {/* Preview thumbnail */}
      <div className="size-12 shrink-0 rounded-lg overflow-hidden bg-champagne/30">
        {preview ? (
          <img src={preview} alt={t.name} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageOff className="size-4 text-charcoal/20" />
          </div>
        )}
      </div>
      {/* Name & category */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-charcoal truncate">{t.name}</p>
        <p className="text-xs text-charcoal/40 mt-0.5 capitalize">{t.category}</p>
      </div>
      {/* Status */}
      <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
      {/* Uses — hidden on smallest screens */}
      <div className="hidden sm:block text-right min-w-[60px]">
        <p className="text-sm font-medium text-charcoal">{t.uses ?? 0}</p>
        <p className="text-[11px] text-charcoal/40">uses</p>
      </div>
      {/* Earnings — hidden on mobile */}
      <div className="hidden md:block text-right min-w-[90px]">
        <p className="text-sm font-medium text-charcoal">{fmtNaira(t.earnings ?? 0)}</p>
        <p className="text-[11px] text-charcoal/40">earned</p>
      </div>
      {/* Edit */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 text-charcoal/40 hover:text-gold-dark"
        onClick={() => onEdit(t.id)}
      >
        <Pencil className="size-4" />
        <span className="sr-only">Edit {t.name}</span>
      </Button>
    </>
  );

  return (
    <>
      {/* Desktop row */}
      <div className="hidden lg:flex items-center gap-4 px-5 py-3.5 border-b last:border-0 border-black/[0.04] transition-colors hover:bg-champagne/10">
        {content}
      </div>
      {/* Mobile card */}
      <div className="lg:hidden p-4 border-b last:border-0 border-black/[0.04] transition-colors hover:bg-champagne/10">
        <div className="flex items-start gap-3">
          <div className="size-12 shrink-0 rounded-lg overflow-hidden bg-champagne/30">
            {preview ? (
              <img src={preview} alt={t.name} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center">
                <ImageOff className="size-4 text-charcoal/20" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-charcoal truncate">{t.name}</p>
              <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
            </div>
            <p className="text-xs text-charcoal/40 mt-0.5 capitalize">{t.category}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-charcoal/50">
              <span>{t.uses ?? 0} uses</span>
              <span>{fmtNaira(t.earnings ?? 0)}</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-charcoal/40 hover:text-gold-dark"
            onClick={() => onEdit(t.id)}
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function DesignerOverview() {
  const { token } = useAuthStore();
  const { navigate } = useAppStore();
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch('/api/marketplace/designers/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load designer data');
        return r.json();
      })
      .then((d) => { if (!cancelled) setData(d); })
      .catch((err) => { if (!cancelled) toast.error(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  if (loading) return <LoadingSkeleton />;

  const d = data?.designer;
  const templates = data?.recentTemplates ?? [];

  const stats: StatCardProps[] = [
    { label: 'Total Designs', value: String(d?.totalTemplates ?? 0), icon: PenTool, iconBg: 'bg-gold/10', iconColor: 'text-gold-dark' },
    { label: 'Published Templates', value: String(d?.totalTemplates ?? 0), icon: CheckCircle, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { label: 'Total Template Uses', value: String(d?.totalUses ?? 0), icon: Eye, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Total Earnings', value: fmtNaira(d?.totalEarnings ?? 0), icon: Wallet, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { label: 'Pending Earnings', value: fmtNaira(d?.pendingEarnings ?? 0), icon: Clock, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { label: 'Available Balance', value: fmtNaira(d?.availableBalance ?? 0), icon: Banknote, iconBg: 'bg-gold/10', iconColor: 'text-gold-dark' },
  ];

  const handleCreate = () => navigate('#/designer/create');
  const handleEdit = (id: string) => navigate(`#/designer/edit/${id}`);

  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <section>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </section>

      {/* Recent Designs */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-charcoal">Recent Designs</h2>
          <Button
            size="sm"
            onClick={handleCreate}
            className="bg-gold-dark hover:bg-gold-dark/90 text-white"
          >
            <Plus className="size-4" />
            Create New
          </Button>
        </div>

        {templates.length === 0 ? (
          <EmptyState onCreate={handleCreate} />
        ) : (
          <Card>
            {/* Desktop table header */}
            <div className="hidden lg:grid lg:grid-cols-[48px_1fr_100px_80px_100px_44px] items-center gap-4 px-5 py-2.5 border-b border-black/[0.06] text-xs font-medium text-charcoal/40 uppercase tracking-wider">
              <span />
              <span>Name</span>
              <span>Status</span>
              <span className="text-right">Uses</span>
              <span className="text-right">Earnings</span>
              <span />
            </div>
            {/* Rows */}
            {templates.map((t) => (
              <TemplateRow key={t.id} t={t} onEdit={handleEdit} />
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
