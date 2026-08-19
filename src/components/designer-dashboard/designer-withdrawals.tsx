'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Wallet,
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Banknote,
  AlertCircle,
  Landmark,
  User,
  Hash,
  CircleHelp,
  Inbox,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Withdrawal {
  id: string;
  amount: number;
  bankName: string;
  accountName: string;
  status: string;
  createdAt: string;
  processedAt: string | null;
  adminNotes: string | null;
  rejectionReason: string | null;
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
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-600 border-amber-200' },
  processing: { label: 'Processing', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-600 border-red-200' },
};

/* ------------------------------------------------------------------ */
/*  Loading Skeleton                                                   */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <>
      {/* Balance card skeleton */}
      <Card className="py-6">
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="size-12 rounded-xl" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-6 w-36" />
            </div>
          </div>
          <Skeleton className="h-10 w-44 rounded-lg" />
        </CardContent>
      </Card>
      {/* Table skeleton */}
      <div className="mt-8 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Card>
          <CardContent className="py-4">
            {/* Header row */}
            <div className="flex items-center gap-4 px-5 py-2.5 border-b border-black/[0.06]">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24 flex-1" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b last:border-0 border-black/[0.04]">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-28 flex-1" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-md" />
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
          <Inbox className="size-8 text-gold-dark" />
        </div>
        <h3 className="text-base font-semibold text-charcoal">No withdrawals yet</h3>
        <p className="mt-1 max-w-sm text-sm text-charcoal/50">
          When you request a withdrawal, it will appear here.
        </p>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Withdrawal Row                                                     */
/* ------------------------------------------------------------------ */

function WithdrawalRow({ w }: { w: Withdrawal }) {
  const sCfg = statusConfig[w.status] ?? statusConfig.pending;

  const rejectionBadge = w.status === 'rejected' && w.rejectionReason ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
        >
          <CircleHelp className="size-3.5" />
          Reason
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs bg-charcoal text-ivory">
        <p className="text-xs leading-relaxed">{w.rejectionReason}</p>
      </TooltipContent>
    </Tooltip>
  ) : null;

  const desktopRow = (
    <div className="hidden lg:flex items-center gap-4 px-5 py-3.5 border-b last:border-0 border-black/[0.04] transition-colors hover:bg-champagne/10">
      {/* Date */}
      <span className="text-sm text-charcoal/60 min-w-[100px]">{fmtDate(w.createdAt)}</span>
      {/* Amount */}
      <span className="text-sm font-semibold text-charcoal min-w-[100px]">{fmtNaira(w.amount)}</span>
      {/* Bank */}
      <span className="text-sm text-charcoal/70 flex-1 min-w-0 truncate">{w.bankName}</span>
      {/* Account */}
      <span className="text-sm text-charcoal/70 min-w-[140px] truncate">{w.accountName}</span>
      {/* Status */}
      <div className="flex items-center gap-2 min-w-[100px]">
        <Badge variant="outline" className={sCfg.className}>{sCfg.label}</Badge>
        {rejectionBadge}
      </div>
    </div>
  );

  const mobileRow = (
    <div className="lg:hidden p-4 border-b last:border-0 border-black/[0.04] transition-colors hover:bg-champagne/10">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-charcoal">{fmtNaira(w.amount)}</p>
          <p className="text-xs text-charcoal/40 mt-0.5">{fmtDate(w.createdAt)}</p>
        </div>
        <Badge variant="outline" className={sCfg.className}>{sCfg.label}</Badge>
      </div>
      <div className="mt-2.5 flex items-center gap-4 text-xs text-charcoal/50">
        <span className="truncate">{w.bankName} &middot; {w.accountName}</span>
      </div>
      {rejectionBadge && (
        <div className="mt-2 pl-0">
          {rejectionBadge}
        </div>
      )}
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
        Showing {(page - 1) * limit + 1}&ndash;{Math.min(page * limit, total)} of {total} withdrawals
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
/*  Withdrawal Form State                                             */
/* ------------------------------------------------------------------ */

interface WithdrawalForm {
  amount: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
}

const emptyForm: WithdrawalForm = {
  amount: '',
  bankName: '',
  accountName: '',
  accountNumber: '',
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function DesignerWithdrawals() {
  const { token } = useAuthStore();
  const [availableBalance, setAvailableBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  /* Dialog state */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<WithdrawalForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  /* Fetch designer balance */
  const fetchDesigner = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/marketplace/designers/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load designer data');
      const json = await res.json();
      setAvailableBalance(json.designer?.availableBalance ?? 0);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }, [token]);

  /* Fetch withdrawals list */
  const fetchWithdrawals = useCallback(async (p: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/marketplace/withdrawals?page=${p}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load withdrawals');
      const json = await res.json();
      setWithdrawals(json.withdrawals ?? []);
      setTotal(json.total ?? 0);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }, [token]);

  const refreshAll = useCallback(() => {
    fetchDesigner();
    fetchWithdrawals(page);
  }, [fetchDesigner, fetchWithdrawals, page]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([fetchDesigner(), fetchWithdrawals(page)])
      .finally(() => setLoading(false));
  }, [token, page, fetchDesigner, fetchWithdrawals]);

  /* Form helpers */
  const updateField = (field: keyof WithdrawalForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const amountNum = parseFloat(form.amount) || 0;
  const isFormValid =
    amountNum > 0 &&
    amountNum <= availableBalance &&
    form.bankName.trim().length > 0 &&
    form.accountName.trim().length > 0 &&
    form.accountNumber.trim().length > 0;

  /* Submit withdrawal */
  const handleSubmit = async () => {
    if (!isFormValid || !token) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/marketplace/withdrawals', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountNum,
          bankName: form.bankName.trim(),
          accountName: form.accountName.trim(),
          accountNumber: form.accountNumber.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Failed to request withdrawal');
      }
      toast.success('Withdrawal request submitted successfully!');
      setDialogOpen(false);
      setForm(emptyForm);
      refreshAll();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gold/10">
          <ArrowDownToLine className="size-5 text-gold-dark" />
        </div>
        <h1 className="text-xl font-bold text-charcoal">Withdrawals</h1>
      </div>

      <Separator />

      {/* Balance Card */}
      <Card className="py-6">
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gold/10">
              <Wallet className="size-6 text-gold-dark" />
            </div>
            <div>
              <p className="text-xs text-charcoal/50">Available Balance</p>
              <p className="text-2xl font-bold text-charcoal mt-0.5">{fmtNaira(availableBalance)}</p>
            </div>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            disabled={availableBalance <= 0}
            className="bg-gold-dark hover:bg-gold-dark/90 text-white w-full sm:w-auto"
          >
            <Banknote className="size-4" />
            Request Withdrawal
          </Button>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <section>
        <h2 className="text-lg font-semibold text-charcoal mb-4">Withdrawal History</h2>

        {withdrawals.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <Card>
              {/* Desktop table header */}
              <div className="hidden lg:grid lg:grid-cols-[100px_100px_1fr_140px_120px] items-center gap-4 px-5 py-2.5 border-b border-black/[0.06] text-xs font-medium text-charcoal/40 uppercase tracking-wider">
                <span>Date</span>
                <span>Amount</span>
                <span>Bank</span>
                <span>Account</span>
                <span>Status</span>
              </div>
              {/* Rows */}
              {withdrawals.map((w) => (
                <WithdrawalRow key={w.id} w={w} />
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

      {/* Request Withdrawal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) setForm(emptyForm);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-charcoal">Request Withdrawal</DialogTitle>
            <DialogDescription className="text-charcoal/50">
              Enter your bank details and the amount you want to withdraw.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="wd-amount" className="text-sm text-charcoal/70">
                Amount (₦)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-charcoal/40">
                  ₦
                </span>
                <Input
                  id="wd-amount"
                  type="number"
                  min={0}
                  max={availableBalance}
                  step={1}
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => updateField('amount', e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-charcoal/40">
                  Available: {fmtNaira(availableBalance)}
                </p>
                {form.amount && amountNum > availableBalance && (
                  <p className="text-[11px] text-red-500 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    Exceeds available balance
                  </p>
                )}
              </div>
            </div>

            {/* Bank Name */}
            <div className="space-y-1.5">
              <Label htmlFor="wd-bank" className="text-sm text-charcoal/70">
                Bank Name
              </Label>
              <div className="relative">
                <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-charcoal/30" />
                <Input
                  id="wd-bank"
                  type="text"
                  placeholder="e.g. GTBank"
                  value={form.bankName}
                  onChange={(e) => updateField('bankName', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Account Name */}
            <div className="space-y-1.5">
              <Label htmlFor="wd-acct-name" className="text-sm text-charcoal/70">
                Account Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-charcoal/30" />
                <Input
                  id="wd-acct-name"
                  type="text"
                  placeholder="Account holder name"
                  value={form.accountName}
                  onChange={(e) => updateField('accountName', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Account Number */}
            <div className="space-y-1.5">
              <Label htmlFor="wd-acct-num" className="text-sm text-charcoal/70">
                Account Number
              </Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-charcoal/30" />
                <Input
                  id="wd-acct-num"
                  type="text"
                  placeholder="10-digit account number"
                  value={form.accountNumber}
                  onChange={(e) => updateField('accountNumber', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setForm(emptyForm);
              }}
              className="text-charcoal/60"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || submitting}
              className="bg-gold-dark hover:bg-gold-dark/90 text-white min-w-[140px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Banknote className="size-4" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
