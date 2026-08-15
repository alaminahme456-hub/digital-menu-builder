'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard, FileCode2, BarChart3, Wallet, ArrowDownToLine,
  User, Settings, Plus, Eye, Star, EyeOff, Edit, X,
  TrendingUp, ImageIcon, Heart, Layers, CheckCircle2, Clock, ArrowRight,
  PenTool, Globe, Link2, Briefcase, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuthStore, useAppStore } from '@/lib/store';
import { toast } from 'sonner';

// ─── Stat Card (matches overview.tsx pattern) ─────────────────────
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  colorClass: string;
  bgColorClass: string;
  loading?: boolean;
  extra?: React.ReactNode;
}

function StatCard({ icon: Icon, label, value, colorClass, bgColorClass, loading, extra }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            {loading ? <Skeleton className="h-8 w-20" /> : (
              <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
            )}
            {extra}
          </div>
          <div className={`flex size-12 items-center justify-center rounded-xl ${bgColorClass}`}>
            <Icon className={`size-6 ${colorClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Become a Designer Form ────────────────────────────────────────
function BecomeDesignerForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { token, user } = useAuthStore();
  const [form, setForm] = useState({
    fullName: '', displayName: '', username: '', email: user?.email || '',
    bio: '', country: '', portfolioLink: '', profileImage: '',
    specialties: [] as string[], socialLinks: {}, agreedTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [appStatus, setAppStatus] = useState<'idle' | 'pending'>('idle');

  const specialtyOptions = ['Book Cover Design', 'Menu Design', 'Branding', 'UI/UX', 'Print Design', 'Illustration'];

  const update = (k: string, v: string | boolean | string[]) => setForm((p) => ({ ...p, [k]: v }));
  const toggleSpec = (s: string) => {
    setForm((p) => ({
      ...p,
      specialties: p.specialties.includes(s) ? p.specialties.filter((x) => x !== s) : [...p.specialties, s],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agreedTerms) { toast.error('You must agree to the terms'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/marketplace/designers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Application submitted!');
      setAppStatus('pending');
      onSubmitted();
    } catch (err: any) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  if (appStatus === 'pending') {
    return (
      <Card className="border-gold/20 bg-champagne/20">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-gold/10">
            <Clock className="size-8 text-gold" />
          </div>
          <h3 className="mt-4 text-xl font-bold text-charcoal">Application Pending Review</h3>
          <p className="mt-2 max-w-md text-sm text-slate-600">
            Your designer application is being reviewed. We'll notify you once it's approved.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gold/15 bg-gradient-to-br from-champagne/20 to-ivory">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-charcoal">
            <PenTool className="size-6 text-gold" />
          </div>
          <div>
            <CardTitle className="text-charcoal">Become a Designer</CardTitle>
            <CardDescription>Share your design talent with the BizFlip community</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><Label>Full Name *</Label><Input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} required /></div>
            <div><Label>Display Name *</Label><Input value={form.displayName} onChange={(e) => update('displayName', e.target.value)} required /></div>
            <div><Label>Username *</Label><Input value={form.username} onChange={(e) => update('username', e.target.value)} required /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required /></div>
            <div className="sm:col-span-2"><Label>Country *</Label><Input value={form.country} onChange={(e) => update('country', e.target.value)} required /></div>
          </div>
          <div><Label>Bio *</Label><Textarea value={form.bio} onChange={(e) => update('bio', e.target.value)} rows={3} required /></div>
          <div><Label>Portfolio Link</Label><Input placeholder="https://..." value={form.portfolioLink} onChange={(e) => update('portfolioLink', e.target.value)} /></div>
          <div>
            <Label className="mb-2 block">Design Specialties</Label>
            <div className="flex flex-wrap gap-2">
              {specialtyOptions.map((s) => (
                <Badge key={s} variant={form.specialties.includes(s) ? 'default' : 'outline'}
                  className={`cursor-pointer transition-colors ${form.specialties.includes(s) ? 'bg-charcoal text-white hover:bg-charcoal-light' : 'border-gold/20 text-slate-600 hover:bg-gold/10'}`}
                  onClick={() => toggleSpec(s)}>{s}</Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.agreedTerms} onCheckedChange={(v) => update('agreedTerms', v)} id="terms" />
            <Label htmlFor="terms" className="text-sm text-slate-600">I agree to the Designer Terms of Service</Label>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-charcoal hover:bg-charcoal-light text-white">
            {loading && <Loader2 className="size-4 animate-spin" />}Submit Application
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: 'bg-emerald-100 text-emerald-700', pending: 'bg-amber-100 text-amber-700',
    rejected: 'bg-red-100 text-red-700', approved: 'bg-emerald-100 text-emerald-700',
    available: 'bg-emerald-100 text-emerald-700', paid: 'bg-blue-100 text-blue-700',
    reversed: 'bg-red-100 text-red-700', processing: 'bg-amber-100 text-amber-700',
  };
  return <Badge className={`${map[status] || 'bg-slate-100 text-slate-600'} text-xs`}>{status}</Badge>;
}

// ─── Main Component ────────────────────────────────────────────────
export default function DesignerPortal() {
  const { token } = useAuthStore();
  const { navigate } = useAppStore();
  const [designerData, setDesignerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDesigner, setIsDesigner] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [wdOpen, setWdOpen] = useState(false);
  const [wdForm, setWdForm] = useState({ amount: '', bankName: '', accountName: '', accountNumber: '' });
  const [wdLoading, setWdLoading] = useState(false);

  // Tab-specific data
  const [earnings, setEarnings] = useState<any[]>([]);
  const [earningsPage, setEarningsPage] = useState(1);
  const [earningsTotal, setEarningsTotal] = useState(0);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [wdPage, setWdPage] = useState(1);
  const [wdTotal, setWdTotal] = useState(0);
  const [analytics, setAnalytics] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);

  const fetchDesignerData = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch('/api/marketplace/designers/me', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setDesignerData(data);
        setIsDesigner(true);
        setTemplates(data.recentTemplates || []);
      } else if (res.status === 404) {
        setIsDesigner(false);
      }
    } catch { /* */ } finally { setLoading(false); }
  }, [token]);

  const fetchEarnings = useCallback(async (page: number) => {
    try {
      const res = await fetch(`/api/marketplace/earnings?page=${page}&limit=10`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setEarnings(data.earnings || []);
      setEarningsTotal(data.pagination?.total || 0);
    } catch { /* */ }
  }, [token]);

  const fetchWithdrawals = useCallback(async (page: number) => {
    try {
      const res = await fetch(`/api/marketplace/withdrawals?page=${page}&limit=10`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setWithdrawals(data.withdrawals || []);
      setWdTotal(data.pagination?.total || 0);
    } catch { /* */ }
  }, [token]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/marketplace/analytics', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setAnalytics(data.designer ? data : null);
    } catch { /* */ }
  }, [token]);

  useEffect(() => { fetchDesignerData(); }, [fetchDesignerData]);
  useEffect(() => {
    if (isDesigner) { fetchEarnings(earningsPage); fetchWithdrawals(wdPage); fetchAnalytics(); }
  }, [isDesigner, earningsPage, wdPage, fetchEarnings, fetchWithdrawals, fetchAnalytics]);

  const handleWithdrawal = async () => {
    if (!wdForm.amount || !wdForm.bankName || !wdForm.accountName || !wdForm.accountNumber) {
      toast.error('All fields are required'); return;
    }
    setWdLoading(true);
    try {
      const res = await fetch('/api/marketplace/withdrawals', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: Number(wdForm.amount), ...wdForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Withdrawal requested!');
      setWdOpen(false);
      setWdForm({ amount: '', bankName: '', accountName: '', accountNumber: '' });
      fetchDesignerData();
      fetchWithdrawals(1);
    } catch (err: any) { toast.error(err.message); } finally { setWdLoading(false); }
  };

  const stats = designerData?.stats || {};

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  // Not a designer → show CTA
  if (!isDesigner) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-charcoal"><PenTool className="size-5 text-gold" /></div>
          <div><h2 className="text-2xl font-bold text-charcoal">Designer Portal</h2><p className="text-sm text-slate-500">Create and sell templates on the BizFlip marketplace</p></div>
        </div>
        <BecomeDesignerForm onSubmitted={() => setActiveTab('overview')} />
      </div>
    );
  }

  const fmtNaira = (v: number) => `₦${(v || 0).toLocaleString('en-NG')}`;
  const Paginate = ({ page, total, limit = 10, onPage }: { page: number; total: number; limit?: number; onPage: (p: number) => void }) => {
    const pages = Math.ceil(total / limit);
    if (pages <= 1) return null;
    return (
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-slate-500">Showing {Math.min(page * limit, total)} of {total}</p>
        <div className="flex gap-1">
          <Button size="icon" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft className="size-4" /></Button>
          <Button size="icon" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}><ChevronRight className="size-4" /></Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-charcoal"><PenTool className="size-5 text-gold" /></div>
          <div>
            <h2 className="text-2xl font-bold text-charcoal">Designer Portal</h2>
            <p className="text-sm text-slate-500">Welcome, {designerData?.designer?.displayName || 'Designer'}</p>
          </div>
        </div>
        <Button onClick={() => navigate('#/create-template')} className="bg-charcoal hover:bg-charcoal-light text-white">
          <Plus className="size-4" />Create Template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1 bg-slate-100">
          {[
            { val: 'overview', label: 'Overview', icon: LayoutDashboard },
            { val: 'templates', label: 'My Templates', icon: FileCode2 },
            { val: 'analytics', label: 'Analytics', icon: BarChart3 },
            { val: 'earnings', label: 'Earnings', icon: Wallet },
            { val: 'withdrawals', label: 'Withdrawals', icon: ArrowDownToLine },
            { val: 'profile', label: 'Profile', icon: User },
            { val: 'settings', label: 'Settings', icon: Settings },
          ].map((t) => (
            <TabsTrigger key={t.val} value={t.val} className="gap-1.5 text-xs sm:text-sm">
              <t.icon className="size-4" />{t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ─── Overview ─── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Wallet} label="Total Earnings" value={fmtNaira(stats.totalEarnings)} colorClass="text-gold" bgColorClass="bg-gold/10" />
            <StatCard icon={Wallet} label="Available Balance" value={fmtNaira(stats.availableBalance)} colorClass="text-emerald-600" bgColorClass="bg-emerald-50" />
            <StatCard icon={Clock} label="Pending Earnings" value={fmtNaira(stats.pendingEarnings)} colorClass="text-amber-600" bgColorClass="bg-amber-50" />
            <StatCard icon={FileCode2} label="Templates" value={stats.totalTemplates || 0} colorClass="text-charcoal" bgColorClass="bg-ivory" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Eye} label="Total Uses" value={stats.totalUses || 0} colorClass="text-blue-600" bgColorClass="bg-blue-50" />
            <StatCard icon={TrendingUp} label="Premium Uses" value={(designerData?.designer?.totalPremiumUses || 0)} colorClass="text-purple-600" bgColorClass="bg-purple-50" />
            <StatCard icon={Star} label="Rating" colorClass="text-amber-500" bgColorClass="bg-amber-50" extra={
              <div className="flex items-center gap-1">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium text-slate-700">{designerData?.designer?.rating || 0}</span>
              </div>
            } value="" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="cursor-pointer border-gold/15 bg-gradient-to-r from-champagne/20 to-ivory transition-shadow hover:shadow-md" onClick={() => navigate('#/create-template')}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex size-12 items-center justify-center rounded-xl bg-charcoal"><Plus className="size-6 text-gold" /></div>
                <div className="flex-1"><p className="font-semibold text-charcoal">Create Template</p><p className="text-sm text-slate-500">Design a new book cover or menu template</p></div>
                <ArrowRight className="size-5 text-slate-400" />
              </CardContent>
            </Card>
            <Card className="cursor-pointer border-gold/15 bg-gradient-to-r from-champagne/20 to-ivory transition-shadow hover:shadow-md" onClick={() => setActiveTab('templates')}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex size-12 items-center justify-center rounded-xl bg-charcoal"><Eye className="size-6 text-gold" /></div>
                <div className="flex-1"><p className="font-semibold text-charcoal">View My Templates</p><p className="text-sm text-slate-500">Manage and track your published templates</p></div>
                <ArrowRight className="size-5 text-slate-400" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── My Templates ─── */}
        <TabsContent value="templates" className="space-y-6">
          {templates.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-16"><Layers className="size-12 text-slate-300" /><p className="mt-4 text-lg font-medium text-slate-600">No templates yet</p><Button onClick={() => navigate('#/create-template')} className="mt-4 bg-charcoal hover:bg-charcoal-light text-white"><Plus className="size-4" />Create Your First Template</Button></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((t: any) => (
                <Card key={t.id} className="overflow-hidden">
                  <div className="relative h-40 bg-slate-100">
                    {t.previewImages?.[0] ? <img src={t.previewImages[0]} alt={t.name} className="size-full object-cover" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="size-10 text-slate-300" /></div>}
                    <div className="absolute top-2 right-2"><StatusBadge status={t.status} /></div>
                    <Badge className="absolute top-2 left-2 bg-charcoal/80 text-white text-[10px]">{t.templateType?.replace('_', ' ')}</Badge>
                  </div>
                  <CardContent className="space-y-3 p-4">
                    <div><p className="font-semibold text-charcoal truncate">{t.name}</p><p className="text-xs text-slate-500">{t.category || 'Uncategorized'}</p></div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Eye className="size-3" />{t.totalViews || 0}</span>
                      <span className="flex items-center gap-1"><Layers className="size-3" />{t.totalUses || 0}</span>
                      <span className="flex items-center gap-1"><Heart className="size-3" />{t.totalFavorites || 0}</span>
                      <span className="flex items-center gap-1"><Star className="size-3" />{t.rating || 0}</span>
                    </div>
                    <div className="flex gap-2">
                      {t.status === 'pending' && <Button size="sm" variant="outline" className="flex-1 border-gold/20 text-charcoal hover:bg-gold/10"><Edit className="size-3" />Edit</Button>}
                      {t.status === 'published' && <Button size="sm" variant="outline" className="flex-1 border-gold/20 text-charcoal hover:bg-gold/10"><Eye className="size-3" />View</Button>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Analytics ─── */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Template Performance</CardTitle></CardHeader>
            <CardContent>
              {analytics?.templateBreakdown?.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Template</TableHead><TableHead className="text-center">Views</TableHead><TableHead className="text-center">Applies</TableHead><TableHead className="text-center">Uses</TableHead><TableHead className="text-center">Favorites</TableHead><TableHead className="text-center">Rating</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {analytics.templateBreakdown.map((t: any) => (
                        <TableRow key={t.id}><TableCell className="font-medium">{t.name}</TableCell><TableCell className="text-center">{t.totalViews || 0}</TableCell><TableCell className="text-center">{t.totalApplications || 0}</TableCell><TableCell className="text-center">{t.totalUses || 0}</TableCell><TableCell className="text-center">{t.totalFavorites || 0}</TableCell><TableCell className="text-center"><div className="flex items-center justify-center gap-1"><Star className="size-3 fill-amber-400 text-amber-400" />{t.rating || 0}</div></TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : <p className="py-8 text-center text-sm text-slate-400">No analytics data yet</p>}
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatCard icon={Eye} label="Total Views" value={analytics?.totalViews || 0} colorClass="text-blue-600" bgColorClass="bg-blue-50" />
            <StatCard icon={Layers} label="Applications" value={analytics?.totalApplications || 0} colorClass="text-charcoal" bgColorClass="bg-ivory" />
            <StatCard icon={TrendingUp} label="Total Uses" value={analytics?.totalUses || 0} colorClass="text-emerald-600" bgColorClass="bg-emerald-50" />
            <StatCard icon={Heart} label="Favorites" value={analytics?.totalFavorites || 0} colorClass="text-rose-600" bgColorClass="bg-rose-50" />
          </div>
        </TabsContent>

        {/* ─── Earnings ─── */}
        <TabsContent value="earnings" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={Wallet} label="Total Earnings" value={fmtNaira(stats.totalEarnings)} colorClass="text-gold" bgColorClass="bg-gold/10" />
            <StatCard icon={CheckCircle2} label="Available" value={fmtNaira(stats.availableBalance)} colorClass="text-emerald-600" bgColorClass="bg-emerald-50" />
            <StatCard icon={Clock} label="Pending" value={fmtNaira(stats.pendingEarnings)} colorClass="text-amber-600" bgColorClass="bg-amber-50" />
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Earnings Ledger</CardTitle></CardHeader>
            <CardContent>
              {earnings.length > 0 ? (
                <>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Date</TableHead><TableHead>Template</TableHead><TableHead>Event</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {earnings.map((e: any) => (
                          <TableRow key={e.id}>
                            <TableCell className="text-sm text-slate-600">{new Date(e.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="font-medium text-sm">{e.marketplaceTemplates?.name || '—'}</TableCell>
                            <TableCell className="text-sm text-slate-500">{e.eventType || '—'}</TableCell>
                            <TableCell className="text-right font-semibold text-sm">{fmtNaira(e.amount)}</TableCell>
                            <TableCell><StatusBadge status={e.status} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Paginate page={earningsPage} total={earningsTotal} onPage={setEarningsPage} />
                </>
              ) : <p className="py-8 text-center text-sm text-slate-400">No earnings yet</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Withdrawals ─── */}
        <TabsContent value="withdrawals" className="space-y-6">
          <Card className="border-gold/15 bg-gradient-to-r from-champagne/20 to-ivory">
            <CardContent className="flex items-center justify-between p-6">
              <div><p className="text-sm text-slate-500">Available Balance</p><p className="text-3xl font-bold text-charcoal">{fmtNaira(stats.availableBalance)}</p></div>
              <Button onClick={() => setWdOpen(true)} className="bg-charcoal hover:bg-charcoal-light text-white"><ArrowDownToLine className="size-4" />Request Withdrawal</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Withdrawal History</CardTitle></CardHeader>
            <CardContent>
              {withdrawals.length > 0 ? (
                <>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Bank</TableHead><TableHead>Account</TableHead><TableHead>Status</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {withdrawals.map((w: any) => (
                          <TableRow key={w.id}>
                            <TableCell className="text-sm text-slate-600">{new Date(w.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right font-semibold text-sm">{fmtNaira(w.amount)}</TableCell>
                            <TableCell className="text-sm">{w.bankName}</TableCell>
                            <TableCell className="text-sm text-slate-500">{w.accountName} • {w.accountNumber}</TableCell>
                            <TableCell><StatusBadge status={w.status} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Paginate page={wdPage} total={wdTotal} onPage={setWdPage} />
                </>
              ) : <p className="py-8 text-center text-sm text-slate-400">No withdrawals yet</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Profile ─── */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Designer Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><Label>Display Name</Label><Input defaultValue={designerData?.designer?.displayName || ''} /></div>
                <div><Label>Username</Label><Input defaultValue={designerData?.designer?.username || ''} /></div>
              </div>
              <div><Label>Bio</Label><Textarea defaultValue={designerData?.designer?.bio || ''} rows={3} /></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><Label>Country</Label><Input defaultValue={designerData?.designer?.country || ''} /></div>
                <div><Label>Specialties</Label><Input defaultValue={designerData?.designer?.specialties?.join(', ') || ''} /></div>
              </div>
              <div><Label>Portfolio Link</Label><Input defaultValue={designerData?.designer?.portfolioLink || ''} /></div>
              <div><Label>Social Links</Label><Input defaultValue={designerData?.designer?.socialLinks ? JSON.stringify(designerData.designer.socialLinks) : ''} /></div>
              <Separator />
              <Button className="bg-charcoal hover:bg-charcoal-light text-white" onClick={() => toast.success('Profile saved!')}>Save Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Settings ─── */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Payout Information</CardTitle><CardDescription>Your bank details for withdrawals</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><Label>Bank Name</Label><Input placeholder="e.g. Access Bank" /></div>
                <div><Label>Account Name</Label><Input placeholder="Account holder name" /></div>
                <div><Label>Account Number</Label><Input placeholder="10-digit account number" /></div>
              </div>
              <Button className="bg-charcoal hover:bg-charcoal-light text-white" onClick={() => toast.success('Payout info saved!')}>Save Payout Info</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Notification Preferences</CardTitle><CardDescription>Manage how you receive notifications</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {['Template sales', 'Withdrawal updates', 'New reviews', 'Application status'].map((label) => (
                <div key={label} className="flex items-center justify-between">
                  <Label className="text-sm text-slate-700">{label}</Label>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Withdrawal Dialog */}
      <Dialog open={wdOpen} onOpenChange={setWdOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Withdrawal</DialogTitle><DialogDescription>Withdraw funds to your bank account</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Amount (₦)</Label><Input type="number" placeholder="Enter amount" value={wdForm.amount} onChange={(e) => setWdForm((p) => ({ ...p, amount: e.target.value }))} /></div>
            <div><Label>Bank Name</Label><Input placeholder="e.g. GTBank" value={wdForm.bankName} onChange={(e) => setWdForm((p) => ({ ...p, bankName: e.target.value }))} /></div>
            <div><Label>Account Name</Label><Input placeholder="Account holder" value={wdForm.accountName} onChange={(e) => setWdForm((p) => ({ ...p, accountName: e.target.value }))} /></div>
            <div><Label>Account Number</Label><Input placeholder="Account number" value={wdForm.accountNumber} onChange={(e) => setWdForm((p) => ({ ...p, accountNumber: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWdOpen(false)}>Cancel</Button>
            <Button onClick={handleWithdrawal} disabled={wdLoading} className="bg-charcoal hover:bg-charcoal-light text-white">{wdLoading && <Loader2 className="size-4 animate-spin" />}Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
