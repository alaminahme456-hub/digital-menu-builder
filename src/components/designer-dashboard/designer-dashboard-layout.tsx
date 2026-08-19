'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  PenTool,
  PlusCircle,
  LayoutGrid,
  Wallet,
  Banknote,
  UserCircle,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  BookOpen,
  Store,
  Star,
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
};

const designerNavItems: NavItem[] = [
  { label: 'Dashboard', href: '#/designer/dashboard', icon: LayoutDashboard },
  { label: 'My Designs', href: '#/designer/my-designs', icon: PenTool },
  { label: 'Create Design', href: '#/designer/create', icon: PlusCircle },
  { label: 'My Templates', href: '#/designer/my-templates', icon: LayoutGrid },
  { label: 'Earnings', href: '#/designer/earnings', icon: Wallet },
  { label: 'Withdrawals', href: '#/designer/withdrawals', icon: Banknote },
  { label: 'Profile', href: '#/designer/profile', icon: UserCircle },
  { label: 'Settings', href: '#/designer/settings', icon: Settings },
  { label: 'Marketplace', href: '#/designer/marketplace', icon: Store },
];

function getPageName(route: string): string {
  const normalized = route.startsWith('/') ? route : '/' + route;
  const item = designerNavItems.find((n) => {
    const target = n.href.replace('#', '');
    return normalized === target || normalized.startsWith(target + '/');
  });
  return item?.label || 'Designer Dashboard';
}

interface DesignerDashboardLayoutProps {
  children: React.ReactNode;
}

export default function DesignerDashboardLayout({ children }: DesignerDashboardLayoutProps) {
  const { token, user, logout } = useAuthStore();
  const { currentRoute, navigate, sidebarOpen, setSidebarOpen } = useAppStore();
  const isMobile = useIsMobile();
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [designerName, setDesignerName] = useState('');

  // Fetch designer profile for display name
  useEffect(() => {
    if (!token) return;
    fetch('/api/marketplace/designers/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.designer?.displayName) setDesignerName(d.designer.displayName);
      })
      .catch(() => {});
  }, [token]);

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

  const handleSignOut = useCallback(() => {
    logout();
    window.location.hash = '';
  }, [logout]);

  const isActive = (href: string) => {
    const route = currentRoute.replace('#', '');
    const target = href.replace('#', '');
    if (target === '/designer/dashboard') return route === '/designer/dashboard' || route === '/designer';
    return route === target;
  };

  const displayName = getPageName(currentRoute);
  const displayUser = designerName || user?.name || 'Designer';
  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'D';

  const sidebarNav = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="p-4 pb-3 flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.08]">
          <BookOpen className="h-3.5 w-3.5 text-gold" />
        </div>
        <span className="text-sm font-bold tracking-tight text-white/90">ALTECH</span>
      </div>

      {/* Designer identity */}
      <div className="px-3 pb-3">
        <div className="flex items-center gap-3 rounded-lg p-2 bg-white/[0.04]">
          <Avatar className="size-8 border border-gold/20">
            <AvatarFallback className="bg-gold/10 text-[11px] font-bold text-gold">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-[13px] font-medium text-white/80">{displayUser}</p>
            <div className="flex items-center gap-1">
              <Star className="size-2.5 text-gold fill-gold" />
              <p className="truncate text-[11px] text-white/40">Designer</p>
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-white/[0.06]" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="flex flex-col gap-0.5">
          {designerNavItems.map((item) => {
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
                        layoutId="designerActiveNav"
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
                <AvatarFallback className="bg-white/[0.08] text-[10px] font-semibold text-white/60">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-[12px] font-medium text-white/60">{user?.name || 'User'}</p>
                <p className="truncate text-[10px] text-white/25">{user?.email}</p>
              </div>
              <ChevronDown className="size-3.5 shrink-0 text-white/25" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleNavigate('#/designer/profile')}>
              <UserCircle className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigate('#/designer/settings')}>
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} variant="destructive" className="cursor-pointer text-red-500 focus:text-red-500">
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
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.08] mb-4">
                  <BookOpen className="h-3.5 w-3.5 text-gold" />
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-gold/10">
                      <Star className="size-4 text-gold" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">Designer</TooltipContent>
                </Tooltip>
                <Separator className="mb-3 w-8 bg-white/[0.06]" />
                <nav className="flex flex-1 flex-col items-center gap-0.5">
                  {designerNavItems.map((item) => {
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex size-9 items-center justify-center rounded-full transition-colors hover:ring-2 hover:ring-gold/30 focus-visible:outline-none">
                      <Avatar className="size-7 border border-white/10">
                        <AvatarFallback className="bg-white/[0.08] text-[10px] font-semibold text-white/60">{userInitials}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleNavigate('#/designer/profile')}>
                      <UserCircle className="size-4" /> Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} variant="destructive" className="cursor-pointer text-red-500 focus:text-red-500">
                      <LogOut className="size-4" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            )}
          </AnimatePresence>

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
              <SheetTitle className="text-left text-white/80 text-sm font-bold">ALTECH</SheetTitle>
            </SheetHeader>
            {sidebarNav}
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-black/[0.06] bg-white px-4 md:px-6">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setMobileSheetOpen(true)} className="shrink-0">
              <Menu className="size-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}
          <h1 className="text-[15px] font-semibold text-charcoal tracking-tight">{displayName}</h1>
          <div className="ml-auto flex items-center gap-3">
            <Badge className="gap-1.5 text-[11px] font-medium bg-gold/10 text-gold-dark border-gold/20">
              <Star className="size-3 fill-gold text-gold" /> Designer
            </Badge>
            {!isMobile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-charcoal/[0.04]">
                    <Avatar className="size-7">
                      <AvatarFallback className="bg-charcoal/5 text-[10px] font-semibold text-charcoal/50">{userInitials}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.name || 'Designer'}</p>
                      <p className="text-[11px] text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavigate('#/designer/profile')}>
                    <UserCircle className="size-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} variant="destructive" className="cursor-pointer text-red-500 focus:text-red-500">
                    <LogOut className="size-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
