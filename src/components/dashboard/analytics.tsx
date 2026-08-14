'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Eye,
  QrCode,
  TrendingUp,
  Calendar,
  BarChart3,
  RefreshCw,
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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer,
} from 'recharts';
import { useAuthStore, useAppStore } from '@/lib/store';
import type { AnalyticsSummary } from '@/lib/types';
import { formatPrice } from '@/lib/auth';
import { toast } from 'sonner';

type DateRange = 'today' | 'week' | 'month' | 'all';

const chartConfig = {
  views: {
    label: 'Views',
    color: '#10b981',
  },
};

const categoryChartConfig = {
  views: {
    label: 'Views',
    color: '#059669',
  },
};

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export default function AnalyticsPanel() {
  const { token } = useAuthStore();
  const { currentBusiness } = useAppStore();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalytics = useCallback(async () => {
    if (!currentBusiness?.id || !token) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/analytics?businessId=${currentBusiness.id}&range=${dateRange}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      } else {
        toast.error('Failed to load analytics');
      }
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [currentBusiness?.id, token, dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const statCards = [
    {
      label: 'Total Views',
      value: analytics?.totalViews ?? 0,
      icon: Eye,
      color: 'text-charcoal',
      bg: 'bg-ivory dark:bg-emerald-950/50',
    },
    {
      label: 'QR Scans',
      value: analytics?.qrScans ?? 0,
      icon: QrCode,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/50',
    },
    {
      label: 'Views Today',
      value: analytics?.viewsToday ?? 0,
      icon: TrendingUp,
      color: 'text-sky-600',
      bg: 'bg-sky-50 dark:bg-sky-950/50',
    },
    {
      label: 'Views This Month',
      value: analytics?.viewsMonth ?? 0,
      icon: Calendar,
      color: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-950/50',
    },
  ];

  const dailyChartData = (analytics?.dailyViews || []).slice(-14).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views: d.views,
  }));

  const categoryData = (analytics?.mostViewedCategories || []).map((c) => ({
    name: c.name,
    views: c.views,
  }));

  if (!currentBusiness) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <BarChart3 className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Select a business to view analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter + Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'This Week' },
              { key: 'month', label: 'This Month' },
              { key: 'all', label: 'All Time' },
            ] as const
          ).map(({ key, label }) => (
            <Button
              key={key}
              variant={dateRange === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(key)}
              className={dateRange === key ? 'bg-charcoal hover:bg-charcoal-light' : ''}
            >
              {label}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAnalytics}
          disabled={loading}
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="gap-4">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground truncate">{stat.label}</p>
                {loading ? (
                  <Skeleton className="h-7 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold tabular-nums">{formatNumber(stat.value)}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs: Charts / Top Items */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Views Chart</TabsTrigger>
          <TabsTrigger value="categories">Top Categories</TabsTrigger>
          <TabsTrigger value="items">Top Items</TabsTrigger>
        </TabsList>

        {/* Views Chart */}
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Daily Views</CardTitle>
              <CardDescription>Last 14 days of page views</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : dailyChartData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No view data available yet
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <AreaChart data={dailyChartData}>
                    <defs>
                      <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={12}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={12}
                      allowDecimals={false}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          indicator="dot"
                          labelFormatter={(value) => value}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#emeraldGradient)"
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Categories */}
        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Most Viewed Categories</CardTitle>
              <CardDescription>Categories ranked by view count</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : categoryData.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  No category data available yet
                </div>
              ) : (
                <div className="space-y-3">
                  {categoryData.map((cat, index) => (
                    <div key={cat.name} className="flex items-center gap-3">
                      <span className="w-6 text-sm font-medium text-muted-foreground text-right">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{cat.name}</span>
                          <span className="text-sm text-muted-foreground tabular-nums">
                            {formatNumber(cat.views)} views
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-ivory0 transition-all duration-500"
                            style={{
                              width: `${categoryData[0]?.views ? (cat.views / categoryData[0].views) * 100 : 0}%`,
                              minWidth: cat.views > 0 ? '8px' : '0',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Menu Items */}
        <TabsContent value="items" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Most Viewed Items</CardTitle>
              <CardDescription>Menu items ranked by view count</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !analytics?.mostViewedItems?.length ? (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  No item data available yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Category</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.mostViewedItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="secondary">{(item as { category?: string }).category || '—'}</Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatPrice(item.price)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden hidden sm:block">
                                <div
                                  className="h-full rounded-full bg-ivory0"
                                  style={{
                                    width: `${analytics.mostViewedItems[0]?.views ? (item.views / analytics.mostViewedItems[0].views) * 100 : 0}%`,
                                    minWidth: item.views > 0 ? '4px' : '0',
                                  }}
                                />
                              </div>
                              <span className="tabular-nums font-medium w-10 text-right">
                                {formatNumber(item.views)}
                              </span>
                            </div>
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
      </Tabs>
    </div>
  );
}
