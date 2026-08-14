'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Palette, Eye, Check, Loader2, Type, Paintbrush,
  Smartphone, X, Sparkles, Crown, ChevronRight,
  RotateCcw, ExternalLink, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuthStore, useAppStore } from '@/lib/store';
import { TEMPLATES, FONT_OPTIONS } from '@/lib/types';
import { toast } from 'sonner';

// ──────────────────────────────────────────────
// Template metadata: style tags for each template
// ──────────────────────────────────────────────
const TEMPLATE_TAGS: Record<string, string[]> = {
  modern: ['Clean', 'Contemporary'],
  classic: ['Traditional', 'Elegant'],
  luxury: ['Premium', 'Gold', 'Dark'],
  minimal: ['Whitespace', 'Simple'],
  fastfood: ['Bold', 'Vibrant'],
  cafe: ['Warm', 'Cozy'],
  pizza: ['Italian', 'Fun'],
  dark: ['Sleek', 'Dark'],
  colorful: ['Fun', 'Multi-color'],
  elegant: ['Refined', 'Sophisticated'],
};

// ──────────────────────────────────────────────
// Template style configs for CSS previews
// ──────────────────────────────────────────────
const TEMPLATE_STYLES: Record<string, {
  bg: string;
  headerBg: string;
  headerText: string;
  accent: string;
  text: string;
  subtext: string;
  cardBg: string;
  borderRadius: string;
  font: string;
  layout: 'list' | 'grid' | 'cards';
  dark?: boolean;
}> = {
  modern: {
    bg: '#ffffff', headerBg: '#f8fafc', headerText: '#0f172a', accent: '#10b981',
    text: '#1e293b', subtext: '#64748b', cardBg: '#f1f5f9', borderRadius: '8px', font: 'Inter, sans-serif', layout: 'list',
  },
  classic: {
    bg: '#fefce8', headerBg: '#92400e', headerText: '#ffffff', accent: '#b45309',
    text: '#451a03', subtext: '#78716c', cardBg: '#fffbeb', borderRadius: '4px', font: 'Georgia, serif', layout: 'list',
  },
  luxury: {
    bg: '#1c1917', headerBg: '#292524', headerText: '#d4a843', accent: '#d4a843',
    text: '#e7e5e4', subtext: '#a8a29e', cardBg: '#292524', borderRadius: '2px', font: 'Georgia, serif', layout: 'cards', dark: true,
  },
  minimal: {
    bg: '#ffffff', headerBg: '#ffffff', headerText: '#0a0a0a', accent: '#0a0a0a',
    text: '#171717', subtext: '#a3a3a3', cardBg: '#fafafa', borderRadius: '0px', font: 'Inter, sans-serif', layout: 'list',
  },
  fastfood: {
    bg: '#fff7ed', headerBg: '#ea580c', headerText: '#ffffff', accent: '#ea580c',
    text: '#431407', subtext: '#9a3412', cardBg: '#fff7ed', borderRadius: '12px', font: 'Inter, sans-serif', layout: 'grid',
  },
  cafe: {
    bg: '#fef7ee', headerBg: '#78350f', headerText: '#fffbeb', accent: '#a16207',
    text: '#422006', subtext: '#92400e', cardBg: '#fffbeb', borderRadius: '8px', font: 'Georgia, serif', layout: 'cards',
  },
  pizza: {
    bg: '#fef2f2', headerBg: '#16a34a', headerText: '#ffffff', accent: '#dc2626',
    text: '#1c1917', subtext: '#78716c', cardBg: '#ffffff', borderRadius: '12px', font: 'Inter, sans-serif', layout: 'grid',
  },
  dark: {
    bg: '#0a0a0a', headerBg: '#171717', headerText: '#ffffff', accent: '#10b981',
    text: '#e5e5e5', subtext: '#737373', cardBg: '#171717', borderRadius: '8px', font: 'Inter, sans-serif', layout: 'list', dark: true,
  },
  colorful: {
    bg: '#f0f9ff', headerBg: 'linear-gradient(135deg, #7c3aed, #ec4899, #f59e0b)', headerText: '#ffffff', accent: '#7c3aed',
    text: '#1e293b', subtext: '#64748b', cardBg: '#ffffff', borderRadius: '16px', font: 'Inter, sans-serif', layout: 'grid',
  },
  elegant: {
    bg: '#fafaf9', headerBg: '#1c1917', headerText: '#d6d3d1', accent: '#78716c',
    text: '#292524', subtext: '#a8a29e', cardBg: '#f5f5f4', borderRadius: '4px', font: 'Georgia, serif', layout: 'list',
  },
};

// ──────────────────────────────────────────────
// Mini template preview (card thumbnail)
// ──────────────────────────────────────────────
function TemplateMiniPreview({ templateName, width = 200, height = 260 }: { templateName: string; width?: number; height?: number }) {
  const style = TEMPLATE_STYLES[templateName] || TEMPLATE_STYLES.modern;
  const isGradient = style.headerBg.includes('gradient');

  const mockItems = [
    { name: 'Grilled Chicken', price: '\u20A64,500' },
    { name: 'Jollof Rice', price: '\u20A63,000' },
    { name: 'Caesar Salad', price: '\u20A62,500' },
  ];

  return (
    <div
      style={{
        width,
        height,
        background: style.bg,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)',
        fontFamily: style.font,
        fontSize: '7px',
        lineHeight: 1.3,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: isGradient ? undefined : style.headerBg,
          backgroundImage: isGradient ? style.headerBg : undefined,
          padding: '10px 8px',
          borderBottom: isGradient ? 'none' : `1px solid ${style.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
        }}
      >
        <div style={{ color: style.headerText, fontWeight: 700, fontSize: '9px', letterSpacing: '0.5px' }}>
          RESTAURANT
        </div>
        <div style={{ color: style.headerText, opacity: 0.7, fontSize: '5px', marginTop: '1px' }}>
          MENU
        </div>
      </div>

      {/* Category */}
      <div style={{ padding: '5px 8px 2px' }}>
        <div style={{
          color: style.accent,
          fontWeight: 600,
          fontSize: '7px',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.5px',
          borderBottom: `1.5px solid ${style.accent}`,
          paddingBottom: '2px',
          marginBottom: '4px',
          display: 'inline-block',
        }}>
          Main Course
        </div>
      </div>

      {/* Items */}
      <div style={{ padding: '0 8px 8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {style.layout === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            {mockItems.map((item, i) => (
              <div key={i} style={{ background: style.cardBg, borderRadius: style.borderRadius, padding: '4px' }}>
                <div style={{ color: style.text, fontWeight: 600, fontSize: '6px' }}>{item.name}</div>
                <div style={{ color: style.accent, fontWeight: 700, fontSize: '7px', marginTop: '2px' }}>{item.price}</div>
              </div>
            ))}
          </div>
        ) : style.layout === 'cards' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {mockItems.map((item, i) => (
              <div key={i} style={{
                background: style.cardBg, borderRadius: style.borderRadius, padding: '5px 6px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ color: style.text, fontWeight: 600, fontSize: '6px' }}>{item.name}</div>
                <div style={{ color: style.accent, fontWeight: 700, fontSize: '7px' }}>{item.price}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {mockItems.map((item, i) => (
              <div key={i} style={{
                borderBottom: `0.5px solid ${style.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                paddingBottom: '3px', display: 'flex', justifyContent: 'space-between',
              }}>
                <div style={{ color: style.text, fontWeight: 500, fontSize: '6px' }}>{item.name}</div>
                <div style={{ color: style.accent, fontWeight: 600, fontSize: '6.5px' }}>{item.price}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Second category hint */}
      <div style={{ padding: '2px 8px 0' }}>
        <div style={{
          color: style.subtext, fontSize: '6px', fontWeight: 500,
          textTransform: 'uppercase' as const, letterSpacing: '0.3px',
        }}>
          Drinks &amp; Desserts &#x25B8;
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Full mobile preview for dialog (preview-only, no apply)
// ──────────────────────────────────────────────
function TemplateMobilePreview({ templateName, primaryColor, secondaryColor, fontFamily }: {
  templateName: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
}) {
  const style = { ...TEMPLATE_STYLES[templateName] || TEMPLATE_STYLES.modern };
  if (primaryColor) style.accent = primaryColor;
  if (secondaryColor) style.cardBg = secondaryColor + '22';
  if (fontFamily) {
    const fontMap: Record<string, string> = {
      inter: 'Inter, sans-serif',
      serif: 'Georgia, serif',
      mono: 'monospace',
      playfair: '"Playfair Display", Georgia, serif',
    };
    style.font = fontMap[fontFamily] || style.font;
  }

  const isGradient = style.headerBg.includes('gradient');

  const mockCategories = [
    {
      name: 'Main Course',
      items: [
        { name: 'Grilled Chicken', description: 'Crispy chicken with vegetables', price: '\u20A64,500' },
        { name: 'Jollof Rice', description: 'Classic Nigerian jollof rice', price: '\u20A63,000' },
      ],
    },
    {
      name: 'Drinks',
      items: [
        { name: 'Chapman', description: 'Classic Nigerian cocktail', price: '\u20A61,500' },
        { name: 'Fresh Juice', description: 'Freshly squeezed orange juice', price: '\u20A61,000' },
      ],
    },
  ];

  return (
    <div
      className="mx-auto"
      style={{
        width: '280px', maxWidth: '100%', minHeight: '480px',
        background: style.bg, borderRadius: '16px', overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        fontFamily: style.font, fontSize: '12px', lineHeight: 1.5,
      }}
    >
      <div className="flex justify-center pt-2 pb-1" style={{ background: isGradient ? undefined : style.headerBg, backgroundImage: isGradient ? style.headerBg : undefined }}>
        <div className="w-16 h-1 rounded-full" style={{ background: style.dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)' }} />
      </div>

      <div style={{
        background: isGradient ? undefined : style.headerBg,
        backgroundImage: isGradient ? style.headerBg : undefined,
        padding: '16px 20px 20px',
      }}>
        <div style={{ color: style.headerText, fontWeight: 700, fontSize: '18px', letterSpacing: '1px' }}>
          MY RESTAURANT
        </div>
        <div style={{ color: style.headerText, opacity: 0.8, fontSize: '11px', marginTop: '2px' }}>
          Delicious Food, Served Fresh
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {mockCategories.map((cat) => (
          <div key={cat.name}>
            <div style={{
              color: style.accent, fontWeight: 700, fontSize: '11px',
              textTransform: 'uppercase' as const, letterSpacing: '1px',
              borderBottom: `2px solid ${style.accent}`,
              paddingBottom: '4px', marginBottom: '10px',
            }}>
              {cat.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cat.items.map((item) => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, marginRight: '12px' }}>
                    <div style={{ color: style.text, fontWeight: 600, fontSize: '13px' }}>{item.name}</div>
                    <div style={{ color: style.subtext, fontSize: '10px', marginTop: '1px' }}>{item.description}</div>
                  </div>
                  <div style={{ color: style.accent, fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap' }}>
                    {item.price}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Template Card Component
// ──────────────────────────────────────────────
function TemplateCard({
  template,
  isActive,
  isApplying,
  onPreview,
  onApply,
}: {
  template: typeof TEMPLATES[number];
  isActive: boolean;
  isApplying: boolean;
  onPreview: () => void;
  onApply: () => void;
}) {
  const tags = TEMPLATE_TAGS[template.name] || [];

  return (
    <div
      className={`group relative rounded-2xl transition-all duration-300 ${
        isActive
          ? 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/15 bg-white dark:bg-gray-900'
          : 'border border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg bg-white dark:bg-gray-900'
      }`}
    >
      {/* Applied badge */}
      {isActive && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <Badge className="bg-emerald-500 text-white border-0 shadow-sm gap-1 px-3 py-1 text-xs font-semibold">
            <Check className="h-3 w-3" />
            Applied
          </Badge>
        </div>
      )}

      {/* Template preview area */}
      <div
        className="relative overflow-hidden rounded-t-2xl bg-gray-50 dark:bg-gray-800 p-4 flex justify-center cursor-pointer"
        onClick={onPreview}
      >
        <TemplateMiniPreview templateName={template.name} width={180} height={220} />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              <Eye className="h-4 w-4" />
              Preview
            </div>
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="p-4 space-y-3">
        {/* Name and tags */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              {template.label.toUpperCase()}
            </h3>
            {isActive && (
              <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500"
              >
                {tag}
                {tag !== tags[tags.length - 1] && (
                  <span className="text-gray-300 dark:text-gray-600 ml-1.5">&bull;</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
          {template.description}
        </p>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-9 text-xs font-medium gap-1.5 rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={onPreview}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
          <Button
            size="sm"
            className={`flex-1 h-9 text-xs font-semibold gap-1.5 rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md'
            }`}
            disabled={isActive || isApplying}
            onClick={onApply}
          >
            {isApplying ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Applying...
              </>
            ) : isActive ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Applied
              </>
            ) : (
              'Apply'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Templates Component
// ──────────────────────────────────────────────
export default function Templates() {
  const { token } = useAuthStore();
  const { currentBusiness, setActiveTemplate, navigate } = useAppStore();

  // Local UI state
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);
  const [failedTemplate, setFailedTemplate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [secondaryColor, setSecondaryColor] = useState('#f1f5f9');
  const [selectedFont, setSelectedFont] = useState('inter');

  // Track the applied template locally for instant UI updates
  const [localActiveTemplate, setLocalActiveTemplate] = useState<string | null>(null);
  const prevBusinessRef = useRef(currentBusiness);

  // Sync colors/font from current business
  useEffect(() => {
    if (currentBusiness) {
      setPrimaryColor(currentBusiness.primaryColor || '#10b981');
      setSecondaryColor(currentBusiness.secondaryColor || '#f1f5f9');
      setSelectedFont(currentBusiness.fontFamily || 'inter');
      // Initialize local template from business data
      if (!localActiveTemplate) {
        setLocalActiveTemplate(currentBusiness.templateName || 'modern');
      }
    }
  }, [currentBusiness]);

  // Reset local template when business changes
  useEffect(() => {
    if (prevBusinessRef.current?.id !== currentBusiness?.id) {
      setLocalActiveTemplate(currentBusiness?.templateName || 'modern');
      prevBusinessRef.current = currentBusiness;
    }
  }, [currentBusiness?.id]);

  // Current active template: prioritize local state (optimistic), fall back to business
  const currentTemplate = localActiveTemplate || currentBusiness?.templateName || 'modern';

  // ──────────────────────────────────────────────
  // INSTANT APPLY — Optimistic UI + background save
  // ──────────────────────────────────────────────
  const applyTemplate = useCallback(async (templateName: string) => {
    if (!currentBusiness?.id || !token) return;
    if (currentTemplate === templateName) return;

    // 1. Instantly update local UI (optimistic)
    const previousTemplate = currentTemplate;
    setLocalActiveTemplate(templateName);
    setFailedTemplate(null);
    setActiveTemplate(templateName);

    // 2. Start background save
    setApplyingTemplate(templateName);

    try {
      const res = await fetch(`/api/businesses/${currentBusiness.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateName }),
      });

      if (!res.ok) {
        // Revert on failure
        setLocalActiveTemplate(previousTemplate);
        setActiveTemplate(previousTemplate);
        setFailedTemplate(templateName);
        toast.error('Unable to apply template. Please try again.');
      } else {
        const data = await res.json();
        const updatedBusiness = data.business;

        // Update current business in store with new template info
        if (updatedBusiness) {
          useAppStore.getState().setCurrentBusiness({
            ...currentBusiness,
            templateName: updatedBusiness.templateName || templateName,
            primaryColor: updatedBusiness.primaryColor || currentBusiness.primaryColor,
            secondaryColor: updatedBusiness.secondaryColor || currentBusiness.secondaryColor,
            fontFamily: updatedBusiness.fontFamily || currentBusiness.fontFamily,
          });
        }

        // Log template application
        try {
          await fetch(`/api/businesses/${currentBusiness.id}/template-log`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              templateId: templateName,
              businessId: currentBusiness.id,
            }),
          });
        } catch {
          // Logging failure is non-critical, silently ignore
        }

        toast.success(`"${TEMPLATES.find(t => t.name === templateName)?.label}" template applied!`, {
          description: 'Your menu preview has been updated instantly.',
          duration: 3000,
        });
      }
    } catch {
      // Network error — revert
      setLocalActiveTemplate(previousTemplate);
      setActiveTemplate(previousTemplate);
      setFailedTemplate(templateName);
      toast.error('Unable to apply template. Please try again.');
    } finally {
      setApplyingTemplate(null);
    }
  }, [currentBusiness, token, currentTemplate, setActiveTemplate]);

  // ──────────────────────────────────────────────
  // Customization save
  // ──────────────────────────────────────────────
  const applyCustomization = async () => {
    if (!currentBusiness?.id || !token) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/businesses/${currentBusiness.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ primaryColor, secondaryColor, fontFamily: selectedFont }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedBusiness = data.business;
        if (updatedBusiness) {
          useAppStore.getState().setCurrentBusiness({
            ...currentBusiness,
            primaryColor: updatedBusiness.primaryColor,
            secondaryColor: updatedBusiness.secondaryColor,
            fontFamily: updatedBusiness.fontFamily,
          });
        }
        toast.success('Customization applied successfully!');
      } else {
        toast.error('Failed to apply changes');
      }
    } catch {
      toast.error('Failed to apply changes');
    } finally {
      setSaving(false);
    }
  };

  // ──────────────────────────────────────────────
  // Preview as Customer navigation
  // ──────────────────────────────────────────────
  const goToCustomerPreview = () => {
    navigate('/preview');
  };

  // No business selected
  if (!currentBusiness) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Palette className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Please select a business first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header with Preview as Customer ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            Design Templates
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Choose a template and apply it instantly. Your menu preview updates in real-time.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 rounded-lg"
          onClick={goToCustomerPreview}
        >
          <ExternalLink className="h-4 w-4" />
          <span className="hidden sm:inline">Preview as Customer</span>
          <span className="sm:hidden">Preview</span>
        </Button>
      </div>

      {/* ── Template Gallery ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {TEMPLATES.map((template) => (
          <TemplateCard
            key={template.name}
            template={template}
            isActive={currentTemplate === template.name}
            isApplying={applyingTemplate === template.name}
            onPreview={() => setPreviewTemplate(template.name)}
            onApply={() => applyTemplate(template.name)}
          />
        ))}
      </div>

      {/* ── Customization Panel ── */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Paintbrush className="h-5 w-5 text-emerald-500" />
            Customize Design
          </CardTitle>
          <CardDescription>
            Fine-tune your menu&apos;s colors and typography. Changes apply to the current template.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primary Color */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Paintbrush className="h-4 w-4 text-muted-foreground" />
                Primary Color
              </Label>
              <div className="flex items-center gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 w-10 p-0 border-2"
                      style={{ borderColor: primaryColor }}
                    >
                      <div
                        className="w-full h-full rounded-sm"
                        style={{ backgroundColor: primaryColor }}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Primary Color</p>
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-full h-10 rounded cursor-pointer border-0"
                      />
                      <div className="flex gap-1.5 flex-wrap">
                        {['#10b981', '#0ea5e9', '#8b5cf6', '#f43f5e', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16'].map((c) => (
                          <button
                            key={c}
                            className="w-6 h-6 rounded-full border-2 border-transparent hover:border-foreground/30 transition-colors"
                            style={{ backgroundColor: c }}
                            onClick={() => setPrimaryColor(c)}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 flex-1 font-mono text-sm"
                  maxLength={7}
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Paintbrush className="h-4 w-4 text-muted-foreground" />
                Secondary Color
              </Label>
              <div className="flex items-center gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 w-10 p-0 border-2"
                      style={{ borderColor: secondaryColor }}
                    >
                      <div
                        className="w-full h-full rounded-sm"
                        style={{ backgroundColor: secondaryColor }}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Secondary Color</p>
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-full h-10 rounded cursor-pointer border-0"
                      />
                      <div className="flex gap-1.5 flex-wrap">
                        {['#f1f5f9', '#fef3c7', '#fce7f3', '#dbeafe', '#d1fae5', '#f3e8ff', '#fff7ed', '#f0fdf4'].map((c) => (
                          <button
                            key={c}
                            className="w-6 h-6 rounded-full border border-border hover:border-foreground/30 transition-colors"
                            style={{ backgroundColor: c }}
                            onClick={() => setSecondaryColor(c)}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-10 flex-1 font-mono text-sm"
                  maxLength={7}
                />
              </div>
            </div>

            {/* Font Family */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                Font Family
              </Label>
              <Select value={selectedFont} onValueChange={setSelectedFont}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value === 'inter' ? 'Inter, sans-serif' : font.value === 'serif' ? 'Georgia, serif' : font.value === 'mono' ? 'monospace' : '"Playfair Display", Georgia, serif' }}>
                        {font.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex justify-end mt-6">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-lg"
              onClick={applyCustomization}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Apply Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Draft vs Published info ── */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-4 flex items-start gap-3">
        <Crown className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200">Draft Mode</h4>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
            Templates are applied to your draft menu first. The public menu visible to customers will update after you click <strong>Publish</strong> in the top bar. This lets you preview and experiment before going live.
          </p>
        </div>
      </div>

      {/* ── Template Preview Dialog (Preview only — does NOT apply) ── */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-emerald-500" />
              {TEMPLATES.find(t => t.name === previewTemplate)?.label} Preview
            </DialogTitle>
            <DialogDescription>
              {TEMPLATES.find(t => t.name === previewTemplate)?.description}
              <span className="block mt-1 text-xs text-muted-foreground">
                Previewing only — this will not change your current template.
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center py-6">
            {previewTemplate && (
              <TemplateMobilePreview
                templateName={previewTemplate}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                fontFamily={selectedFont}
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setPreviewTemplate(null)} className="rounded-lg">
              Close
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-lg"
              disabled={currentTemplate === previewTemplate || !!applyingTemplate}
              onClick={() => {
                if (previewTemplate) {
                  applyTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }
              }}
            >
              {applyingTemplate ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {currentTemplate === previewTemplate ? 'Currently Applied' : 'Apply This Template'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
