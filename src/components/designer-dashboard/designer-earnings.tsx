'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Wallet,
  Clock,
  Banknote,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Receipt,
  Gift,
  ArrowRightLeft,
  CircleDollarSign,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Earning {
  id: string;
  amount: number;
  eventType: string;
  status: string;
  createdAt: string;
  templateId: string;
  templateName: string;
  templatePreviewImage: string;
}

interface Designer {
  totalEarnings: number;
  availableBalance: number;
  pendingEarnings: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmtNaira = (v: number) => '₦' + (v || 0).toLocaleString('en-NG');

const fmtDate = (d: string) => {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  available: { label: 'Available', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-600 border-amber-200' },
  reversed: { label: 'Reversed', className: 'bg-red-50 text-red-600 border-red-200' },
};

const eventTypeConfig: Record<
  string,
  { label: string; icon: React.ElementType }
> = {
  template_use: { label: 'Template Use', icon: CircleDollarSign },
  premium_use: { label: 'Premium Use', icon: Receipt },
  referral_bonus: { label: 'Referral Bonus', icon: Gift },
  adjustment: { label: 'Adjustment', icon: ArrowRightLeft },
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
/*  Loading Skeleton                                                   */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <>
      {/* Stat skeletons */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="py-5">
            <CardContent className="flex items-center gap-4">
              <Skeleton className="size-11 rounded-xl" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="mt-8 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Card>
          <CardContent className="py-4">
            {/* Header row */}
            <div className="flex items-center gap-4 px-5 py-2.5 border-b border-black/[0.06]">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-28 flex-1" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b last:border-0 border-black/[0.04]">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-36 flex-1" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20 rounded-full" />
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

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-gold/10 mb-4">
          <TrendingUp className="size-8 text-gold-dark" />
        </div>
        <h3 className="text-base font-semibold text-charcoal">No earnings yet</h3>
        <p className="mt-1 max-w-sm text-sm text-charcoal/50">
          When businesses use your templates, your earnings will appear here.
        </p>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Desktop Table Row                                                  */
/* ------------------------------------------------------------------ */

function EarningRow({ e }: { e: Earning }) {
  const sCfg = statusConfig[e.status] ?? statusConfig.pending;
  const evtCfg = eventTypeConfig[e.eventType] ?? { label: e.eventType, icon: CircleDollarSign };
  const EvtIcon = evtCfg.icon;

  const desktopRow = (
    <div className="hidden lg:flex items-center gap-4 px-5 py-3.5 border-b last:border-0 border-black/[0.04] transition-colors hover:bg-champagne/10">
      {/* Date */}
      <span className="text-sm text-charcoal/60 min-w-[100px]">{fmtDate(e.createdAt)}</span>
      {/* Template */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="size-9 shrink-0 rounded-lg overflow-hidden bg-champagne/30">
          {e.templatePreviewImage ? (
            <img src={e.templatePreviewImage} alt={e.templateName} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <ImageOff className="size-3.5 text-charcoal/20" />
            </div>
          )}
        </div>
        <span className="text-sm font-medium text-charcoal truncate">{e.templateName}</span>
      </div>
      {/* Event Type */}
      <div className="flex items-center gap-1.5 min-w-[130px]">
        <EvtIcon className="size-3.5 text-charcoal/40" />
        <span className="text-sm text-charcoal/70">{evtCfg.label}</span>
      </div>
      {/* Amount */}
      <span className="text-sm font-semibold text-charcoal min-w-[90px] text-right">{fmtNaira(e.amount)}</span>
      {/* Status */}
      <Badge variant="outline" className={sCfg.className}>{sCfg.label}</Badge>
    </div>
  );

  const mobileRow = (
    <div className="lg:hidden p-4 border-b last:border-0 border-black/[0.04] transition-colors hover:bg-champagne/10">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-9 shrink-0 rounded-lg overflow-hidden bg-champagne/30">
            {e.templatePreviewImage ? (
              <img src={e.templatePreviewImage} alt={e.templateName} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center">
                <ImageOff className="size-3.5 text-charcoal/20" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-charcoal truncate">{e.templateName}</p>
            <p className="text-xs text-charcoal/40 mt-0.5">{fmtDate(e.createdAt)}</p>
          </div>
        </div>
        <Badge variant="outline" className={sCfg.className}>{sCfg.label}</Badge>
      </div>
      <div className="flex items-center justify-between mt-2.5 pl-[46px]">
        <div className="flex items-center gap-1.5">
          <EvtIcon className="size-3.5 text-charcoal/40" />
          <span className="text-xs text-charcoal/50">{evtCfg.label}</span>
        </div>
        <span className="text-sm font-semibold text-charcoal">{fmtNaira(e.amount)}</span>
      </div>
    </div>
  );

  return (
    <>
      {desktopRow}
      {mobileRow}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Pagination                                                         */
/* ------------------------------------------------------------------ */

function Pagination({
  page,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-xs text-charcoal/40">
        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} transactions
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="text-charcoal/60"
        >
          <ChevronLeft className="size-4" />
          Prev
        </Button>
        <span className="text-xs text-charcoal/50 px-1">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="text-charcoal/60"
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function DesignerEarnings() {
  const { token } = useAuthStore();
  const [designer, setDesigner] = useState<Designer | null>(null);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const fetchDesigner = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/marketplace/designers/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load designer data');
      const json = await res.json();
      setDesigner(json.designer);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }, [token]);

  const fetchEarnings = useCallback(async (p: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/marketplace/earnings?page=${p}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load earnings');
      const json = await res.json();
      setEarnings(json.earnings ?? []);
      setTotal(json.total ?? 0);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([fetchDesigner(), fetchEarnings(page)])
      .finally(() => setLoading(false));
  }, [token, page, fetchDesigner, fetchEarnings]);

  if (loading) return <LoadingSkeleton />;

  const stats: StatCardProps[] = [
    {
      label: 'Total Earnings',
      value: fmtNaira(designer?.totalEarnings ?? 0),
      icon: Wallet,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Pending Earnings',
      value: fmtNaira(designer?.pendingEarnings ?? 0),
      icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      label: 'Available Balance',
      value: fmtNaira(designer?.availableBalance ?? 0),
      icon: Banknote,
      iconBg: 'bg-gold/10',
      iconColor: 'text-gold-dark',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gold/10">
          <TrendingUp className="size-5 text-gold-dark" />
        </div>
        <h1 className="text-xl font-bold text-charcoal">Earnings</h1>
      </div>

      <Separator />

      {/* Stat Cards */}
      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </section>

      {/* Transaction History */}
      <section>
        <h2 className="text-lg font-semibold text-charcoal mb-4">Transaction History</h2>

        {earnings.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <Card>
              {/* Desktop table header */}
              <div className="hidden lg:grid lg:grid-cols-[100px_1fr_130px_90px_90px] items-center gap-4 px-5 py-2.5 border-b border-black/[0.06] text-xs font-medium text-charcoal/40 uppercase tracking-wider">
                <span>Date</span>
                <span>Template</span>
                <span>Event Type</span>
                <span className="text-right">Amount</span>
                <span>Status</span>
              </div>
              {/* Rows */}
              {earnings.map((e) => (
                <EarningRow key={e.id} e={e} />
              ))}
            </Card>
            <Pagination
              page={page}
              total={total}
              limit={limit}
              onPageChange={setPage}
            />
          </>
        )}
      </section>
    </div>
  );
}
