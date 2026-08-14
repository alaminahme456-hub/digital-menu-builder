'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuthStore, useAppStore } from '@/lib/store';
import { Toaster } from 'sonner';

// Page components
import LandingPage from '@/components/landing/landing-page';
import LoginPage from '@/components/auth/login-page';
import RegisterPage from '@/components/auth/register-page';

// Dashboard components
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import Overview from '@/components/dashboard/overview';
import MenuManager from '@/components/dashboard/menu-manager';
import UploadMenu from '@/components/dashboard/upload-menu';
import AIScanner from '@/components/dashboard/ai-scanner';
import Templates from '@/components/dashboard/templates';
import BookCoverTemplates from '@/components/dashboard/book-cover-templates';
import QRCode from '@/components/dashboard/qr-code';
import Preview from '@/components/dashboard/preview';
import Analytics from '@/components/dashboard/analytics';
import Settings from '@/components/dashboard/settings';
import AdminPanel from '@/components/dashboard/admin-panel';
import CreateBusinessDialog from '@/components/dashboard/create-business-dialog';

// Public menu
import PublicMenuView from '@/components/public-menu/public-menu-view';

import { Loader2, BookOpen } from 'lucide-react';

export default function Home() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const currentRoute = useAppStore((s) => s.currentRoute);
  const currentBusiness = useAppStore((s) => s.currentBusiness);
  const businesses = useAppStore((s) => s.businesses);
  const setCurrentBusiness = useAppStore((s) => s.setCurrentBusiness);
  const setBusinesses = useAppStore((s) => s.setBusinesses);
  const navigate = useAppStore((s) => s.navigate);

  const [showCreateBusiness, setShowCreateBusiness] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const initRef = useRef(false);

  // Initialize hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || '/';
      navigate(hash);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [navigate]);

  // Fetch user data and businesses on mount if authenticated
  // Use initRef to prevent duplicate initialization from the login page calling setAuth
  useEffect(() => {
    if (!isAuthenticated || !token || initRef.current) {
      if (!isAuthenticated) setInitializing(false);
      return;
    }

    initRef.current = true;

    const init = async () => {
      try {
        // Fetch user profile
        const meRes = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (meRes.ok) {
          const { user: profile } = await meRes.json();
          useAuthStore.getState().setAuth(token, profile);
        }

        // Fetch businesses
        const bizRes = await fetch('/api/businesses', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (bizRes.ok) {
          const { businesses: bizList } = await bizRes.json();
          const bizData = bizList.map((b: { id: string; slug: string; name: string; logo: string | null; status: string }) => ({
            id: b.id,
            slug: b.slug,
            name: b.name,
            logo: b.logo,
            status: b.status,
          }));
          setBusinesses(bizData);

          // Auto-select first business using latest state
          const currentBiz = useAppStore.getState().currentBusiness;
          if (!currentBiz && bizData.length > 0) {
            setCurrentBusiness(bizData[0]);
          }
          // Show create business dialog if no businesses
          if (bizData.length === 0) {
            const hash = window.location.hash.slice(1);
            if (!hash.startsWith('/register') && !hash.startsWith('/login')) {
              setShowCreateBusiness(true);
            }
          }
        }
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, [isAuthenticated, token]); // Only depend on auth state changes

  // Route parser
  const parseRoute = useCallback((route: string) => {
    const parts = route.split('/').filter(Boolean);
    const page = parts[0] || 'landing';
    return { page, parts };
  }, []);

  const { page } = useMemo(() => parseRoute(currentRoute), [currentRoute, parseRoute]);

  // Determine which view to show
  const renderView = () => {
    // Public menu routes — support both /menu/{slug} (legacy) and /p/{slug} (new)
    if (currentRoute.startsWith('/menu/')) {
      const slug = currentRoute.replace('/menu/', '');
      return <PublicMenuView slug={slug} />;
    }
    if (currentRoute.startsWith('/p/')) {
      const slug = currentRoute.replace('/p/', '');
      return <PublicMenuView slug={slug} />;
    }

    // Auth routes
    if (!isAuthenticated) {
      switch (page) {
        case 'login':
          return <LoginPage />;
        case 'register':
          return <RegisterPage />;
        default:
          return <LandingPage />;
      }
    }

    // Still initializing — show loading
    if (initializing) {
      return null; // The loading state below handles this
    }

    // Authenticated routes - show dashboard
      if (businesses.length === 0) {
      return (
        <DashboardLayout activePage="">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-charcoal mb-2 font-editorial">Welcome to BizFlip</h2>
              <p className="text-charcoal/40">Create your first business to get started.</p>
            </div>
            <button
              onClick={() => setShowCreateBusiness(true)}
              className="px-6 py-3 bg-charcoal hover:bg-charcoal-light text-white rounded-xl font-medium transition-colors shadow-premium"
            >
              Create Your First Business
            </button>
          </div>
        </DashboardLayout>
      );
    }

    // Dashboard pages
    const dashboardContent = getDashboardContent(page);
    return (
      <DashboardLayout activePage={page}>
        {dashboardContent}
      </DashboardLayout>
    );
  };

  const getDashboardContent = (pageName: string) => {
    switch (pageName) {
      case 'dashboard':
        return <Overview />;
      case 'menu-manager':
        return <MenuManager />;
      case 'upload-menu':
        return <UploadMenu />;
      case 'ai-scanner':
        return <AIScanner />;
      case 'templates':
        return <Templates />;
      case 'design-studio':
        return <BookCoverTemplates />;
      case 'qr-code':
        return <QRCode />;
      case 'preview':
        return <Preview />;
      case 'analytics':
        return <Analytics />;
      case 'business-settings':
        return <Settings initialTab="business" />;
      case 'account-settings':
        return <Settings initialTab="account" />;
      case 'admin':
        if (user?.role === 'admin') return <AdminPanel />;
        return <Overview />;
      default:
        return <Overview />;
    }
  };

  // Show loading during initialization
  if (initializing && isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ivory">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-charcoal rounded-xl flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-gold" />
          </div>
          <Loader2 className="h-5 w-5 text-charcoal/30 animate-spin" />
          <p className="text-charcoal/30 text-sm">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-ivory">
        {renderView()}
      </div>
      <CreateBusinessDialog open={showCreateBusiness} onOpenChange={setShowCreateBusiness} />
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
