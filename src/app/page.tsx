'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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
import QRCode from '@/components/dashboard/qr-code';
import Preview from '@/components/dashboard/preview';
import Analytics from '@/components/dashboard/analytics';
import Settings from '@/components/dashboard/settings';
import AdminPanel from '@/components/dashboard/admin-panel';
import CreateBusinessDialog from '@/components/dashboard/create-business-dialog';

// Public menu
import PublicMenuView from '@/components/public-menu/public-menu-view';

import { Loader2 } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, token, user } = useAuthStore();
  const {
    currentRoute,
    navigate,
    currentBusiness,
    businesses,
    setCurrentBusiness,
    setBusinesses,
  } = useAppStore();

  const [showCreateBusiness, setShowCreateBusiness] = useState(false);
  const [initializing, setInitializing] = useState(true);

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
  useEffect(() => {
    if (isAuthenticated && token) {
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

            // Auto-select first business if none selected
            if (!currentBusiness && bizData.length > 0) {
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
    } else {
      setInitializing(false);
    }
  }, [isAuthenticated, token]);

  // Route parser
  const parseRoute = useCallback((route: string) => {
    const parts = route.split('/').filter(Boolean);
    const page = parts[0] || 'landing';
    return { page, parts };
  }, []);

  const { page } = useMemo(() => parseRoute(currentRoute), [currentRoute, parseRoute]);

  // Determine which view to show
  const renderView = () => {
    // Public menu routes
    if (currentRoute.startsWith('/menu/')) {
      const slug = currentRoute.replace('/menu/', '');
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

    // Authenticated routes - show dashboard
    // If no businesses, show create business dialog
    if (businesses.length === 0) {
      return (
        <DashboardLayout activePage="">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to MenuQR!</h2>
              <p className="text-slate-500">Create your first business to get started.</p>
            </div>
            <button
              onClick={() => setShowCreateBusiness(true)}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
          <p className="text-slate-500 text-sm">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white">
        {renderView()}
      </div>
      <CreateBusinessDialog open={showCreateBusiness} onOpenChange={setShowCreateBusiness} />
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
