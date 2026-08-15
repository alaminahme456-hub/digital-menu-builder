'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Store,
  Palette,
  DollarSign,
  BarChart3,
  Users,
  FileCheck,
  Wallet,
  Settings,
  RefreshCw,
  MoreHorizontal,
  CheckCircle2,
  Ban,
  Eye,
  Star,
  StarOff,
  MessageSquare,
  Loader2,
  Image,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────────────────────────

interface DesignerApplication {
  id: string;
  applicantName: string;
  username: string;
  email: string;
  country: string;
  specialties: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface TemplateReview {
  id: string;
  name: string;
  previewUrl: string | null;
  type: string;
  designerName: string;
  category: string;
  submittedAt: string;
  status: 'pending' | 'published' | 'rejected';
  featured: boolean;
}

interface Withdrawal {
  id: string;
  designerName: string;
  amount: number;
  bank: string;
  accountName: string;
  accountNumber: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
}

interface MarketplaceConfig {
  designerRevenueShare: number;
  platformRevenueShare: number;
  earningPerPremiumUse: number;
  currency: string;
  minimumWithdrawal: number;
}

interface MarketplaceStats {
  totalDesigners: number;
  pendingDesigners: number;
  totalTemplates: number;
  pendingTemplates: number;
  publishedTemplates: number;
  totalTemplateUses: number;
  premiumUses: number;
  totalPayouts: number;
  marketplaceRevenue: number;
  topDesigners: { name: string; templates: number; uses: number; revenue: number }[];
  topTemplates: { name: string; designer: string; uses: number; revenue: number }[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(amount: number, currency: string = '₦'): string {
  return `${currency}${amount.toLocaleString()}`;
}

// ── Status Badges ────────────────────────────────────────────────────────────

const applicationStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>;
    case 'approved':
      return <Badge className="bg-emerald-600 hover:bg-emerald-700">Approved</Badge>;
    case 'rejected':
      return <Badge className="bg-red-600 hover:bg-red-700">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const templateStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>;
    case 'published':
      return <Badge className="bg-emerald-600 hover:bg-emerald-700">Published</Badge>;
    case 'rejected':
      return <Badge className="bg-red-600 hover:bg-red-700">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const withdrawalStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>;
    case 'approved':
      return <Badge className="bg-sky-600 hover:bg-sky-700">Approved</Badge>;
    case 'rejected':
      return <Badge className="bg-red-600 hover:bg-red-700">Rejected</Badge>;
    case 'paid':
      return <Badge className="bg-emerald-600 hover:bg-emerald-700">Paid</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminMarketplace() {
  const { token } = useAuthStore();

  // Sub-tab state
  const [subTab, setSubTab] = useState('designers');

  // Data states
  const [designers, setDesigners] = useState<DesignerApplication[]>([]);
  const [templates, setTemplates] = useState<TemplateReview[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [config, setConfig] = useState<MarketplaceConfig>({
    designerRevenueShare: 70,
    platformRevenueShare: 30,
    earningPerPremiumUse: 50,
    currency: '₦',
    minimumWithdrawal: 5000,
  });
  const [stats, setStats] = useState<MarketplaceStats | null>(null);

  // Filter states
  const [designerFilter, setDesignerFilter] = useState<string>('all');
  const [templateStatusFilter, setTemplateStatusFilter] = useState<string>('all');
  const [templateTypeFilter, setTemplateTypeFilter] = useState<string>('all');

  // Loading states
  const [loading, setLoading] = useState({
    designers: false,
    templates: false,
    withdrawals: false,
    config: false,
    stats: false,
  });

  // Dialog states
  const [rejectDialog, setRejectDialog] = useState({
    open: false,
    type: '' as 'designer' | 'template' | 'withdrawal',
    id: '',
    reason: '',
  });
  const [changesDialog, setChangesDialog] = useState({
    open: false,
    id: '',
    message: '',
  });

  // ── Fetch Functions ──────────────────────────────────────────────────────

  const fetchDesigners = useCallback(async (status?: string) => {
    if (!token) return;
    setLoading((p) => ({ ...p, designers: true }));
    try {
      const query = status && status !== 'all' ? `?status=${status}` : '?status=all';
      const res = await fetch(`/api/admin/marketplace/designers${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDesigners(data.designers || []);
      }
    } catch {
      toast.error('Failed to load designer applications');
    } finally {
      setLoading((p) => ({ ...p, designers: false }));
    }
  }, [token]);

  const fetchTemplates = useCallback(async (status?: string, type?: string) => {
    if (!token) return;
    setLoading((p) => ({ ...p, templates: true }));
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.set('status', status);
      if (type && type !== 'all') params.set('type', type);
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/admin/marketplace/templates${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch {
      toast.error('Failed to load templates');
    } finally {
      setLoading((p) => ({ ...p, templates: false }));
    }
  }, [token]);

  const fetchWithdrawals = useCallback(async (status?: string) => {
    if (!token) return;
    setLoading((p) => ({ ...p, withdrawals: true }));
    try {
      const query = status && status !== 'all' ? `?status=${status}` : '';
      const res = await fetch(`/api/admin/marketplace/withdrawals${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch {
      toast.error('Failed to load withdrawals');
    } finally {
      setLoading((p) => ({ ...p, withdrawals: false }));
    }
  }, [token]);

  const fetchConfig = useCallback(async () => {
    if (!token) return;
    setLoading((p) => ({ ...p, config: true }));
    try {
      const res = await fetch('/api/admin/marketplace/config', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
      }
    } catch {
      // Config may not exist yet, use defaults
    } finally {
      setLoading((p) => ({ ...p, config: false }));
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    setLoading((p) => ({ ...p, stats: true }));
    try {
      const res = await fetch('/api/admin/marketplace/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch {
      toast.error('Failed to load marketplace stats');
    } finally {
      setLoading((p) => ({ ...p, stats: false }));
    }
  }, [token]);

  // ── Effects ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (subTab === 'designers') fetchDesigners(designerFilter);
  }, [subTab, designerFilter, fetchDesigners]);

  useEffect(() => {
    if (subTab === 'templates') fetchTemplates(templateStatusFilter, templateTypeFilter);
  }, [subTab, templateStatusFilter, templateTypeFilter, fetchTemplates]);

  useEffect(() => {
    if (subTab === 'withdrawals') fetchWithdrawals('pending');
  }, [subTab, fetchWithdrawals]);

  useEffect(() => {
    if (subTab === 'settings') fetchConfig();
  }, [subTab, fetchConfig]);

  useEffect(() => {
    if (subTab === 'analytics') fetchStats();
  }, [subTab, fetchStats]);

  // ── Actions ─────────────────────────────────────────────────────────────

  const handleReviewDesigner = async (
    id: string,
    action: 'approve' | 'reject',
    reason?: string
  ) => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/marketplace/designers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, action, reason }),
      });
      if (res.ok) {
        setDesigners((prev) =>
          prev.map((d) =>
            d.id === id
              ? { ...d, status: action === 'approve' ? 'approved' : 'rejected' }
              : d
          )
        );
        toast.success(`Designer application ${action === 'approve' ? 'approved' : 'rejected'}`);
      } else {
        toast.error(`Failed to ${action} designer`);
      }
    } catch {
      toast.error(`Failed to ${action} designer`);
    }
  };

  const handleReviewTemplate = async (
    id: string,
    action: 'approve' | 'reject' | 'request_changes' | 'feature' | 'unfeature',
    reason?: string
  ) => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/marketplace/templates', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, action, reason }),
      });
      if (res.ok) {
        if (action === 'feature' || action === 'unfeature') {
          setTemplates((prev) =>
            prev.map((t) =>
              t.id === id
                ? { ...t, featured: action === 'feature' }
                : t
            )
          );
          toast.success(`Template ${action === 'feature' ? 'featured' : 'unfeatured'}`);
        } else {
          setTemplates((prev) =>
            prev.map((t) =>
              t.id === id
                ? {
                    ...t,
                    status:
                      action === 'approve'
                        ? 'published'
                        : action === 'reject'
                          ? 'rejected'
                          : t.status,
                  }
                : t
            )
          );
          toast.success(
            action === 'approve'
              ? 'Template published'
              : action === 'reject'
                ? 'Template rejected'
                : 'Changes requested'
          );
        }
      } else {
        toast.error(`Failed to process template`);
      }
    } catch {
      toast.error('Failed to process template');
    }
  };

  const handleProcessWithdrawal = async (
    id: string,
    action: 'approve' | 'reject' | 'paid'
  ) => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/marketplace/withdrawals', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        setWithdrawals((prev) =>
          prev.map((w) =>
            w.id === id ? { ...w, status: action === 'paid' ? 'paid' : action } : w
          )
        );
        toast.success(`Withdrawal ${action === 'paid' ? 'marked as paid' : `${action}d`}`);
      } else {
        toast.error('Failed to process withdrawal');
      }
    } catch {
      toast.error('Failed to process withdrawal');
    }
  };

  const handleSaveConfig = async () => {
    if (!token) return;
    setLoading((p) => ({ ...p, config: true }));
    try {
      const res = await fetch('/api/admin/marketplace/config', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        toast.success('Marketplace settings saved');
      } else {
        toast.error('Failed to save settings');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setLoading((p) => ({ ...p, config: false }));
    }
  };

  const openRejectDialog = (type: 'designer' | 'template' | 'withdrawal', id: string) => {
    setRejectDialog({ open: true, type, id, reason: '' });
  };

  const handleRejectConfirm = () => {
    const { type, id, reason } = rejectDialog;
    if (!reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    if (type === 'designer') {
      handleReviewDesigner(id, 'reject', reason);
    } else if (type === 'template') {
      handleReviewTemplate(id, 'reject', reason);
    } else if (type === 'withdrawal') {
      handleProcessWithdrawal(id, 'reject');
    }
    setRejectDialog({ open: false, type: '', id: '', reason: '' });
  };

  const handleRequestChangesConfirm = () => {
    const { id, message } = changesDialog;
    if (!message.trim()) {
      toast.error('Please provide change details');
      return;
    }
    handleReviewTemplate(id, 'request_changes', message);
    setChangesDialog({ open: false, id: '', message: '' });
  };

  // ── Skeleton Loader ─────────────────────────────────────────────────────

  const TableSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="designers" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Designers</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <Palette className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Withdrawals</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── Designer Applications ──────────────────────────────────────── */}
        <TabsContent value="designers" className="mt-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Designer Applications</CardTitle>
                <CardDescription>
                  {designers.length} application{designers.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={designerFilter} onValueChange={setDesignerFilter}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchDesigners(designerFilter)}
                  disabled={loading.designers}
                >
                  <RefreshCw
                    className={`mr-1.5 h-3.5 w-3.5 ${loading.designers ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading.designers ? (
                <TableSkeleton />
              ) : designers.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  No designer applications found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Applicant</TableHead>
                        <TableHead className="hidden sm:table-cell">Username</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead className="hidden lg:table-cell">Country</TableHead>
                        <TableHead className="hidden lg:table-cell">Specialties</TableHead>
                        <TableHead className="hidden xl:table-cell">Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10"> </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {designers.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium text-sm">
                            {d.applicantName}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            @{d.username}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            {d.email}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">
                            {d.country}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {d.specialties.split(',').map((s) => (
                                <Badge key={s} variant="outline" className="text-xs">
                                  {s.trim()}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                            {formatDate(d.submittedAt)}
                          </TableCell>
                          <TableCell>{applicationStatusBadge(d.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {d.status === 'pending' && (
                                  <DropdownMenuItem
                                    onClick={() => handleReviewDesigner(d.id, 'approve')}
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                                    Approve
                                  </DropdownMenuItem>
                                )}
                                {d.status === 'pending' && (
                                  <DropdownMenuItem
                                    onClick={() => openRejectDialog('designer', d.id)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Ban className="mr-2 h-4 w-4" />
                                    Reject
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Profile
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Template Review ───────────────────────────────────────────── */}
        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Template Review</CardTitle>
                <CardDescription>
                  {templates.length} template{templates.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={templateStatusFilter} onValueChange={setTemplateStatusFilter}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={templateTypeFilter} onValueChange={setTemplateTypeFilter}>
                  <SelectTrigger className="w-[120px] h-9">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="menu">Menu</SelectItem>
                    <SelectItem value="landing">Landing Page</SelectItem>
                    <SelectItem value="portfolio">Portfolio</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTemplates(templateStatusFilter, templateTypeFilter)}
                  disabled={loading.templates}
                >
                  <RefreshCw
                    className={`mr-1.5 h-3.5 w-3.5 ${loading.templates ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading.templates ? (
                <TableSkeleton />
              ) : templates.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  No templates found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Preview</TableHead>
                        <TableHead>Template Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Type</TableHead>
                        <TableHead className="hidden md:table-cell">Designer</TableHead>
                        <TableHead className="hidden lg:table-cell">Category</TableHead>
                        <TableHead className="hidden xl:table-cell">Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10"> </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>
                            {t.previewUrl ? (
                              <div className="h-8 w-12 rounded bg-muted overflow-hidden">
                                <img
                                  src={t.previewUrl}
                                  alt={t.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-8 w-12 rounded bg-muted flex items-center justify-center">
                                <Image className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{t.name}</span>
                              {t.featured && (
                                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline" className="text-xs capitalize">
                              {t.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            {t.designerName}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                            {t.category || '—'}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                            {formatDate(t.submittedAt)}
                          </TableCell>
                          <TableCell>{templateStatusBadge(t.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {t.status === 'pending' && (
                                  <DropdownMenuItem
                                    onClick={() => handleReviewTemplate(t.id, 'approve')}
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                                    Approve
                                  </DropdownMenuItem>
                                )}
                                {(t.status === 'pending' || t.status === 'published') && (
                                  <DropdownMenuItem
                                    onClick={() => openRejectDialog('template', t.id)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Ban className="mr-2 h-4 w-4" />
                                    Reject
                                  </DropdownMenuItem>
                                )}
                                {t.status === 'pending' && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setChangesDialog({ open: true, id: t.id, message: '' })
                                    }
                                  >
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Request Changes
                                  </DropdownMenuItem>
                                )}
                                {t.status === 'published' && !t.featured && (
                                  <DropdownMenuItem
                                    onClick={() => handleReviewTemplate(t.id, 'feature')}
                                  >
                                    <Star className="mr-2 h-4 w-4" />
                                    Feature
                                  </DropdownMenuItem>
                                )}
                                {t.featured && (
                                  <DropdownMenuItem
                                    onClick={() => handleReviewTemplate(t.id, 'unfeature')}
                                  >
                                    <StarOff className="mr-2 h-4 w-4" />
                                    Unfeature
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Withdrawals ────────────────────────────────────────────────── */}
        <TabsContent value="withdrawals" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Withdrawal Requests</CardTitle>
                <CardDescription>
                  {withdrawals.length} pending request{withdrawals.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchWithdrawals('pending')}
                disabled={loading.withdrawals}
              >
                <RefreshCw
                  className={`mr-1.5 h-3.5 w-3.5 ${loading.withdrawals ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loading.withdrawals ? (
                <TableSkeleton />
              ) : withdrawals.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  No pending withdrawal requests
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Designer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="hidden sm:table-cell">Bank</TableHead>
                        <TableHead className="hidden md:table-cell">Account Name</TableHead>
                        <TableHead className="hidden lg:table-cell">Account Number</TableHead>
                        <TableHead className="hidden xl:table-cell">Requested</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10"> </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell className="font-medium text-sm">
                            {w.designerName}
                          </TableCell>
                          <TableCell className="font-semibold tabular-nums">
                            {formatCurrency(w.amount)}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">
                            {w.bank}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            {w.accountName}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm tabular-nums">
                            {w.accountNumber}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                            {formatDate(w.requestedAt)}
                          </TableCell>
                          <TableCell>{withdrawalStatusBadge(w.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {w.status === 'pending' && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleProcessWithdrawal(w.id, 'approve')}
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => openRejectDialog('withdrawal', w.id)}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <Ban className="mr-2 h-4 w-4" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {w.status === 'approved' && (
                                  <DropdownMenuItem
                                    onClick={() => handleProcessWithdrawal(w.id, 'paid')}
                                  >
                                    <DollarSign className="mr-2 h-4 w-4 text-emerald-600" />
                                    Mark as Paid
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Settings ───────────────────────────────────────────────────── */}
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Marketplace Configuration
              </CardTitle>
              <CardDescription>
                Configure revenue sharing, withdrawal settings, and marketplace parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 max-w-lg">
                <div className="grid gap-2">
                  <Label htmlFor="designerShare">Designer Revenue Share (%)</Label>
                  <Input
                    id="designerShare"
                    type="number"
                    min={0}
                    max={100}
                    value={config.designerRevenueShare}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        designerRevenueShare: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="platformShare">Platform Revenue Share (%)</Label>
                  <Input
                    id="platformShare"
                    type="number"
                    min={0}
                    max={100}
                    value={config.platformRevenueShare}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        platformRevenueShare: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="earningPremium">Earning per Premium Use</Label>
                  <Input
                    id="earningPremium"
                    type="number"
                    min={0}
                    value={config.earningPerPremiumUse}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        earningPerPremiumUse: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency Symbol</Label>
                  <Input
                    id="currency"
                    type="text"
                    value={config.currency}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        currency: e.target.value,
                      }))
                    }
                    placeholder="₦"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="minWithdrawal">Minimum Withdrawal Amount</Label>
                  <Input
                    id="minWithdrawal"
                    type="number"
                    min={0}
                    value={config.minimumWithdrawal}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        minimumWithdrawal: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="pt-2">
                  <Button
                    onClick={handleSaveConfig}
                    disabled={loading.config}
                  >
                    {loading.config ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Save Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Analytics ──────────────────────────────────────────────────── */}
        <TabsContent value="analytics" className="mt-6 space-y-6">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={loading.stats}
            >
              <RefreshCw
                className={`mr-1.5 h-3.5 w-3.5 ${loading.stats ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>

          {loading.stats ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="gap-4">
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-7 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="gap-4">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/50">
                      <Users className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">Total Designers</p>
                      <p className="text-xl font-bold tabular-nums">{formatNumber(stats.totalDesigners)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="gap-4">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/50">
                      <FileCheck className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">Pending Designers</p>
                      <p className="text-xl font-bold tabular-nums">{formatNumber(stats.pendingDesigners)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="gap-4">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/50">
                      <Palette className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">Total Templates</p>
                      <p className="text-xl font-bold tabular-nums">{formatNumber(stats.totalTemplates)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="gap-4">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/50">
                      <FileCheck className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">Pending Templates</p>
                      <p className="text-xl font-bold tabular-nums">{formatNumber(stats.pendingTemplates)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="gap-4">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">Published Templates</p>
                      <p className="text-xl font-bold tabular-nums">{formatNumber(stats.publishedTemplates)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="gap-4">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/50">
                      <Store className="h-5 w-5 text-sky-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">Total Template Uses</p>
                      <p className="text-xl font-bold tabular-nums">{formatNumber(stats.totalTemplateUses)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="gap-4">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/50">
                      <Star className="h-5 w-5 text-rose-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">Premium Uses</p>
                      <p className="text-xl font-bold tabular-nums">{formatNumber(stats.premiumUses)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="gap-4">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">Total Payouts</p>
                      <p className="text-xl font-bold tabular-nums">{formatCurrency(stats.totalPayouts)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Marketplace Revenue - prominent */}
              <Card className="border-emerald-200 dark:border-emerald-800">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
                    <BarChart3 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Marketplace Revenue</p>
                    <p className="text-3xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(stats.marketplaceRevenue)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Top Lists */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Top Designers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top Designers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.topDesigners.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No data available
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-72 overflow-y-auto">
                        {stats.topDesigners.map((d, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-3 py-2 border-b last:border-0"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs font-medium text-muted-foreground w-5 text-right">
                                {i + 1}
                              </span>
                              <span className="text-sm font-medium truncate">{d.name}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                              <span>{d.templates} templates</span>
                              <span>{formatNumber(d.uses)} uses</span>
                              <span className="font-medium text-foreground tabular-nums">
                                {formatCurrency(d.revenue)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Templates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top Templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.topTemplates.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No data available
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-72 overflow-y-auto">
                        {stats.topTemplates.map((t, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-3 py-2 border-b last:border-0"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs font-medium text-muted-foreground w-5 text-right">
                                {i + 1}
                              </span>
                              <div className="min-w-0">
                                <span className="text-sm font-medium truncate block">{t.name}</span>
                                <span className="text-xs text-muted-foreground">by {t.designer}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                              <span>{formatNumber(t.uses)} uses</span>
                              <span className="font-medium text-foreground tabular-nums">
                                {formatCurrency(t.revenue)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No analytics data available
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Reject Dialog ──────────────────────────────────────────────── */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog((p) => ({ ...p, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejectDialog.type === 'designer' ? 'Designer Application' : rejectDialog.type === 'template' ? 'Template' : 'Withdrawal'}</DialogTitle>
            <DialogDescription>
              Please provide a reason for the rejection. This will be communicated to the{' '}
              {rejectDialog.type}.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectDialog.reason}
            onChange={(e) => setRejectDialog((p) => ({ ...p, reason: e.target.value }))}
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, type: '', id: '', reason: '' })}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Request Changes Dialog ──────────────────────────────────────── */}
      <Dialog open={changesDialog.open} onOpenChange={(open) => setChangesDialog((p) => ({ ...p, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Describe the changes needed for this template. The designer will be notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Describe the required changes..."
            value={changesDialog.message}
            onChange={(e) => setChangesDialog((p) => ({ ...p, message: e.target.value }))}
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChangesDialog({ open: false, id: '', message: '' })}
            >
              Cancel
            </Button>
            <Button onClick={handleRequestChangesConfirm}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
