'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COVER_TEMPLATES, CoverTemplateStyle } from '@/lib/cover-templates';

interface PublicCoverProps {
  business: {
    id: string;
    name: string;
    logo: string | null;
    slug: string;
  };
  onOpen: () => void;
}

export default function PublicCover({ business, onOpen }: PublicCoverProps) {
  const [coverData, setCoverData] = useState<{
    coverTemplateId: string;
    coverImage: string | null;
    coverTagline: string;
    coverAccent: string;
  } | null>(null);

  // Fetch cover template data
  useEffect(() => {
    fetch(`/api/businesses/${business.id}/cover-template`)
      .then((r) => r.json())
      .then((d) => {
        if (d.coverTemplate) {
          setCoverData({
            coverTemplateId: d.coverTemplate.coverTemplateId,
            coverImage: d.coverTemplate.coverImage,
            coverTagline: d.coverTemplate.coverTagline || '',
            coverAccent: d.coverTemplate.coverAccent || '#C9A84C',
          });
        }
      })
      .catch(() => {});
  }, [business.id]);

  const template = coverData
    ? COVER_TEMPLATES.find((t) => t.id === coverData.coverTemplateId)
    : null;

  if (!template || !coverData) return null;

  const s = template.style;
  const accent = coverData.coverAccent || s.accentColor;
  const isDark = ['#0C0A09', '#0F172A', '#1A0A0A', '#09090B', '#0A0A0F', '#18181B', '0A0A0A',
    '1C1917', '2C1810', '1E3A5F', '0F0F23', '1A0A00', '1A1A3E', '2D1B69'].includes(s.bg);

  const fontMap: Record<string, string> = {
    serif: "'Playfair Display', Georgia, serif",
    sans: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
  };
  const titleFont = fontMap[s.titleFont] || fontMap.sans;
  const subFont = fontMap[s.subtitleFont] || fontMap.sans;

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center safe-top safe-bottom">
      {/* Full-screen cover */}
      <motion.div
        key="cover"
        id="public-cover"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{
          rotateY: -160,
          scale: 0.85,
          opacity: 0,
          transformPerspective: 1200,
        }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
        style={{
          background: s.bgGradient || s.bg,
          fontFamily: titleFont,
        }}
      >
        {/* Overlay */}
        {s.overlay === 'dark-gradient' && (
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6))', pointerEvents: 'none' }} />
        )}
        {s.overlay === 'light-gradient' && (
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(255,255,255,0.6))', pointerEvents: 'none' }} />
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
        {s.decorativeElements.includes('corner-ornament') && (
          <>
            <div className="absolute top-6 left-6 w-6 h-6 border-t-2 border-l-2" style={{ borderColor: accent }} />
            <div className="absolute top-6 right-6 w-6 h-6 border-t-2 border-r-2" style={{ borderColor: accent }} />
            <div className="absolute bottom-6 left-6 w-6 h-6 border-b-2 border-l-2" style={{ borderColor: accent }} />
            <div className="absolute bottom-6 right-6 w-6 h-6 border-b-2 border-r-2" style={{ borderColor: accent }} />
          </>
        )}

        {/* Cover image */}
        {coverData.coverImage && s.coverImagePosition !== 'none' && (
          <div className="relative z-10 flex-shrink-0 mb-6"
            style={{
              maxWidth: '320px',
              width: '70vw',
              height: s.coverImagePosition === 'full' ? '30vh' :
                s.coverImagePosition === 'center' ? '25vh' :
                s.coverImagePosition === 'top' ? '22vh' : '20vh',
              borderRadius: s.coverImageShape === 'rounded' ? '12px' :
                s.coverImageShape === 'circle' ? '50%' :
                s.coverImageShape === 'arch' ? '999px 999px 0 0' : '0',
              overflow: 'hidden',
            }}
          >
            <img
              src={coverData.coverImage}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 gap-2">
          {/* Logo */}
          {business.logo && (
            <div className="mb-3">
              <img src={business.logo} alt="" className="w-14 h-14 rounded-xl object-cover shadow-lg" />
            </div>
          )}

          {/* Tag */}
          {s.tagName && (
            <div className="text-xs tracking-[0.2em] font-medium" style={{ color: accent, fontFamily: subFont }}>
              {s.tagStyle === 'gold-line' && (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-6 h-px" style={{ background: accent }} />
                  {s.tagName}
                  <span className="inline-block w-6 h-px" style={{ background: accent }} />
                </span>
              )}
              {s.tagStyle === 'outline-badge' && (
                <span className="px-2 py-1 border" style={{ borderColor: accent, borderRadius: '3px' }}>
                  {s.tagName}
                </span>
              )}
              {s.tagStyle === 'underline' && (
                <span className="underline underline-offset-2">{s.tagName}</span>
              )}
              {s.tagStyle === 'dot' && (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
                  {s.tagName}
                </span>
              )}
              {s.tagStyle === 'gold-badge' && (
                <span className="px-2 py-1 rounded-sm" style={{ background: `${accent}15` }}>
                  {s.tagName}
                </span>
              )}
              {s.tagStyle === 'none' && s.tagName}
            </div>
          )}

          {/* Business name */}
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight px-4"
            style={{ color: s.textColor, fontFamily: titleFont }}
          >
            {business.name}
          </h1>

          {/* Tagline */}
          {coverData.coverTagline && (
            <p className="text-sm opacity-50 max-w-xs" style={{ color: s.textColor, fontFamily: subFont }}>
              {coverData.coverTagline}
            </p>
          )}

          {/* Decorative rule */}
          {s.decorativeElements.includes('gold-line-divider') && (
            <div className="my-2" style={{ width: '60px', height: '1.5px', background: accent }} />
          )}
          {s.decorativeElements.includes('thin-rule') && (
            <div className="my-2" style={{ width: '80px', height: '1px', background: `${s.textColor}20` }} />
          )}
          {s.decorativeElements.includes('bold-rule') && (
            <div className="my-2" style={{ width: '80px', height: '2px', background: s.textColor }} />
          )}
          {s.decorativeElements.includes('accent-bar') && (
            <div className="my-2" style={{ width: '100px', height: '3px', background: accent, borderRadius: '2px' }} />
          )}

          {/* Category label */}
          <p className="text-[11px] tracking-[0.15em] uppercase opacity-30"
            style={{ color: s.textColor, fontFamily: subFont }}
          >
            {template.categoryLabel}
          </p>

          {/* Tap to Open button */}
          <button
            onClick={onOpen}
            className="mt-6 px-8 py-3 text-sm font-bold tracking-[0.1em] uppercase transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: s.buttonStyle === 'gold-pill' ? accent :
                s.buttonStyle === 'outline' ? 'transparent' :
                s.buttonStyle === 'ghost' ? 'transparent' :
                s.buttonStyle === 'solid-dark' ? s.textColor :
                accent,
              color: s.buttonStyle === 'outline' || s.buttonStyle === 'ghost' ? s.textColor : (s.buttonStyle === 'solid-dark' ? s.bg : '#fff'),
              border: s.buttonStyle === 'outline' ? `1.5px solid ${accent}` :
                s.buttonStyle === 'ghost' ? '1.5px solid rgba(255,255,255,0.15)' : 'none',
              borderRadius: s.buttonStyle === 'gold-pill' ? '999px' : '10px',
              boxShadow: s.buttonStyle === 'gold-pill' ? `0 4px 20px ${accent}40` : '0 4px 20px rgba(0,0,0,0.15)',
            }}
          >
            {s.buttonLabel}
          </button>
        </div>

        {/* BizFlip branding */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className={`text-[10px] tracking-wider ${isDark ? 'text-white/15' : 'text-black/15'}`}>
            Powered by <span className="font-bold">BIZFLIP</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
