'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Upload,
  Camera,
  Palette,
  QrCode,
  Eye,
  BarChart3,
  Settings,
  UserCog,
  Shield,
  Menu,
  LogOut,
  ChevronDown,
  Plus,
  Globe,
  GlobeLock,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore, useAppStore } from '@/lib/store';
import { useIsMobile } from '@/hooks/use-mobile';
import { Business } from '@/lib/types';

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { label: 'Overview', href: '#/dashboard', icon: LayoutDashboard },
  { label: 'Menu Manager', href: '#/menu-manager', icon: UtensilsCrossed },
  { label: 'Upload Menu', href: '#/upload-menu', icon: Upload },
  { label: 'AI Scanner', href: '#/ai-scanner', icon: Camera },
  { label: 'Design Templates', href: '#/templates', icon: Palette },
  { label: 'QR Code', href: '#/qr-code', icon: QrCode },
  { label: 'Customer Preview', href: '#/preview', icon: Eye },
  { label: 'Analytics', href: '#/analytics', icon: BarChart3 },
  { label: 'Business Settings', href: '#/business-settings', icon: Settings },
  { label: 'Account Settings', href: '#/account-settings', icon: UserCog },
  { label: 'Admin Panel', href: '#/admin', icon: Shield, adminOnly: true },
];

function getPageName(route: string): string {
  const item = navItems.find((n) => route.startsWith(n.href.replace('#', '')));
  return item?.label || 'Dashboard';
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  activePage?: string;
}

export default function DashboardLayout({ children, activePage }: DashboardLayoutProps) {
  const { token, user, logout, setAuth } = useAuthStore();
  const {
    currentRoute,
    navigate,
    currentBusiness,
    businesses,
    setCurrentBusiness,
    setBusinesses,
    sidebarOpen,
    setSidebarOpen,
  } = useAppStore();
  const isMobile = useIsMobile();
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [businessesLoaded, setBusinessesLoaded] = useState(false);

  // Fetch businesses on mount
  useEffect(() => {
    if (!token) return;
    async function fetchBusinesses() {
      try {
        const res = await fetch('/api/businesses', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setBusinesses(data.businesses);
          // Auto-select first business if none selected
          if (data.businesses.length > 0 && !currentBusiness) {
            setCurrentBusiness(data.businesses[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch businesses:', err);
      } finally {
        setBusinessesLoaded(true);
      }
    }
    fetchBusinesses();
  }, [token, setBusinesses, setCurrentBusiness, currentBusiness]);

  // Fetch user profile on mount
  useEffect(() => {
    if (!token || user) return;
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAuth(token, data.user);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    }
    fetchUser();
  }, [token, user, setAuth]);

  // Sync hash changes to store
  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash.slice(1) || '/';
      useAppStore.setState({ currentRoute: hash });
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = useCallback(
    (href: string) => {
      navigate(href);
      setMobileSheetOpen(false);
    },
    [navigate]
  );

  const handleSwitchBusiness = useCallback(
    (business: (typeof businesses)[0]) => {
      setCurrentBusiness(business);
    },
    [setCurrentBusiness]
  );

  const handleTogglePublish = useCallback(async () => {
    if (!currentBusiness || !token) return;
    setTogglingStatus(true);
    try {
      const newStatus = currentBusiness.status === 'published' ? 'draft' : 'published';
      const res = await fetch(`/api/businesses/${currentBusiness.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentBusiness(data.business);
      }
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
    } finally {
      setTogglingStatus(false);
    }
  }, [currentBusiness, token, setCurrentBusiness]);

  const handleSignOut = useCallback(() => {
    logout();
    window.location.hash = '';
  }, [logout]);

  const isActive = (href: string) => {
    const route = currentRoute.replace('#', '');
    const target = href.replace('#', '');
    if (target === '/dashboard') return route === '/dashboard' || route === '/';
    return route === target;
  };

  const displayName = activePage || getPageName(currentRoute);
  const isPublished = currentBusiness?.status === 'published';

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  // Sidebar nav content (shared between desktop and mobile)
  const sidebarNav = (
    <div className="flex h-full flex-col">
      {/* Business Switcher */}
      <div className="p-4 pb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
              {currentBusiness?.logo ? (
                <img
                  src={currentBusiness.logo}
                  alt={currentBusiness.name}
                  className="size-9 rounded-lg object-cover"
                />
              ) : (
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
                  {currentBusiness?.name?.[0]?.toUpperCase() || 'B'}
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-semibold text-white">
                  {currentBusiness?.name || 'Select Business'}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {currentBusiness ? 'Switch business' : 'No business selected'}
                </p>
              </div>
              <ChevronDown className="size-4 shrink-0 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            sideOffset={8}
            className="w-64"
          >
            <DropdownMenuLabel>Your Businesses</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {businesses.map((biz) => (
              <DropdownMenuItem
                key={biz.id}
                onClick={() => handleSwitchBusiness(biz)}
                className={
                  currentBusiness?.id === biz.id
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : ''
                }
              >
                <div className="flex items-center gap-3">
                  {biz.logo ? (
                    <img
                      src={biz.logo}
                      alt={biz.name}
                      className="size-6 rounded object-cover"
                    />
                  ) : (
                    <div className="flex size-6 items-center justify-center rounded bg-emerald-100 text-xs font-bold text-emerald-700">
                      {biz.name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{biz.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {biz.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleNavigate('#/business-settings')}>
              <Plus className="size-4" />
              Create New Business
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator className="bg-slate-700/50" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            if (item.adminOnly && user?.role !== 'admin') return null;
            const active = isActive(item.href);
            const Icon = item.icon;

            return isMobile ? (
              <button
                key={item.href}
                onClick={() => handleNavigate(item.href)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="size-5" />
                {item.label}
              </button>
            ) : (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleNavigate(item.href)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="size-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {active && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="ml-auto size-1.5 rounded-full bg-white"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-slate-700/50" />

      {/* User section at bottom */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
              <Avatar className="size-8 border-2 border-slate-700">
                <AvatarImage src={undefined} alt={user?.name || ''} />
                <AvatarFallback className="bg-emerald-700 text-xs font-semibold text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-white">
                  {user?.name || 'User'}
                </p>
                <p className="truncate text-xs text-slate-400">{user?.email}</p>
              </div>
              <ChevronDown className="size-4 shrink-0 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleNavigate('#/account-settings')}>
              <UserCog className="size-4" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              variant="destructive"
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="size-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? 280 : 72 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative z-30 flex h-full shrink-0 flex-col overflow-hidden border-r border-slate-800 bg-slate-900"
        >
          <AnimatePresence mode="wait">
            {sidebarOpen ? (
              <motion.div
                key="full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex h-full flex-col"
              >
                {sidebarNav}
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex h-full flex-col items-center py-4"
              >
                {/* Collapsed business indicator */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="mb-3 flex size-10 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
                      {currentBusiness?.name?.[0]?.toUpperCase() || 'B'}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {currentBusiness?.name || 'Select Business'}
                  </TooltipContent>
                </Tooltip>

                <Separator className="mb-3 w-8 bg-slate-700/50" />

                {/* Collapsed nav icons */}
                <nav className="flex flex-1 flex-col items-center gap-1">
                  {navItems.map((item) => {
                    if (item.adminOnly && user?.role !== 'admin') return null;
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleNavigate(item.href)}
                            className={`flex size-10 items-center justify-center rounded-lg transition-all ${
                              active
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <Icon className="size-5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </nav>

                <Separator className="mb-3 w-8 bg-slate-700/50" />

                {/* Collapsed user avatar */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex size-10 items-center justify-center rounded-full transition-colors hover:ring-2 hover:ring-emerald-500 focus-visible:outline-none">
                      <Avatar className="size-9 border-2 border-slate-700">
                        <AvatarFallback className="bg-emerald-700 text-xs font-semibold text-white">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleNavigate('#/account-settings')}>
                      <UserCog className="size-4" />
                      Account Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      variant="destructive"
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="size-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sidebar toggle button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute -right-3 top-7 z-40 flex size-6 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-400 shadow-md transition-colors hover:bg-slate-700 hover:text-white"
          >
            <motion.div
              animate={{ rotate: sidebarOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="size-3" />
            </motion.div>
          </button>
        </motion.aside>
      )}

      {/* Mobile Sidebar Sheet */}
      {isMobile && (
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetContent side="left" className="w-[280px] p-0 bg-slate-900 border-slate-800">
            <SheetHeader className="p-4 pb-0">
              <SheetTitle className="text-left text-white">
                <span className="text-emerald-400">Menu</span>Builder
              </SheetTitle>
            </SheetHeader>
            {sidebarNav}
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 md:px-6">
          {/* Mobile hamburger */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileSheetOpen(true)}
              className="shrink-0"
            >
              <Menu className="size-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}

          {/* Breadcrumb / Page name */}
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-900">{displayName}</h1>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Business status + Publish toggle */}
            {currentBusiness && (
              <>
                <Badge
                  variant={isPublished ? 'default' : 'secondary'}
                  className={`gap-1.5 ${
                    isPublished
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  {isPublished ? (
                    <>
                      <Globe className="size-3" />
                      Published
                    </>
                  ) : (
                    <>
                      <GlobeLock className="size-3" />
                      Draft
                    </>
                  )}
                </Badge>
                <Button
                  variant={isPublished ? 'outline' : 'default'}
                  size="sm"
                  onClick={handleTogglePublish}
                  disabled={togglingStatus}
                  className={
                    isPublished
                      ? 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }
                >
                  {togglingStatus ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : isPublished ? (
                    <>
                      <GlobeLock className="size-4" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Globe className="size-4" />
                      Publish
                    </>
                  )}
                </Button>
              </>
            )}

            {/* User avatar dropdown (desktop) */}
            {!isMobile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                    <Avatar className="size-8">
                      <AvatarImage src={undefined} alt={user?.name || ''} />
                      <AvatarFallback className="bg-emerald-100 text-xs font-semibold text-emerald-700">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavigate('#/account-settings')}>
                    <UserCog className="size-4" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    variant="destructive"
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="size-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
