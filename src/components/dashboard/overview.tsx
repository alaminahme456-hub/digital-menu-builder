'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  UtensilsCrossed,
  Eye,
  QrCode,
  CircleCheck,
  Upload,
  Camera,
  Palette,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  Menu,
  Globe,
  ExternalLink,
  Copy,
  Share2,
  type LucideIcon,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useAuthStore, useAppStore } from '@/lib/store';
import { AnalyticsSummary } from '@/lib/types';
import { getPublicBusinessUrl } from '@/lib/auth';
import { toast } from 'sonner';

const chartConfig = {
  views: {
    label: 'Views',
    color: '#10b981',
  },
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean };
  colorClass: string;
  bgColorClass: string;
  loading?: boolean;
}

function StatCard({ icon: Icon, label, value, trend, colorClass, bgColorClass, loading }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
            )}
            {trend && !loading && (
              <div className={`flex items-center gap-1 text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
                <TrendingUp className={`size-3 ${trend.positive ? '' : 'rotate-180'}`} />
                {trend.value}
              </div>
            )}
          </div>
          <div className={`flex size-12 items-center justify-center rounded-xl ${bgColorClass}`}>
            <Icon className={`size-6 ${colorClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  variant?: 'default' | 'outline';
}

const quickActions: QuickAction[] = [
  {
    label: 'Add Menu Item',
    href: '#/menu-manager',
    icon: Plus,
    description: 'Manually add items to your menu',
  },
  {
    label: 'Upload Menu',
    href: '#/upload-menu',
    icon: Upload,
    description: 'Upload a menu image or PDF',
  },
  {
    label: 'Scan with AI',
    href: '#/ai-scanner',
    icon: Camera,
    description: 'Scan a physical menu with AI',
  },
  {
    label: 'Change Template',
    href: '#/templates',
    icon: Palette,
    description: 'Customize your menu design',
  },
  {
    label: 'Download QR Code',
    href: '#/qr-code',
    icon: QrCode,
    description: 'Get a QR code for your menu',
  },
];

interface GettingStartedStep {
  step: number;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

const gettingStartedSteps: GettingStartedStep[] = [
  {
    step: 1,
    title: 'Add Menu Items',
    description: 'Start by adding your dishes, drinks, and other items to your digital menu.',
    href: '#/menu-manager',
    icon: UtensilsCrossed,
  },
  {
    step: 2,
    title: 'Choose a Template',
    description: 'Pick a beautiful design template that matches your brand identity.',
    href: '#/templates',
    icon: Palette,
  },
  {
    step: 3,
    title: 'Generate QR Code',
    description: 'Create a QR code that customers can scan to view your menu instantly.',
    href: '#/qr-code',
    icon: QrCode,
  },
  {
    step: 4,
    title: 'Share with Customers',
    description: 'Place the QR code on tables, receipts, or social media to reach customers.',
    href: '#/qr-code',
    icon: Eye,
  },
];

export default function Overview() {
  const { token, user } = useAuthStore();
  const { currentBusiness, navigate } = useAppStore();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    if (!currentBusiness?.id || !token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/analytics?businessId=${currentBusiness.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [currentBusiness?.id, token]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const today = format(new Date(), 'EEEE, MMMM d, yyyy');
  const menuItemsCount = (currentBusiness as any)?._count?.menuItems ?? 0;
  const isPublished = currentBusiness?.status === 'published';
  const hasNoItems = menuItemsCount === 0;

  // Format chart data
  const chartData = analytics?.dailyViews?.map((d) => ({
    ...d,
    date: format(new Date(d.date + 'T00:00:00'), 'MMM d'),
  })) ?? [];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}!
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {today}
            {currentBusiness && (
              <span className="ml-1">
                &middot; Managing <span className="font-medium text-slate-700">{currentBusiness.name}</span>
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={() => navigate('#/menu-manager')}
          className="mt-3 sm:mt-0 bg-charcoal hover:bg-charcoal-light text-white"
        >
          <Plus className="size-4" />
          Add Menu Item
        </Button>
      </div>

      {/* Getting Started Section (shown when business has 0 items) */}
      {hasNoItems && currentBusiness && (
        <Card className="border-gold/15 bg-champagne/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-gold" />
              <CardTitle className="text-lg text-charcoal">Get Started</CardTitle>
            </div>
            <CardDescription className="text-charcoal/50">
              Follow these steps to set up your digital menu and start receiving orders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {gettingStartedSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-charcoal text-sm font-bold text-white">
                    {step.step}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 text-charcoal" />
                        <h4 className="font-semibold text-slate-900">{step.title}</h4>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gold/20 text-gold-dark hover:bg-gold/10 hover:text-charcoal shrink-0"
                        onClick={() => navigate(step.href)}
                      >
                        {index === 0 ? 'Start' : 'Go'}
                        <ArrowRight className="size-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-slate-600">{step.description}</p>
                  </div>
                  {index < gettingStartedSteps.length - 1 && (
                    <div className="absolute left-5 top-14 hidden h-8 w-px bg-gold/15 sm:block" />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={UtensilsCrossed}
          label="Total Menu Items"
          value={loading ? '' : menuItemsCount}
          trend={
            menuItemsCount > 0
              ? { value: `${(currentBusiness as any)?._count?.categories ?? 0} categories`, positive: true }
              : undefined
          }
          colorClass="text-charcoal"
          bgColorClass="bg-ivory"
          loading={loading}
        />
        <StatCard
          icon={Eye}
          label="Menu Views"
          value={loading ? '' : (analytics?.totalViews ?? 0).toLocaleString()}
          trend={
            analytics && analytics.viewsWeek > 0
              ? { value: `+${analytics.viewsWeek} this week`, positive: true }
              : undefined
          }
          colorClass="text-blue-600"
          bgColorClass="bg-blue-50"
          loading={loading}
        />
        <StatCard
          icon={QrCode}
          label="QR Scans"
          value={loading ? '' : (analytics?.qrScans ?? 0).toLocaleString()}
          colorClass="text-purple-600"
          bgColorClass="bg-purple-50"
          loading={loading}
        />
        <StatCard
          icon={CircleCheck}
          label="Menu Status"
          value={loading ? '' : ''}
          colorClass={isPublished ? 'text-charcoal' : 'text-amber-600'}
          bgColorClass={isPublished ? 'bg-ivory' : 'bg-amber-50'}
          loading={loading}
        >
          {!loading && (
            <Badge
              className={`mt-1 text-xs ${
                isPublished
                  ? 'bg-charcoal/5 text-charcoal hover:bg-gold/10'
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
              }`}
            >
              {isPublished ? 'Published' : 'Draft'}
            </Badge>
          )}
        </StatCard>
      </div>

      {/* Public Experience Card */}
      {currentBusiness && (
        <Card className="bg-gold/15 bg-gradient-to-r from-champagne/30 to-ivory">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="size-5 text-charcoal" />
                <CardTitle className="text-lg text-charcoal">Public Experience</CardTitle>
              </div>
              <Badge className={isPublished ? 'bg-charcoal hover:bg-charcoal-light text-white' : 'bg-amber-100 text-amber-700'}>
                {isPublished ? 'Published' : 'Unpublished'}
              </Badge>
            </div>
            <CardDescription>Your public URL and QR code for customers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Public URL */}
            <div className="rounded-lg border bg-gold/15 bg-white/80 px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">Your Public URL</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-medium text-slate-900 truncate">
                  {getPublicBusinessUrl(currentBusiness.slug)}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gold/20 text-gold-dark hover:bg-gold/10 shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(getPublicBusinessUrl(currentBusiness.slug));
                    toast.success('Link copied!');
                  }}
                >
                  <Copy className="size-3.5" />
                </Button>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="bg-charcoal hover:bg-charcoal-light text-white"
                onClick={() => window.open(getPublicBusinessUrl(currentBusiness.slug), '_blank')}
              >
                <ExternalLink className="mr-1.5 size-3.5" />
                Open Public Page
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate('#/qr-code')}>
                <QrCode className="mr-1.5 size-3.5" />
                QR Code
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const url = getPublicBusinessUrl(currentBusiness.slug);
                  if (navigator.share) {
                    navigator.share({ title: currentBusiness.name, url });
                  } else {
                    navigator.clipboard.writeText(url);
                    toast.success('Link copied!');
                  }
                }}
              >
                <Share2 className="mr-1.5 size-3.5" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Views Chart + Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Views Overview</CardTitle>
                <CardDescription>Daily menu views for the last 14 days</CardDescription>
              </div>
              {!loading && analytics && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Eye className="size-4" />
                  <span className="font-semibold text-slate-900">{analytics.totalViews}</span> total
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full rounded-lg" />
            ) : chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-xs"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                    allowDecimals={false}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        indicator="line"
                        labelFormatter={(value) => `Date: ${value}`}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#fillViews)"
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[280px] flex-col items-center justify-center text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-slate-100">
                  <Eye className="size-8 text-slate-400" />
                </div>
                <p className="mt-4 font-medium text-slate-600">No views yet</p>
                <p className="mt-1 text-sm text-slate-400">
                  Share your menu link or QR code to start tracking views.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Common tasks to manage your menu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.href}
                  onClick={() => navigate(action.href)}
                  className="flex w-full items-center gap-3 rounded-lg border border-transparent p-3 text-left transition-all hover:border-slate-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Icon className="size-5 text-slate-600" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-slate-900">{action.label}</p>
                    <p className="truncate text-xs text-slate-500">{action.description}</p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-slate-400" />
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Latest events and updates for your menu</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-slate-100">
              <Clock className="size-8 text-slate-400" />
            </div>
            <p className="mt-4 font-medium text-slate-600">No recent activity</p>
            <p className="mt-1 max-w-sm text-sm text-slate-400">
              Activity will appear here when customers view your menu or scan your QR code.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
