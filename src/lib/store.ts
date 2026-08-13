import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  } | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: { id: string; email: string; name: string | null; role: string }) => void;
  logout: () => void;
}

interface AppStore {
  // Navigation
  currentRoute: string;
  routeParams: Record<string, string>;
  navigate: (route: string, params?: Record<string, string>) => void;

  // Business
  currentBusiness: {
    id: string;
    slug: string;
    name: string;
    logo: string | null;
    status: string;
  } | null;
  businesses: Array<{ id: string; slug: string; name: string; logo: string | null; status: string }>;
  setCurrentBusiness: (business: AppStore['currentBusiness']) => void;
  setBusinesses: (businesses: AppStore['businesses']) => void;

  // UI
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  previewMode: 'mobile' | 'desktop' | 'fullscreen' | null;
  setPreviewMode: (mode: AppStore['previewMode']) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    { name: 'menu-builder-auth' }
  )
);

export const useAppStore = create<AppStore>()((set) => ({
  currentRoute: typeof window !== 'undefined' ? (window.location.hash.slice(1) || '/') : '/',
  routeParams: {},
  navigate: (route, params = {}) => {
    if (typeof window !== 'undefined') {
      window.location.hash = route;
    }
    set({ currentRoute: route, routeParams: params });
  },
  currentBusiness: null,
  businesses: [],
  setCurrentBusiness: (business) => set({ currentBusiness: business }),
  setBusinesses: (businesses) => set({ businesses }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  previewMode: null,
  setPreviewMode: (mode) => set({ previewMode: mode }),
}));
