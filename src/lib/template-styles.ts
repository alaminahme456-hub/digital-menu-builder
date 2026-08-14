/**
 * Shared menu template style helpers.
 * Used by: FlipbookMenu, UploadFlipbook, PreviewPanel, PublicMenuClient, PublicMenuView
 */

export type TemplateName =
  | 'modern' | 'classic' | 'luxury' | 'minimal' | 'fastfood'
  | 'cafe' | 'pizza' | 'dark' | 'colorful' | 'elegant';

// ── Per-template visual config for flipbook pages ──────────────────
export interface TemplateStyle {
  /** Cover gradient (CSS background shorthand or gradient) */
  coverGradient: (primary: string, secondary: string) => string;
  /** Is this a dark template? */
  dark: boolean;
  /** Page background color */
  pageBg: string;
  /** Primary text color */
  textColor: string;
  /** Secondary/muted text color */
  subtextColor: string;
  /** Category header accent color — use primary or override */
  accentOverride?: string;
  /** Card/item background */
  cardBg: string;
  /** Card border color */
  cardBorder: string;
  /** Font family override (empty = use business default) */
  fontOverride?: string;
  /** Cover text color */
  coverTextColor: string;
  /** Cover subtext color */
  coverSubtextColor: string;
  /** Welcome page accent */
  welcomeAccent: string;
  /** Contact/info label color */
  infoTextColor: string;
}

const STYLES: Record<TemplateName, TemplateStyle> = {
  modern: {
    coverGradient: (p, s) => `linear-gradient(135deg, ${p} 0%, ${s} 100%)`,
    dark: false,
    pageBg: '#ffffff',
    textColor: '#111827',
    subtextColor: '#6b7280',
    cardBg: '#ffffff',
    cardBorder: '#e5e7eb',
    coverTextColor: '#ffffff',
    coverSubtextColor: 'rgba(255,255,255,0.7)',
    welcomeAccent: p => p,
    infoTextColor: '#4b5563',
  },
  classic: {
    coverGradient: () => `linear-gradient(135deg, #92400e 0%, #b45309 50%, #d97706 100%)`,
    dark: false,
    pageBg: '#fffbeb',
    textColor: '#44403c',
    subtextColor: '#78716c',
    cardBg: '#fffef5',
    cardBorder: '#e7e5d4',
    fontOverride: 'Georgia, "Times New Roman", serif',
    coverTextColor: '#ffffff',
    coverSubtextColor: 'rgba(255,255,255,0.8)',
    welcomeAccent: '#b45309',
    infoTextColor: '#57534e',
  },
  luxury: {
    coverGradient: () => `linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 40%, #16213e 100%)`,
    dark: true,
    pageBg: '#0a0a0a',
    textColor: '#e5e7eb',
    subtextColor: '#9ca3af',
    cardBg: 'rgba(255,255,255,0.05)',
    cardBorder: 'rgba(255,255,255,0.08)',
    coverTextColor: '#d4af37',
    coverSubtextColor: 'rgba(212,175,55,0.7)',
    welcomeAccent: '#d4af37',
    infoTextColor: '#9ca3af',
  },
  minimal: {
    coverGradient: (p, s) => `linear-gradient(135deg, ${p} 0%, ${s} 100%)`,
    dark: false,
    pageBg: '#ffffff',
    textColor: '#111827',
    subtextColor: '#9ca3af',
    cardBg: '#fafafa',
    cardBorder: '#f3f4f6',
    coverTextColor: '#ffffff',
    coverSubtextColor: 'rgba(255,255,255,0.7)',
    welcomeAccent: p => p,
    infoTextColor: '#6b7280',
  },
  fastfood: {
    coverGradient: () => `linear-gradient(135deg, #facc15 0%, #f97316 50%, #ef4444 100%)`,
    dark: false,
    pageBg: '#fffbeb',
    textColor: '#1c1917',
    subtextColor: '#78716c',
    cardBg: '#ffffff',
    cardBorder: '#fed7aa',
    coverTextColor: '#ffffff',
    coverSubtextColor: 'rgba(255,255,255,0.85)',
    welcomeAccent: '#f97316',
    infoTextColor: '#57534e',
  },
  cafe: {
    coverGradient: () => `linear-gradient(135deg, #78350f 0%, #92400e 50%, #a16207 100%)`,
    dark: false,
    pageBg: '#faf5ef',
    textColor: '#44403c',
    subtextColor: '#78716c',
    cardBg: '#fffbf5',
    cardBorder: '#e7e0d4',
    fontOverride: 'Georgia, "Times New Roman", serif',
    coverTextColor: '#ffffff',
    coverSubtextColor: 'rgba(255,255,255,0.8)',
    welcomeAccent: '#92400e',
    infoTextColor: '#57534e',
  },
  pizza: {
    coverGradient: () => `linear-gradient(135deg, #15803d 0%, #16a34a 50%, #dc2626 100%)`,
    dark: false,
    pageBg: '#fef2f2',
    textColor: '#1c1917',
    subtextColor: '#78716c',
    cardBg: '#ffffff',
    cardBorder: '#fecaca',
    coverTextColor: '#ffffff',
    coverSubtextColor: 'rgba(255,255,255,0.85)',
    welcomeAccent: '#16a34a',
    infoTextColor: '#57534e',
  },
  dark: {
    coverGradient: () => `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`,
    dark: true,
    pageBg: '#1a1a2e',
    textColor: '#e5e7eb',
    subtextColor: '#9ca3af',
    cardBg: 'rgba(255,255,255,0.06)',
    cardBorder: 'rgba(255,255,255,0.1)',
    coverTextColor: '#ffffff',
    coverSubtextColor: 'rgba(255,255,255,0.6)',
    welcomeAccent: p => p,
    infoTextColor: '#9ca3af',
  },
  colorful: {
    coverGradient: () => `linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%)`,
    dark: false,
    pageBg: '#ffffff',
    textColor: '#111827',
    subtextColor: '#6b7280',
    cardBg: '#ffffff',
    cardBorder: '#e5e7eb',
    coverTextColor: '#ffffff',
    coverSubtextColor: 'rgba(255,255,255,0.85)',
    welcomeAccent: p => p,
    infoTextColor: '#4b5563',
  },
  elegant: {
    coverGradient: (p, s) => `linear-gradient(135deg, ${p} 0%, ${s} 100%)`,
    dark: false,
    pageBg: '#fafaf9',
    textColor: '#292524',
    subtextColor: '#78716c',
    cardBg: '#ffffff',
    cardBorder: '#e7e5e4',
    fontOverride: '"Playfair Display", Georgia, serif',
    coverTextColor: '#ffffff',
    coverSubtextColor: 'rgba(255,255,255,0.7)',
    welcomeAccent: p => p,
    infoTextColor: '#57534e',
  },
};

/** Get the full template style object for a template name */
export function getFlipbookStyle(templateName: string, primaryColor: string, secondaryColor: string): TemplateStyle {
  const t = (templateName || 'modern') as TemplateName;
  const style = STYLES[t] || STYLES.modern;
  // Resolve dynamic accent overrides
  return {
    ...style,
    welcomeAccent: typeof style.welcomeAccent === 'function'
      ? (style.welcomeAccent as (p: string) => string)(primaryColor)
      : style.welcomeAccent,
  };
}

// ── List-mode template helpers (used by PublicMenuClient, PublicMenuView) ──

export function getTemplateClasses(template: string, primaryColor: string): string {
  const t = template as TemplateName;
  const base = 'min-h-screen';
  const overrides: Record<TemplateName, string> = {
    modern: 'bg-white text-gray-900',
    classic: 'bg-amber-50/50 text-gray-900 font-serif',
    luxury: 'bg-gray-950 text-gray-100',
    minimal: 'bg-white text-gray-900',
    fastfood: 'bg-yellow-50 text-gray-900',
    cafe: 'bg-orange-50/40 text-gray-900',
    pizza: 'bg-red-50/30 text-gray-900',
    dark: 'bg-[#1a1a2e] text-gray-100',
    colorful: 'bg-white text-gray-900',
    elegant: 'bg-stone-50 text-gray-800',
  };
  return `${base} ${overrides[t] ?? overrides.modern}`;
}

export function getHeaderBg(template: string, primaryColor: string): string {
  const t = template as TemplateName;
  const map: Record<TemplateName, string> = {
    modern:   `bg-gradient-to-br from-white via-white to-gray-50`,
    classic:  `bg-gradient-to-br from-amber-100 via-amber-50 to-orange-50`,
    luxury:   `bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900`,
    minimal:  `bg-white border-b border-gray-200`,
    fastfood: `bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400`,
    cafe:     `bg-gradient-to-br from-amber-800 via-amber-700 to-yellow-800`,
    pizza:    `bg-gradient-to-br from-green-700 via-green-600 to-red-700`,
    dark:     `bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]`,
    colorful: `bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400`,
    elegant:  `bg-gradient-to-br from-stone-100 via-stone-50 to-stone-100`,
  };
  return map[t] ?? map.modern;
}

export function getHeaderTextColor(template: string): string {
  const dark = ['luxury', 'dark', 'fastfood', 'cafe', 'pizza', 'colorful'];
  return dark.includes(template) ? 'text-white' : 'text-gray-900';
}

export function getCategoryBtnStyle(template: string, primaryColor: string, isActive: boolean): React.CSSProperties {
  const t = template as TemplateName;
  if (isActive) {
    if (t === 'luxury' || t === 'dark') return { backgroundColor: primaryColor, color: '#fff' };
    if (t === 'colorful') return { background: `linear-gradient(135deg, ${primaryColor}, #ec4899)`, color: '#fff' };
    return { backgroundColor: primaryColor, color: '#fff' };
  }
  if (t === 'luxury' || t === 'dark') return { backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' };
  return { backgroundColor: '#f3f4f6', color: '#374151' };
}
