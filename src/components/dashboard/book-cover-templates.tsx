'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Heart,
  Eye,
  Check,
  Sparkles,
  ChevronDown,
  X,
  Upload,
  ImageIcon,
  Type,
  Palette,
  BookOpen,
  SlidersHorizontal,
  Star,
  Loader2,
  AlertCircle,
  Monitor,
  Smartphone,
  Maximize,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { useAuthStore } from '@/lib/store';
import {
  COVER_TEMPLATES,
  COVER_CATEGORIES,
  CoverTemplateStyle,
  CoverCategory,
  getRecommendedCovers,
  searchCovers,
} from '@/lib/cover-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

// ═══════════════════════════════════════════════════════
// COVER PREVIEW COMPONENT — Renders a CSS-only book cover
// ═══════════════════════════════════════════════════════

function CoverPreview({
  template,
  businessName,
  logo,
  coverImage,
  tagline,
  size = 'card',
  accentOverride,
  onTapOpen,
}: {
  template: CoverTemplateStyle;
  businessName: string;
  logo: string | null;
  coverImage: string | null;
  tagline?: string;
  size?: 'card' | 'preview' | 'full';
  accentOverride?: string;
  onTapOpen?: () => void;
}) {
  const s = template.style;
  const accent = accentOverride || s.accentColor;
  const isCard = size === 'card';
  const isPreview = size === 'preview';

  const fontMap: Record<string, string> = {
    serif: "'Playfair Display', Georgia, serif",
    sans: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
  };

  const titleFont = fontMap[s.titleFont] || fontMap.sans;
  const subFont = fontMap[s.subtitleFont] || fontMap.sans;

  // Determine if this is a light or dark cover
  const isDark = ['0C0A09', '0F172A', '1A0A0A', '09090B', '0A0A0F', '18181B', '0A0A0A',
    '1C1917', '2C1810', '1E3A5F', '0F0F23', '1A0A00', '1A1A3E', '2D1B69'].includes(s.bg);

  const widthClass = isCard ? 'w-full' : isPreview ? 'w-[320px] sm:w-[360px]' : 'w-full max-w-[420px]';
  const heightClass = isCard ? 'aspect-[3/4]' : isPreview ? 'aspect-[3/4]' : 'aspect-[3/4] sm:aspect-[9/16]';

  return (
    <div
      className={`${widthClass} ${heightClass} relative overflow-hidden flex flex-col items-center justify-between`}
      style={{
        background: s.bgGradient || s.bg,
        borderRadius: s.cornerStyle === 'pill' ? '24px' : s.cornerStyle === 'rounded' ? '12px' : s.cornerStyle === 'sharp' ? '2px' : '8px',
        border: s.borderStyle === 'gold-line' ? `1.5px solid ${accent}` :
          s.borderStyle === 'double-line' ? `3px double ${accent}` :
          s.borderStyle === 'thin-line' ? `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` :
          'none',
        fontFamily: titleFont,
        padding: isCard ? '12px' : '24px',
      }}
    >
      {/* Overlay */}
      {s.overlay === 'dark-gradient' && (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6))', pointerEvents: 'none' }} />
      )}
      {s.overlay === 'light-gradient' && (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(255,255,255,0.6))', pointerEvents: 'none' }} />
      )}
      {s.overlay === 'solid-bottom' && (
        <div className="absolute bottom-0 left-0 right-0 h-1/3" style={{ background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)', pointerEvents: 'none' }} />
      )}
      {s.overlay === 'vignette' && (
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4))', pointerEvents: 'none' }} />
      )}

      {/* Pattern overlay */}
      {s.pattern === 'diamonds' && (
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(45deg, ${accent} 0px, ${accent} 1px, transparent 1px, transparent 20px),
            repeating-linear-gradient(-45deg, ${accent} 0px, ${accent} 1px, transparent 1px, transparent 20px)`,
          pointerEvents: 'none',
        }} />
      )}
      {s.pattern === 'dots' && (
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `radial-gradient(circle, ${accent} 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
          pointerEvents: 'none',
        }} />
      )}
      {s.pattern === 'lines' && (
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(0deg, ${accent} 0px, ${accent} 1px, transparent 1px, transparent 12px)`,
          pointerEvents: 'none',
        }} />
      )}
      {s.pattern === 'geometric' && (
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(30deg, ${accent} 12%, transparent 12.5%, transparent 87%, ${accent} 87.5%, ${accent}),
            linear-gradient(150deg, ${accent} 12%, transparent 12.5%, transparent 87%, ${accent} 87.5%, ${accent}),
            linear-gradient(30deg, ${accent} 12%, transparent 12.5%, transparent 87%, ${accent} 87.5%, ${accent}),
            linear-gradient(150deg, ${accent} 12%, transparent 12.5%, transparent 87%, ${accent} 87.5%, ${accent})`,
          backgroundSize: '40px 70px',
          pointerEvents: 'none',
        }} />
      )}

      {/* Corner ornaments for luxury */}
      {s.decorativeElements.includes('corner-ornament') && isCard && (
        <>
          <div className="absolute top-1 left-1 w-3 h-3 border-t border-l" style={{ borderColor: accent }} />
          <div className="absolute top-1 right-1 w-3 h-3 border-t border-r" style={{ borderColor: accent }} />
          <div className="absolute bottom-1 left-1 w-3 h-3 border-b border-l" style={{ borderColor: accent }} />
          <div className="absolute bottom-1 right-1 w-3 h-3 border-b border-r" style={{ borderColor: accent }} />
        </>
      )}

      {/* Cover image */}
      {coverImage && s.coverImagePosition !== 'none' ? (
        <div className={`relative z-10 w-full flex-shrink-0 ${isCard ? 'mt-2 mb-1' : 'mb-4'}`}
          style={{
            height: s.coverImagePosition === 'full' ? (isCard ? '55%' : '50%') :
              s.coverImagePosition === 'center' ? (isCard ? '35%' : '40%') :
              s.coverImagePosition === 'top' ? (isCard ? '30%' : '35%') :
              s.coverImagePosition === 'left-third' ? (isCard ? '35%' : '40%') : '30%',
            borderRadius: s.coverImageShape === 'rounded' ? '8px' :
              s.coverImageShape === 'circle' ? '50%' :
              s.coverImageShape === 'arch' ? '999px 999px 0 0' : '0',
            overflow: 'hidden',
          }}
        >
          <img
            src={coverImage}
            alt=""
            className="w-full h-full object-cover"
          />
          {s.coverImagePosition === 'full' && (
            <div className="absolute inset-0" style={{ background: isDark ? 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)' : 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.8) 100%)' }} />
          )}
        </div>
      ) : !coverImage && s.coverImagePosition !== 'none' && s.coverImageShape !== 'full' ? (
        <div className={`relative z-10 w-full flex-shrink-0 ${isCard ? 'mt-2 mb-1' : 'mb-4'} flex items-center justify-center`}
          style={{
            height: s.coverImagePosition === 'center' ? (isCard ? '25%' : '30%') :
              s.coverImagePosition === 'top' ? (isCard ? '22%' : '25%') : '20%',
            borderRadius: s.coverImageShape === 'rounded' ? '8px' :
              s.coverImageShape === 'circle' ? '50%' :
              s.coverImageShape === 'arch' ? '999px 999px 0 0' : '0',
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          }}
        >
          <ImageIcon className={`${isCard ? 'w-6 h-6' : 'w-10 h-10'} ${isDark ? 'text-white/10' : 'text-black/10'}`} />
        </div>
      ) : null}

      {/* Content area */}
      <div className={`relative z-10 flex flex-col items-center text-center flex-1 ${isCard ? 'gap-0.5' : 'gap-2'} ${isCard ? 'px-1' : 'px-4'} justify-end pb-1`}>

        {/* Logo */}
        {logo && !isCard && (
          <div className="mb-2">
            <img src={logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
          </div>
        )}

        {/* Tag */}
        {s.tagName && (
          <div className={`${isCard ? 'text-[6px]' : 'text-[10px]'} tracking-[0.15em] font-medium`}
            style={{ color: accent, fontFamily: subFont }}
          >
            {s.tagStyle === 'gold-line' && (
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-px" style={{ background: accent }} />
                {s.tagName}
                <span className="inline-block w-3 h-px" style={{ background: accent }} />
              </span>
            )}
            {s.tagStyle === 'outline-badge' && (
              <span className="px-1.5 py-0.5 border" style={{ borderColor: accent, borderRadius: '2px' }}>
                {s.tagName}
              </span>
            )}
            {s.tagStyle === 'underline' && (
              <span className="underline underline-offset-2">{s.tagName}</span>
            )}
            {s.tagStyle === 'dot' && (
              <span className="flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full" style={{ background: accent }} />
                {s.tagName}
              </span>
            )}
            {s.tagStyle === 'gold-badge' && (
              <span className="px-1.5 py-0.5 rounded-sm" style={{ background: `${accent}15` }}>
                {s.tagName}
              </span>
            )}
            {s.tagStyle === 'none' && s.tagName}
          </div>
        )}

        {/* Business name */}
        <h3 className={`${isCard ? 'text-sm font-bold' : 'text-xl sm:text-2xl font-bold'} leading-tight`}
          style={{ color: s.textColor, fontFamily: titleFont }}
        >
          {businessName || 'Your Business'}
        </h3>

        {/* Tagline */}
        {tagline && !isCard && (
          <p className="text-xs opacity-50 max-w-[200px]" style={{ color: s.textColor, fontFamily: subFont }}>
            {tagline}
          </p>
        )}

        {/* Decorative rule */}
        {s.decorativeElements.includes('gold-line-divider') && (
          <div className="my-0.5" style={{ width: isCard ? '20px' : '40px', height: '1px', background: accent }} />
        )}
        {s.decorativeElements.includes('thin-rule') && (
          <div className="my-0.5" style={{ width: isCard ? '24px' : '48px', height: '1px', background: `${s.textColor}20` }} />
        )}
        {s.decorativeElements.includes('bold-rule') && (
          <div className="my-0.5" style={{ width: isCard ? '28px' : '56px', height: '2px', background: s.textColor }} />
        )}
        {s.decorativeElements.includes('accent-bar') && (
          <div className="my-1" style={{ width: isCard ? '32px' : '64px', height: '3px', background: accent, borderRadius: '2px' }} />
        )}
        {s.decorativeElements.includes('color-bar') && (
          <div className="my-1" style={{ width: '60%', height: '3px', background: accent, borderRadius: '2px' }} />
        )}

        {/* Subtitle / category */}
        <p className={`${isCard ? 'text-[7px]' : 'text-[11px]'} tracking-[0.1em] uppercase opacity-40`}
          style={{ color: s.textColor, fontFamily: subFont }}
        >
          {template.categoryLabel}
        </p>

        {/* Button */}
        {!isCard && (
          <button
            onClick={onTapOpen}
            className="mt-3 px-5 py-2 text-xs font-semibold tracking-wider transition-all duration-300 hover:scale-105"
            style={{
              background: s.buttonStyle === 'gold-pill' ? accent :
                s.buttonStyle === 'outline' ? 'transparent' :
                s.buttonStyle === 'ghost' ? 'transparent' :
                s.buttonStyle === 'solid-dark' ? s.textColor :
                accent,
              color: s.buttonStyle === 'outline' || s.buttonStyle === 'ghost' ? s.textColor : (s.buttonStyle === 'solid-dark' ? s.bg : '#fff'),
              border: s.buttonStyle === 'outline' ? `1px solid ${accent}` :
                s.buttonStyle === 'ghost' ? '1px solid rgba(255,255,255,0.15)' : 'none',
              borderRadius: s.buttonStyle === 'gold-pill' ? '999px' : '8px',
            }}
          >
            {s.buttonLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// COVER TEMPLATE CARD — Individual card in the gallery
// ═══════════════════════════════════════════════════════

function CoverTemplateCard({
  template,
  isActive,
  isApplying,
  isFavorite,
  businessName,
  logo,
  coverImage,
  tagline,
  accent,
  onApply,
  onPreview,
  onToggleFavorite,
}: {
  template: CoverTemplateStyle;
  isActive: boolean;
  isApplying: boolean;
  isFavorite: boolean;
  businessName: string;
  logo: string | null;
  coverImage: string | null;
  tagline: string;
  accent: string;
  onApply: () => void;
  onPreview: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <div className="group relative">
      {/* Applied indicator ring */}
      <div className={`relative rounded-xl p-0.5 transition-all duration-300 ${
        isActive ? 'ring-2 ring-gold/60 shadow-premium' : 'hover:ring-1 hover:ring-black/10'
      }`}>
        {/* Applied badge */}
        {isActive && (
          <div className="absolute -top-2 -right-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold text-white text-[10px] font-bold shadow-md">
            <Check className="w-2.5 h-2.5" />
            Applied
          </div>
        )}

        {/* Favorite button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className="absolute top-3 left-3 z-20 p-1.5 rounded-full transition-all duration-200 hover:scale-110"
          style={{ background: isFavorite ? 'rgba(220,38,38,0.9)' : 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white text-white' : 'text-white/80'}`} />
        </button>

        {/* Cover preview */}
        <div className="cursor-pointer" onClick={onPreview}>
          <CoverPreview
            template={template}
            businessName={businessName}
            logo={logo}
            coverImage={coverImage}
            tagline={tagline}
            size="card"
            accentOverride={isActive ? accent : undefined}
          />
        </div>
      </div>

      {/* Info bar */}
      <div className="mt-2.5 px-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-charcoal tracking-tight">{template.label}</h3>
            <p className="text-[11px] text-charcoal/40">{template.categoryLabel}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onPreview}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-charcoal/50 hover:text-charcoal rounded-lg hover:bg-black/[0.04] transition-colors"
            >
              <Eye className="w-3 h-3" />
              Preview
            </button>
            {isActive ? (
              <div className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-gold rounded-lg bg-gold/10">
                <Check className="w-3 h-3" />
                Applied
              </div>
            ) : (
              <button
                onClick={onApply}
                disabled={isApplying}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-white bg-charcoal hover:bg-charcoal-light rounded-lg transition-colors disabled:opacity-50"
              >
                {isApplying ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Apply
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// COVER CUSTOMIZATION PANEL
// ═══════════════════════════════════════════════════════

function CoverCustomizationPanel({
  coverImage,
  coverTagline,
  coverAccent,
  onChangeImage,
  onChangeTagline,
  onChangeAccent,
  onRemoveImage,
}: {
  coverImage: string | null;
  coverTagline: string;
  coverAccent: string;
  onChangeImage: (url: string | null) => void;
  onChangeTagline: (val: string) => void;
  onChangeAccent: (val: string) => void;
  onRemoveImage: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = useAuthStore((s) => s.token);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        onChangeImage(data.url);
        toast.success('Cover image uploaded');
      } else {
        toast.error('Failed to upload image');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const accentPresets = [
    { label: 'Gold', value: '#C9A84C' },
    { label: 'Silver', value: '#A1A1AA' },
    { label: 'Black', value: '#0A0A0A' },
    { label: 'White', value: '#FFFFFF' },
    { label: 'Rose', value: '#E11D48' },
    { label: 'Ocean', value: '#0891B2' },
    { label: 'Emerald', value: '#059669' },
    { label: 'Violet', value: '#7C3AED' },
  ];

  return (
    <div className="space-y-5">
      {/* Cover Image */}
      <div>
        <label className="flex items-center gap-2 text-[12px] font-semibold text-charcoal/70 uppercase tracking-wider mb-2">
          <ImageIcon className="w-3.5 h-3.5" />
          Cover Image
        </label>
        {coverImage ? (
          <div className="relative rounded-xl overflow-hidden aspect-[3/2] bg-smoke">
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg bg-white text-charcoal text-[11px] font-medium shadow-lg"
              >
                Replace
              </button>
              <button
                onClick={onRemoveImage}
                className="p-2 rounded-lg bg-white text-red-500 text-[11px] font-medium shadow-lg"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full rounded-xl border-2 border-dashed border-charcoal/10 aspect-[3/2] flex flex-col items-center justify-center gap-2 text-charcoal/30 hover:text-charcoal/50 hover:border-charcoal/20 transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
            <span className="text-xs font-medium">{uploading ? 'Uploading...' : 'Upload Cover Image'}</span>
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </div>

      {/* Tagline */}
      <div>
        <label className="flex items-center gap-2 text-[12px] font-semibold text-charcoal/70 uppercase tracking-wider mb-2">
          <Type className="w-3.5 h-3.5" />
          Tagline
        </label>
        <Input
          value={coverTagline}
          onChange={(e) => onChangeTagline(e.target.value)}
          placeholder="e.g. Quality. Style. Innovation."
          className="h-9 text-sm bg-white"
        />
        <p className="text-[10px] text-charcoal/30 mt-1">Optional — appears below the business name on the cover.</p>
      </div>

      {/* Cover Accent */}
      <div>
        <label className="flex items-center gap-2 text-[12px] font-semibold text-charcoal/70 uppercase tracking-wider mb-2">
          <Palette className="w-3.5 h-3.5" />
          Cover Accent
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {accentPresets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onChangeAccent(preset.value)}
              className={`w-7 h-7 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                coverAccent === preset.value ? 'border-charcoal scale-110 shadow-md' : 'border-transparent'
              }`}
              style={{ background: preset.value }}
              title={preset.label}
            />
          ))}
          <div className="relative">
            <input
              type="color"
              value={coverAccent}
              onChange={(e) => onChangeAccent(e.target.value)}
              className="w-7 h-7 rounded-full cursor-pointer border-2 border-transparent hover:border-charcoal/30"
              title="Custom color"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// FULL-SCREEN COVER PREVIEW MODAL
// ═══════════════════════════════════════════════════════

function CoverPreviewModal({
  template,
  businessName,
  logo,
  coverImage,
  tagline,
  accent,
  isOpen,
  onClose,
  onApply,
  isApplied,
  isApplying,
}: {
  template: CoverTemplateStyle;
  businessName: string;
  logo: string | null;
  coverImage: string | null;
  tagline: string;
  accent: string;
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  isApplied: boolean;
  isApplying: boolean;
}) {
  const [showAnimation, setShowAnimation] = useState(false);

  const handleTapOpen = () => {
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 1200);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full p-0 gap-0 bg-ivory border-charcoal/10 overflow-hidden" style={{ maxHeight: '90vh' }}>
        <DialogTitle className="sr-only">Cover Preview — {template.label}</DialogTitle>
        <div className="flex flex-col lg:flex-row">
          {/* Preview Area */}
          <div className="flex-1 flex items-center justify-center p-8 lg:p-12 bg-smoke/50 min-h-[400px] lg:min-h-[600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={showAnimation ? 'opened' : 'closed'}
                initial={showAnimation ? false : { scale: 0.9, opacity: 0 }}
                animate={showAnimation ? {
                  rotateY: -160,
                  scale: 0.85,
                  opacity: 0.5,
                  transformPerspective: 1200,
                } : {
                  scale: 1,
                  opacity: 1,
                  rotateY: 0,
                }}
                exit={showAnimation ? { rotateY: -180, opacity: 0 } : { scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <CoverPreview
                  template={template}
                  businessName={businessName}
                  logo={logo}
                  coverImage={coverImage}
                  tagline={tagline}
                  size="preview"
                  accentOverride={accent}
                  onTapOpen={handleTapOpen}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Info sidebar */}
          <div className="w-full lg:w-[300px] p-6 lg:p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-charcoal/10 bg-white">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-[10px] font-semibold tracking-wider">
                  {template.categoryLabel}
                </Badge>
              </div>
              <h2 className="text-2xl font-bold text-charcoal font-editorial">{template.label}</h2>
              <p className="text-sm text-charcoal/50 mt-1">{template.description}</p>

              <div className="mt-6 space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-charcoal/30 font-semibold">Style Details</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="px-3 py-2 rounded-lg bg-smoke/80">
                    <p className="text-[10px] text-charcoal/40">Background</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-3 h-3 rounded-sm border border-charcoal/10" style={{ background: template.style.bg }} />
                      <span className="text-[11px] font-medium text-charcoal/70">{template.style.bg}</span>
                    </div>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-smoke/80">
                    <p className="text-[10px] text-charcoal/40">Accent</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-3 h-3 rounded-sm" style={{ background: template.style.accentColor }} />
                      <span className="text-[11px] font-medium text-charcoal/70">{template.style.accentColor}</span>
                    </div>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-smoke/80">
                    <p className="text-[10px] text-charcoal/40">Typography</p>
                    <p className="text-[11px] font-medium text-charcoal/70 mt-0.5 capitalize">{template.style.titleFont}</p>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-smoke/80">
                    <p className="text-[10px] text-charcoal/40">Layout</p>
                    <p className="text-[11px] font-medium text-charcoal/70 mt-0.5 capitalize">{template.style.coverImagePosition}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[10px] uppercase tracking-wider text-charcoal/30 font-semibold mb-2">Recommended For</p>
                <div className="flex flex-wrap gap-1.5">
                  {template.recommendedFor.map((biz) => (
                    <Badge key={biz} variant="outline" className="text-[10px] font-normal">
                      {biz}
                    </Badge>
                  ))}
                </div>
              </div>

              <p className="mt-6 text-[10px] text-charcoal/30 italic">
                Tap &quot;Tap to Open&quot; on the preview to see the book opening animation.
              </p>
            </div>

            <div className="mt-6 flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Close
              </Button>
              {isApplied ? (
                <Button className="flex-1 bg-gold/10 text-gold hover:bg-gold/20 border-gold/20" variant="outline">
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Applied
                </Button>
              ) : (
                <Button
                  onClick={onApply}
                  disabled={isApplying}
                  className="flex-1 bg-charcoal hover:bg-charcoal-light text-white"
                >
                  {isApplying ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                  Apply This Cover
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN DESIGN STUDIO COMPONENT
// ═══════════════════════════════════════════════════════

export default function DesignStudio() {
  const token = useAuthStore((s) => s.token);
  const currentBusiness = useAppStore((s) => s.currentBusiness);
  const activeCoverTemplate = useAppStore((s) => s.activeCoverTemplate);
  const coverTemplateAppliedAt = useAppStore((s) => s.coverTemplateAppliedAt);
  const coverCustomization = useAppStore((s) => s.coverCustomization);
  const coverFavorites = useAppStore((s) => s.coverFavorites);
  const setActiveCoverTemplate = useAppStore((s) => s.setActiveCoverTemplate);
  const setCoverCustomization = useAppStore((s) => s.setCoverCustomization);
  const toggleCoverFavorite = useAppStore((s) => s.toggleCoverFavorite);

  const [activeTab, setActiveTab] = useState<string>('cover-templates');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CoverCategory | 'all'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<CoverTemplateStyle | null>(null);
  const [showCustomization, setShowCustomization] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [bizCategory, setBizCategory] = useState<string | null>(null);

  // Fetch business category for recommendations
  React.useEffect(() => {
    if (!currentBusiness?.id || !token) return;
    fetch(`/api/businesses/${currentBusiness.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.business?.category) setBizCategory(d.business.category);
      })
      .catch(() => {});
  }, [currentBusiness?.id, token]);

  // Load saved cover template on mount
  React.useEffect(() => {
    if (!currentBusiness?.id || !token) return;
    fetch(`/api/businesses/${currentBusiness.id}/cover-template`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.coverTemplate) {
          setActiveCoverTemplate(d.coverTemplate.coverTemplateId);
          setCoverCustomization({
            coverImage: d.coverTemplate.coverImage,
            coverTagline: d.coverTemplate.coverTagline || '',
            coverAccent: d.coverTemplate.coverAccent || '#C9A84C',
          });
        }
      })
      .catch(() => {});
  }, [currentBusiness?.id, token]);

  const businessName = currentBusiness?.name || 'Your Business';
  const businessLogo = currentBusiness?.logo || null;

  // Recommended covers
  const recommendedCovers = useMemo(() => {
    if (!bizCategory) return [];
    return getRecommendedCovers(bizCategory);
  }, [bizCategory]);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    let templates = searchCovers(searchQuery);
    if (selectedCategory !== 'all') {
      templates = templates.filter((t) => t.category === selectedCategory);
    }
    if (showFavoritesOnly) {
      templates = templates.filter((t) => coverFavorites.includes(t.id));
    }
    return templates;
  }, [searchQuery, selectedCategory, showFavoritesOnly, coverFavorites]);

  // Apply template (optimistic)
  const applyTemplate = useCallback(async (templateId: string) => {
    if (!currentBusiness?.id || !token) return;
    const previousTemplate = activeCoverTemplate;

    setApplyingTemplate(templateId);
    // Instant UI update
    setActiveCoverTemplate(templateId);

    try {
      const res = await fetch(`/api/businesses/${currentBusiness.id}/cover-template`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          coverTemplateId: templateId,
          coverImage: coverCustomization.coverImage,
          coverTagline: coverCustomization.coverTagline,
          coverAccent: coverCustomization.coverAccent,
        }),
      });

      if (!res.ok) {
        setActiveCoverTemplate(previousTemplate);
        toast.error('Failed to apply cover template');
      } else {
        toast.success(`Cover template applied`, {
          description: `"${COVER_TEMPLATES.find(t => t.id === templateId)?.label}" is now active.`,
        });
      }
    } catch {
      setActiveCoverTemplate(previousTemplate);
      toast.error('Failed to apply cover template');
    } finally {
      setApplyingTemplate(null);
    }
  }, [currentBusiness?.id, token, activeCoverTemplate, coverCustomization]);

  // Save customization
  const saveCustomization = useCallback(async (field: string, value: string | null) => {
    setCustomizing(true);
    setCoverCustomization({ [field]: value } as any);

    if (currentBusiness?.id && token && activeCoverTemplate) {
      try {
        const newCustom = { ...coverCustomization, [field]: value };
        await fetch(`/api/businesses/${currentBusiness.id}/cover-template`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            coverTemplateId: activeCoverTemplate,
            coverImage: newCustom.coverImage,
            coverTagline: newCustom.coverTagline,
            coverAccent: newCustom.coverAccent,
          }),
        });
      } catch {
        // Non-critical
      }
    }
    setCustomizing(false);
  }, [currentBusiness?.id, token, activeCoverTemplate, coverCustomization]);

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-charcoal tracking-tight font-editorial">Design Studio</h1>
          <p className="text-sm text-charcoal/40 mt-0.5">Customize your menu and book cover design</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border border-charcoal/10 p-1 h-auto">
          <TabsTrigger value="menu-templates" className="data-[state=active]:bg-charcoal data-[state=active]:text-white text-charcoal/60 px-4 py-2 text-sm font-medium rounded-lg transition-all">
            <Palette className="w-4 h-4 mr-2" />
            Menu Templates
          </TabsTrigger>
          <TabsTrigger value="cover-templates" className="data-[state=active]:bg-charcoal data-[state=active]:text-white text-charcoal/60 px-4 py-2 text-sm font-medium rounded-lg transition-all">
            <BookOpen className="w-4 h-4 mr-2" />
            Book Cover Templates
          </TabsTrigger>
        </TabsList>

        {/* Menu Templates Tab — Shows the original Templates component content */}
        <TabsContent value="menu-templates" className="mt-6">
          <div className="text-center py-16">
            <Palette className="w-12 h-12 text-charcoal/10 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-charcoal/60">Menu Templates</h3>
            <p className="text-sm text-charcoal/30 max-w-md mx-auto mt-1">
              Choose a design for your menu/catalog interior pages. These templates control how your menu items, categories, and prices are displayed to customers.
            </p>
            <Button
              onClick={() => {
                if (typeof window !== 'undefined') window.location.hash = '#/templates';
              }}
              className="mt-4 bg-charcoal hover:bg-charcoal-light text-white"
            >
              Go to Menu Templates
            </Button>
          </div>
        </TabsContent>

        {/* Book Cover Templates Tab */}
        <TabsContent value="cover-templates" className="mt-0 space-y-6">
          {/* Draft indicator */}
          {activeCoverTemplate && currentBusiness?.status !== 'published' && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200/60">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700">
                <span className="font-semibold">Draft Mode</span> — Your cover changes are saved locally but not yet visible to customers.{' '}
                <button onClick={() => { if (typeof window !== 'undefined') window.location.hash = '#/business-settings'; }} className="underline font-semibold">
                  Publish
                </button>{' '}
                to make them public.
              </p>
            </div>
          )}

          {/* Recommended section */}
          {recommendedCovers.length > 0 && !searchQuery && selectedCategory === 'all' && !showFavoritesOnly && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-gold" />
                <h2 className="text-sm font-semibold text-charcoal">Recommended for Your Business</h2>
                {bizCategory && (
                  <Badge variant="secondary" className="text-[10px] font-normal">{bizCategory}</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {recommendedCovers.slice(0, 5).map((template) => (
                  <CoverTemplateCard
                    key={template.id}
                    template={template}
                    isActive={activeCoverTemplate === template.id}
                    isApplying={applyingTemplate === template.id}
                    isFavorite={coverFavorites.includes(template.id)}
                    businessName={businessName}
                    logo={businessLogo}
                    coverImage={coverCustomization.coverImage}
                    tagline={coverCustomization.coverTagline}
                    accent={coverCustomization.coverAccent}
                    onApply={() => applyTemplate(template.id)}
                    onPreview={() => setPreviewTemplate(template)}
                    onToggleFavorite={() => toggleCoverFavorite(template.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/30" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="pl-9 h-9 text-sm bg-white"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-charcoal text-white'
                    : 'bg-white text-charcoal/50 hover:bg-charcoal/5 border border-charcoal/10'
                }`}
              >
                All
              </button>
              {COVER_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors flex items-center gap-1 ${
                    selectedCategory === cat.id
                      ? 'bg-charcoal text-white'
                      : 'bg-white text-charcoal/50 hover:bg-charcoal/5 border border-charcoal/10'
                  }`}
                >
                  <span className="text-[10px]">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                showFavoritesOnly
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-white text-charcoal/50 hover:bg-charcoal/5 border border-charcoal/10'
              }`}
            >
              <Heart className={`w-3 h-3 ${showFavoritesOnly ? 'fill-red-500' : ''}`} />
              Favorites {coverFavorites.length > 0 && `(${coverFavorites.length})`}
            </button>
            <button
              onClick={() => setShowCustomization(!showCustomization)}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                showCustomization
                  ? 'bg-gold/10 text-gold-dark border border-gold/20'
                  : 'bg-white text-charcoal/50 hover:bg-charcoal/5 border border-charcoal/10'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              Customize
            </button>
          </div>

          {/* Main content area */}
          <div className="flex gap-6">
            {/* Template gallery */}
            <div className="flex-1 min-w-0">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-16">
                  <Search className="w-10 h-10 text-charcoal/10 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-charcoal/40">No templates found</h3>
                  <p className="text-sm text-charcoal/25 mt-1">Try adjusting your search or filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredTemplates.map((template) => (
                    <CoverTemplateCard
                      key={template.id}
                      template={template}
                      isActive={activeCoverTemplate === template.id}
                      isApplying={applyingTemplate === template.id}
                      isFavorite={coverFavorites.includes(template.id)}
                      businessName={businessName}
                      logo={businessLogo}
                      coverImage={coverCustomization.coverImage}
                      tagline={coverCustomization.coverTagline}
                      accent={coverCustomization.coverAccent}
                      onApply={() => applyTemplate(template.id)}
                      onPreview={() => setPreviewTemplate(template)}
                      onToggleFavorite={() => toggleCoverFavorite(template.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Customization sidebar */}
            <AnimatePresence>
              {showCustomization && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 280, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 overflow-hidden"
                >
                  <div className="w-[280px] p-4 rounded-xl bg-white border border-charcoal/10 shadow-premium">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-charcoal">Cover Settings</h3>
                      <button onClick={() => setShowCustomization(false)} className="text-charcoal/30 hover:text-charcoal/60">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {activeCoverTemplate ? (
                      <CoverCustomizationPanel
                        coverImage={coverCustomization.coverImage}
                        coverTagline={coverCustomization.coverTagline}
                        coverAccent={coverCustomization.coverAccent}
                        onChangeImage={(url) => saveCustomization('coverImage', url)}
                        onChangeTagline={(val) => saveCustomization('coverTagline', val)}
                        onChangeAccent={(val) => saveCustomization('coverAccent', val)}
                        onRemoveImage={() => saveCustomization('coverImage', null)}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="w-8 h-8 text-charcoal/10 mx-auto mb-2" />
                        <p className="text-xs text-charcoal/30">Apply a cover template first to customize it.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      {previewTemplate && (
        <CoverPreviewModal
          template={previewTemplate}
          businessName={businessName}
          logo={businessLogo}
          coverImage={coverCustomization.coverImage}
          tagline={coverCustomization.coverTagline}
          accent={coverCustomization.coverAccent}
          isOpen={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onApply={() => {
            applyTemplate(previewTemplate.id);
            setPreviewTemplate(null);
          }}
          isApplied={activeCoverTemplate === previewTemplate.id}
          isApplying={applyingTemplate === previewTemplate.id}
        />
      )}
    </div>
  );
}
