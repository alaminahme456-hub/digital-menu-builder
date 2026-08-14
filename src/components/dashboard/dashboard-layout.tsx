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
  Loader2,
  BookOpen,
  Paintbrush,
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
import { useAuthStore, useAppStore } from '@/lib/store';
import { useIsMobile } from '@/hooks/use-mobile';

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { label: 'Overview', href: '#/dashboard', icon: LayoutDashboard },
  { label: 'Content', href: '#/menu-manager', icon: UtensilsCrossed },
  { label: 'Upload', href: '#/upload-menu', icon: Upload },
  { label: 'AI Scanner', href: '#/ai-scanner', icon: Camera },
  { label: 'Design Studio', href: '#/design-studio', icon: Paintbrush },
  { label: 'Templates', href: '#/templates', icon: Palette },
  { label: 'QR Code', href: '#/qr-code', icon: QrCode },
  { label: 'Preview', href: '#/preview', icon: Eye },
  { label: 'Analytics', href: '#/analytics', icon: BarChart3 },
  { label: 'Settings', href: '#/business-settings', icon: Settings },
  { label: 'Account', href: '#/account-settings', icon: UserCog },
  { label: 'Admin', href: '#/admin', icon: Shield, adminOnly: true },
];

function getPageName(route: string): string {
  const normalized = route.startsWith('/') ? route : '/' + route;
  const item = navItems.find((n) => {
    const target = n.href.replace('#', '');
    return normalized === target || normalized.startsWith(target + '/');
  });
  // Map legacy routes to their new names
  if (normalized === '/design-studio') return 'Design Studio';
  return item?.label || 'Dashboard';
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  activePage?: string;
}

export default function DashboardLayout({ children, activePage }: DashboardLayoutProps) {
  const { token, user, logout } = useAuthStore();
  const {
    currentRoute,
    navigate,
    currentBusiness,
    businesses,
    setCurrentBusiness,
    sidebarOpen,
    setSidebarOpen,
  } = useAppStore();
  const isMobile = useIsMobile();
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

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

  const displayName = activePage ? getPageName(activePage) : getPageName(currentRoute);
  const isPublished = currentBusiness?.status === 'published';

  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  // Sidebar nav content (shared)
  const sidebarNav = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="p-4 pb-3 flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.08]">
          <BookOpen className="h-3.5 w-3.5 text-gold" />
        </div>
        <span className="text-sm font-bold tracking-tight text-white/90">BIZFLIP</span>
      </div>

      {/* Business Switcher */}
      <div className="px-3 pb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-none">
              {currentBusiness?.logo ? (
                <img src={currentBusiness.logo} alt={currentBusiness.name} className="size-8 rounded-lg object-cover" />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-lg bg-gold/10 text-[11px] font-bold text-gold">
                  {currentBusiness?.name?.[0]?.toUpperCase() || 'B'}
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-[13px] font-medium text-white/80">
                  {currentBusiness?.name || 'Select Business'}
                </p>
                <p className="truncate text-[11px] text-white/30">
                  {currentBusiness ? 'Switch business' : 'No business selected'}
                </p>
              </div>
              <ChevronDown className="size-3.5 shrink-0 text-white/30" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" sideOffset={8} className="w-64">
            <DropdownMenuLabel>Your Businesses</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {businesses.map((biz) => (
              <DropdownMenuItem
                key={biz.id}
                onClick={() => handleSwitchBusiness(biz)}
                className={currentBusiness?.id === biz.id ? 'bg-gold/[0.06]' : ''}
              >
                <div className="flex items-center gap-3">
                  {biz.logo ? (
                    <img src={biz.logo} alt={biz.name} className="size-6 rounded object-cover" />
                  ) : (
                    <div className="flex size-6 items-center justify-center rounded bg-gold/10 text-[10px] font-bold text-gold">
                      {biz.name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{biz.name}</span>
                    <span className="text-[11px] text-muted-foreground">
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

      <Separator className="bg-white/[0.06]" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            if (item.adminOnly && user?.role !== 'admin') return null;
            const active = isActive(item.href);
            const Icon = item.icon;

            return isMobile ? (
              <button
                key={item.href}
                onClick={() => handleNavigate(item.href)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                  active
                    ? 'bg-gold/10 text-gold'
                    : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'
                }`}
              >
                <Icon className="size-4.5" />
                {item.label}
              </button>
            ) : (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleNavigate(item.href)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                      active
                        ? 'bg-gold/10 text-gold'
                        : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'
                    }`}
                  >
                    <Icon className="size-4.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {active && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="ml-auto size-1.5 rounded-full bg-gold"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-white/[0.06]" />

      {/* User section */}
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-none">
              <Avatar className="size-7 border border-white/10">
                <AvatarImage src={undefined} alt={user?.name || ''} />
                <AvatarFallback className="bg-white/[0.08] text-[10px] font-semibold text-white/60">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-[12px] font-medium text-white/60">
                  {user?.name || 'User'}
                </p>
                <p className="truncate text-[10px] text-white/25">{user?.email}</p>
              </div>
              <ChevronDown className="size-3.5 shrink-0 text-white/25" />
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
              className="cursor-pointer text-red-500 focus:text-red-500"
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
    <div className="flex h-screen overflow-hidden bg-ivory">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? 260 : 64 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative z-30 flex h-full shrink-0 flex-col overflow-hidden bg-charcoal"
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
                {/* Collapsed logo */}
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.08] mb-4">
                  <BookOpen className="h-3.5 w-3.5 text-gold" />
                </div>

                {/* Collapsed business indicator */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="mb-3 flex size-9 items-center justify-center rounded-lg bg-gold/10 text-[11px] font-bold text-gold">
                      {currentBusiness?.name?.[0]?.toUpperCase() || 'B'}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{currentBusiness?.name || 'Select Business'}</TooltipContent>
                </Tooltip>

                <Separator className="mb-3 w-8 bg-white/[0.06]" />

                {/* Collapsed nav icons */}
                <nav className="flex flex-1 flex-col items-center gap-0.5">
                  {navItems.map((item) => {
                    if (item.adminOnly && user?.role !== 'admin') return null;
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleNavigate(item.href)}
                            className={`flex size-9 items-center justify-center rounded-lg transition-all ${
                              active
                                ? 'bg-gold/10 text-gold'
                                : 'text-white/30 hover:bg-white/[0.04] hover:text-white/60'
                            }`}
                          >
                            <Icon className="size-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">{item.label}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                </nav>

                <Separator className="mb-3 w-8 bg-white/[0.06]" />

                {/* Collapsed user avatar */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex size-9 items-center justify-center rounded-full transition-colors hover:ring-2 hover:ring-gold/30 focus-visible:outline-none">
                      <Avatar className="size-7 border border-white/10">
                        <AvatarFallback className="bg-white/[0.08] text-[10px] font-semibold text-white/60">
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
                    <DropdownMenuItem onClick={handleSignOut} variant="destructive" className="cursor-pointer text-red-500 focus:text-red-500">
                      <LogOut className="size-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute -right-3 top-7 z-40 flex size-6 items-center justify-center rounded-full border border-white/10 bg-charcoal text-white/40 shadow-md transition-colors hover:bg-white/[0.08] hover:text-white/70"
          >
            <motion.div animate={{ rotate: sidebarOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="size-3" />
            </motion.div>
          </button>
        </motion.aside>
      )}

      {/* Mobile Sidebar Sheet */}
      {isMobile && (
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetContent side="left" className="w-[260px] p-0 bg-charcoal border-charcoal">
            <SheetHeader className="p-4 pb-0">
              <SheetTitle className="text-left text-white/80 text-sm font-bold">
                BIZFLIP
              </SheetTitle>
            </SheetHeader>
            {sidebarNav}
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-black/[0.06] bg-white px-4 md:px-6">
          {/* Mobile hamburger */}
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setMobileSheetOpen(true)} className="shrink-0">
              <Menu className="size-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}

          {/* Page name */}
          <h1 className="text-[15px] font-semibold text-charcoal tracking-tight">{displayName}</h1>

          <div className="ml-auto flex items-center gap-3">
            {/* Publish toggle */}
            {currentBusiness && (
              <>
                <Badge
                  variant="secondary"
                  className={`gap-1.5 text-[11px] font-medium ${
                    isPublished
                      ? 'bg-gold/10 text-gold-dark border-gold/20'
                      : 'bg-charcoal/5 text-charcoal/40 border-charcoal/10'
                  }`}
                >
                  {isPublished ? (
                    <><Globe className="size-3" />Published</>
                  ) : (
                    <><GlobeLock className="size-3" />Draft</>
                  )}
                </Badge>
                <Button
                  variant={isPublished ? 'outline' : 'default'}
                  size="sm"
                  onClick={handleTogglePublish}
                  disabled={togglingStatus}
                  className={
                    isPublished
                      ? 'border-black/[0.08] text-charcoal/50 hover:bg-charcoal/5 hover:text-charcoal/70 text-[12px] font-medium h-8'
                      : 'bg-charcoal hover:bg-charcoal-light text-white text-[12px] font-medium h-8'
                  }
                >
                  {togglingStatus ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : isPublished ? (
                    <><GlobeLock className="size-3.5" />Unpublish</>
                  ) : (
                    <><Globe className="size-3.5" />Publish</>
                  )}
                </Button>
              </>
            )}

            {/* User avatar (desktop) */}
            {!isMobile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-charcoal/[0.04] focus-visible:outline-none">
                    <Avatar className="size-7">
                      <AvatarImage src={undefined} alt={user?.name || ''} />
                      <AvatarFallback className="bg-charcoal/5 text-[10px] font-semibold text-charcoal/50">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.name || 'User'}</p>
                      <p className="text-[11px] text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavigate('#/account-settings')}>
                    <UserCog className="size-4" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} variant="destructive" className="cursor-pointer text-red-500 focus:text-red-500">
                    <LogOut className="size-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
