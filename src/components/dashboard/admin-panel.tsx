'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Building2,
  FileCheck,
  UtensilsCrossed,
  QrCode,
  RefreshCw,
  Trash2,
  Ban,
  CheckCircle2,
  MoreHorizontal,
  Shield,
  Loader2,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';

interface AdminStats {
  totalUsers: number;
  totalBusinesses: number;
  publishedMenus: number;
  totalMenuItems: number;
  totalScans: number;
}

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  _count?: { businesses: number };
}

interface AdminBusiness {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  status: string;
  createdAt: string;
  owner?: { name: string | null; email: string } | null;
  _count?: { menuItems: number };
}

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

export default function AdminPanel() {
  const { token, user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [loading, setLoading] = useState({
    stats: true,
    users: false,
    businesses: false,
  });

  const fetchStats = useCallback(async () => {
    if (!token) return;
    setLoading((p) => ({ ...p, stats: true }));
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch {
      toast.error('Failed to load stats');
    } finally {
      setLoading((p) => ({ ...p, stats: false }));
    }
  }, [token]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading((p) => ({ ...p, users: true }));
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading((p) => ({ ...p, users: false }));
    }
  }, [token]);

  const fetchBusinesses = useCallback(async () => {
    if (!token) return;
    setLoading((p) => ({ ...p, businesses: true }));
    try {
      const res = await fetch('/api/admin/businesses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data.businesses || []);
      }
    } catch {
      toast.error('Failed to load businesses');
    } finally {
      setLoading((p) => ({ ...p, businesses: false }));
    }
  }, [token]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchStats();
  }, [isAdmin, fetchStats]);

  useEffect(() => {
    if (!isAdmin || activeTab !== 'users') return;
    if (users.length === 0) fetchUsers();
  }, [isAdmin, activeTab, fetchUsers, users.length]);

  useEffect(() => {
    if (!isAdmin || activeTab !== 'businesses') return;
    if (businesses.length === 0) fetchBusinesses();
  }, [isAdmin, activeTab, fetchBusinesses, businesses.length]);

  // Actions
  const handleDeleteUser = async (userId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        toast.success('User deleted');
        fetchStats();
      } else {
        toast.error('Failed to delete user');
      }
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleBusinessStatus = async (bizId: string, newStatus: string) => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/businesses', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: bizId, status: newStatus }),
      });
      if (res.ok) {
        setBusinesses((prev) =>
          prev.map((b) => (b.id === bizId ? { ...b, status: newStatus } : b))
        );
        toast.success(`Business ${newStatus === 'published' ? 'activated' : 'suspended'}`);
        fetchStats();
      } else {
        toast.error('Failed to update business');
      }
    } catch {
      toast.error('Failed to update business');
    }
  };

  const handleDeleteBusiness = async (bizId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/businesses?id=${bizId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setBusinesses((prev) => prev.filter((b) => b.id !== bizId));
        toast.success('Business deleted');
        fetchStats();
      } else {
        toast.error('Failed to delete business');
      }
    } catch {
      toast.error('Failed to delete business');
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
        <Shield className="h-12 w-12" />
        <p>Admin access required</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/50',
    },
    {
      label: 'Total Businesses',
      value: stats?.totalBusinesses ?? 0,
      icon: Building2,
      color: 'text-charcoal',
      bg: 'bg-ivory dark:bg-emerald-950/50',
    },
    {
      label: 'Published Menus',
      value: stats?.publishedMenus ?? 0,
      icon: FileCheck,
      color: 'text-sky-600',
      bg: 'bg-sky-50 dark:bg-sky-950/50',
    },
    {
      label: 'Menu Items',
      value: stats?.totalMenuItems ?? 0,
      icon: UtensilsCrossed,
      color: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-950/50',
    },
    {
      label: 'QR Scans',
      value: stats?.totalScans ?? 0,
      icon: QrCode,
      color: 'text-rose-600',
      bg: 'bg-rose-50 dark:bg-rose-950/50',
    },
  ];

  const statusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-charcoal hover:bg-charcoal-light">Published</Badge>;
      case 'unpublished':
        return <Badge variant="secondary">Unpublished</Badge>;
      case 'suspended':
        return <Badge className="bg-red-600 hover:bg-red-700">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const roleBadge = (role: string) => {
    if (role === 'admin') {
      return <Badge className="bg-amber-600 hover:bg-amber-700">Admin</Badge>;
    }
    return <Badge variant="secondary">User</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Admin badge */}
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-amber-600" />
        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
          Admin Panel
        </span>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Platform Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {statCards.map((stat) => (
              <Card key={stat.label} className="gap-4">
                <CardContent className="flex items-center gap-3 p-4">
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${stat.bg}`}
                  >
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">
                      {stat.label}
                    </p>
                    {loading.stats ? (
                      <Skeleton className="h-6 w-12 mt-0.5" />
                    ) : (
                      <p className="text-xl font-bold tabular-nums">
                        {formatNumber(stat.value)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Refresh */}
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
              Refresh Stats
            </Button>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">All Users</CardTitle>
                <CardDescription>{users.length} total users</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUsers}
                disabled={loading.users}
              >
                <RefreshCw
                  className={`mr-1.5 h-3.5 w-3.5 ${loading.users ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loading.users ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  No users found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Role</TableHead>
                        <TableHead className="hidden md:table-cell text-right">
                          Businesses
                        </TableHead>
                        <TableHead className="hidden lg:table-cell">
                          Created
                        </TableHead>
                        <TableHead className="w-10"> </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium text-sm">
                            {u.email}
                          </TableCell>
                          <TableCell className="text-sm">
                            {u.name || '—'}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {roleBadge(u.role)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-right tabular-nums">
                            {u._count?.businesses ?? 0}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                            {formatDate(u.createdAt)}
                          </TableCell>
                          <TableCell>
                            {u.role !== 'admin' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete{' '}
                                      <strong>{u.email}</strong>? This will
                                      also delete all their businesses and
                                      associated data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteUser(u.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
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

        {/* Businesses Tab */}
        <TabsContent value="businesses" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">All Businesses</CardTitle>
                <CardDescription>
                  {businesses.length} total businesses
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchBusinesses}
                disabled={loading.businesses}
              >
                <RefreshCw
                  className={`mr-1.5 h-3.5 w-3.5 ${loading.businesses ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loading.businesses ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : businesses.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  No businesses found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Owner</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Category
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden lg:table-cell text-right">
                          Items
                        </TableHead>
                        <TableHead className="hidden xl:table-cell">
                          Created
                        </TableHead>
                        <TableHead className="w-10"> </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {businesses.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell>
                            <div className="font-medium text-sm">{b.name}</div>
                            <div className="text-xs text-muted-foreground">
                              /{b.slug}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">
                            {b.owner?.name || b.owner?.email || '—'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline">{b.category || '—'}</Badge>
                          </TableCell>
                          <TableCell>{statusBadge(b.status)}</TableCell>
                          <TableCell className="hidden lg:table-cell text-right tabular-nums">
                            {b._count?.menuItems ?? 0}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                            {formatDate(b.createdAt)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {b.status !== 'published' && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleToggleBusinessStatus(b.id, 'published')
                                    }
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-charcoal" />
                                    Publish / Activate
                                  </DropdownMenuItem>
                                )}
                                {b.status !== 'unpublished' && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleToggleBusinessStatus(b.id, 'unpublished')
                                    }
                                  >
                                    <Ban className="mr-2 h-4 w-4" />
                                    Unpublish
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleToggleBusinessStatus(b.id, 'suspended')
                                  }
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Suspend
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteBusiness(b.id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
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
      </Tabs>
    </div>
  );
}
