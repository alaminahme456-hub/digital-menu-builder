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

export interface CoverCustomization {
  coverImage: string | null;
  coverTagline: string;
  coverAccent: string;
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
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    templateName?: string;
    coverTemplateId?: string | null;
  } | null;
  businesses: Array<{ id: string; slug: string; name: string; logo: string | null; status: string }>;
  setCurrentBusiness: (business: AppStore['currentBusiness']) => void;
  setBusinesses: (businesses: AppStore['businesses']) => void;

  // Menu Template state — drives instant reactivity across Templates, Preview, etc.
  activeTemplate: string | null;
  templateAppliedAt: string | null;
  setActiveTemplate: (templateName: string | null) => void;

  // Cover Template state — drives instant reactivity for book covers
  activeCoverTemplate: string | null;
  coverTemplateAppliedAt: string | null;
  setActiveCoverTemplate: (coverTemplateId: string | null) => void;

  // Cover customization
  coverCustomization: CoverCustomization;
  setCoverCustomization: (customization: Partial<CoverCustomization>) => void;

  // Cover favorites (persisted locally)
  coverFavorites: string[];
  toggleCoverFavorite: (templateId: string) => void;

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

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
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

      // Menu template state
      activeTemplate: null,
      templateAppliedAt: null,
      setActiveTemplate: (templateName) => set({
        activeTemplate: templateName,
        templateAppliedAt: templateName ? new Date().toISOString() : null,
      }),

      // Cover template state
      activeCoverTemplate: null,
      coverTemplateAppliedAt: null,
      setActiveCoverTemplate: (coverTemplateId) => set({
        activeCoverTemplate: coverTemplateId,
        coverTemplateAppliedAt: coverTemplateId ? new Date().toISOString() : null,
      }),

      // Cover customization
      coverCustomization: {
        coverImage: null,
        coverTagline: '',
        coverAccent: '#C9A84C',
      },
      setCoverCustomization: (customization) => set((state) => ({
        coverCustomization: { ...state.coverCustomization, ...customization },
      })),

      // Cover favorites
      coverFavorites: [],
      toggleCoverFavorite: (templateId) => set((state) => {
        const exists = state.coverFavorites.includes(templateId);
        return {
          coverFavorites: exists
            ? state.coverFavorites.filter((id) => id !== templateId)
            : [...state.coverFavorites, templateId],
        };
      }),

      // UI
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      previewMode: null,
      setPreviewMode: (mode) => set({ previewMode: mode }),
    }),
    {
      name: 'menu-builder-app',
      partialize: (state) => ({
        coverFavorites: state.coverFavorites,
        coverCustomization: state.coverCustomization,
      }),
    }
  )
);
