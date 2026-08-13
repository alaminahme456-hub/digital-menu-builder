export type UserRole = 'user' | 'admin';
export type BusinessStatus = 'draft' | 'published' | 'unpublished';
export type MenuPublishStatus = 'draft' | 'published' | 'unpublished';
export type Eventype = 'view' | 'qr_scan' | 'item_view';

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar: string | null;
  role: UserRole;
  emailVerified: Date | null;
  createdAt: string;
}

export interface FlipbookSettings {
  flipbookEnabled: boolean;
  flipbookAnimEnabled: boolean;
  flipbookAnimSpeed: 'slow' | 'medium' | 'fast';
  flipbookPageNumbers: boolean;
  flipbookSwipeNav: boolean;
  flipbookSoundEffects: boolean;
  flipbookFullscreen: boolean;
  flipbookInteractions: boolean;
}

export interface OrderingSettings {
  whatsappOrder: boolean;
  basketEnabled: boolean;
  showQuantitySelector: boolean;
  showOrderButton: boolean;
  whatsappGreeting: string;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  logo: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  openingHours: string | null;
  description: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  templateName: string;
  status: BusinessStatus;
  whatsappOrder: boolean;
  seoEnabled: boolean;
  // Flipbook
  flipbookEnabled: boolean;
  flipbookAnimEnabled: boolean;
  flipbookAnimSpeed: string;
  flipbookPageNumbers: boolean;
  flipbookSwipeNav: boolean;
  flipbookSoundEffects: boolean;
  flipbookFullscreen: boolean;
  flipbookInteractions: boolean;
  // Ordering
  basketEnabled: boolean;
  showQuantitySelector: boolean;
  showOrderButton: boolean;
  whatsappGreeting: string;
  ownerId: string;
  createdAt: string;
  _count?: {
    categories: number;
    menuItems: number;
    analytics: number;
  };
}

export const DEFAULT_FLIPBOOK_SETTINGS: FlipbookSettings = {
  flipbookEnabled: true,
  flipbookAnimEnabled: true,
  flipbookAnimSpeed: 'medium',
  flipbookPageNumbers: true,
  flipbookSwipeNav: true,
  flipbookSoundEffects: false,
  flipbookFullscreen: true,
  flipbookInteractions: true,
};

export const DEFAULT_ORDERING_SETTINGS: OrderingSettings = {
  whatsappOrder: true,
  basketEnabled: true,
  showQuantitySelector: true,
  showOrderButton: true,
  whatsappGreeting: 'Hello, I would like to place an order:',
};

export interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  businessId: string;
  items?: MenuItem[];
  _count?: { items: number };
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  sortOrder: number;
  available: boolean;
  categoryId: string;
  businessId: string;
}

export interface MenuUpload {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  published: boolean;
  businessId: string;
  createdAt: string;
}

export interface AnalyticsEntry {
  id: string;
  eventType: Eventype;
  menuItemId: string | null;
  businessId: string;
  referrer: string | null;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalViews: number;
  qrScans: number;
  viewsToday: number;
  viewsWeek: number;
  viewsMonth: number;
  mostViewedCategories: { name: string; views: number }[];
  mostViewedItems: { name: string; views: number; price: number }[];
  dailyViews: { date: string; views: number }[];
}

export interface TemplateConfig {
  name: string;
  label: string;
  description: string;
  thumbnail: string;
}

export interface WhatsAppOrderItem {
  name: string;
  price: number;
  quantity: number;
}

export const TEMPLATES: TemplateConfig[] = [
  { name: 'modern', label: 'Modern', description: 'Clean and contemporary design', thumbnail: '' },
  { name: 'classic', label: 'Classic Restaurant', description: 'Traditional elegant styling', thumbnail: '' },
  { name: 'luxury', label: 'Luxury', description: 'Premium gold and dark theme', thumbnail: '' },
  { name: 'minimal', label: 'Minimal', description: 'Whitespace-focused simplicity', thumbnail: '' },
  { name: 'fastfood', label: 'Fast Food', description: 'Bold and vibrant fast food style', thumbnail: '' },
  { name: 'cafe', label: 'Café', description: 'Warm and cozy café atmosphere', thumbnail: '' },
  { name: 'pizza', label: 'Pizza', description: 'Italian-inspired pizza menu', thumbnail: '' },
  { name: 'dark', label: 'Dark Premium', description: 'Sleek dark theme with accent colors', thumbnail: '' },
  { name: 'colorful', label: 'Colorful', description: 'Fun and vibrant multi-color design', thumbnail: '' },
  { name: 'elegant', label: 'Elegant', description: 'Sophisticated and refined look', thumbnail: '' },
];

export const CATEGORIES_PRESETS = [
  'Breakfast', 'Main Meals', 'Rice', 'Chicken', 'Burgers',
  'Pizza', 'Drinks', 'Desserts', 'Sides', 'Salads',
  'Seafood', 'Grills', 'Snacks', 'Soups', 'Specials',
];

export const BUSINESS_CATEGORIES = [
  'Restaurant', 'Café', 'Bar', 'Hotel', 'Food Truck',
  'Bakery', 'Pizzeria', 'Fast Food', 'Catering', 'Other',
];

export const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter' },
  { value: 'serif', label: 'Serif' },
  { value: 'mono', label: 'Monospace' },
  { value: 'playfair', label: 'Playfair Display' },
];
