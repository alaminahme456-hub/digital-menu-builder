'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Palette, Eye, Check, Loader2, Type, Paintbrush,
  Smartphone, X
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

// Template style configs for CSS previews
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

// Mini template preview component
function TemplateMiniPreview({ templateName, width = 200, height = 260 }: { templateName: string; width?: number; height?: number }) {
  const style = TEMPLATE_STYLES[templateName] || TEMPLATE_STYLES.modern;
  const isGradient = style.headerBg.includes('gradient');

  const mockItems = [
    { name: 'Grilled Chicken', price: '₦4,500' },
    { name: 'Jollof Rice', price: '₦3,000' },
    { name: 'Caesar Salad', price: '₦2,500' },
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
              <div
                key={i}
                style={{
                  background: style.cardBg,
                  borderRadius: style.borderRadius,
                  padding: '4px',
                }}
              >
                <div style={{ color: style.text, fontWeight: 600, fontSize: '6px' }}>{item.name}</div>
                <div style={{ color: style.accent, fontWeight: 700, fontSize: '7px', marginTop: '2px' }}>{item.price}</div>
              </div>
            ))}
          </div>
        ) : style.layout === 'cards' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {mockItems.map((item, i) => (
              <div
                key={i}
                style={{
                  background: style.cardBg,
                  borderRadius: style.borderRadius,
                  padding: '5px 6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ color: style.text, fontWeight: 600, fontSize: '6px' }}>{item.name}</div>
                <div style={{ color: style.accent, fontWeight: 700, fontSize: '7px' }}>{item.price}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {mockItems.map((item, i) => (
              <div
                key={i}
                style={{
                  borderBottom: `0.5px solid ${style.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  paddingBottom: '3px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
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
          color: style.subtext,
          fontSize: '6px',
          fontWeight: 500,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.3px',
        }}>
          Drinks & Desserts ▸
        </div>
      </div>
    </div>
  );
}

// Full mobile preview for dialog
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
        { name: 'Grilled Chicken', description: 'Crispy chicken with vegetables', price: '₦4,500' },
        { name: 'Jollof Rice', description: 'Classic Nigerian jollof rice', price: '₦3,000' },
      ],
    },
    {
      name: 'Drinks',
      items: [
        { name: 'Chapman', description: 'Classic Nigerian cocktail', price: '₦1,500' },
        { name: 'Fresh Juice', description: 'Freshly squeezed orange juice', price: '₦1,000' },
      ],
    },
  ];

  return (
    <div
      className="mx-auto"
      style={{
        width: '280px',
        maxWidth: '100%',
        minHeight: '480px',
        background: style.bg,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        fontFamily: style.font,
        fontSize: '12px',
        lineHeight: 1.5,
      }}
    >
      {/* Phone notch area */}
      <div className="flex justify-center pt-2 pb-1" style={{ background: isGradient ? undefined : style.headerBg, backgroundImage: isGradient ? style.headerBg : undefined }}>
        <div className="w-16 h-1 rounded-full" style={{ background: style.dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)' }} />
      </div>

      {/* Header */}
      <div
        style={{
          background: isGradient ? undefined : style.headerBg,
          backgroundImage: isGradient ? style.headerBg : undefined,
          padding: '16px 20px 20px',
        }}
      >
        <div style={{ color: style.headerText, fontWeight: 700, fontSize: '18px', letterSpacing: '1px' }}>
          MY RESTAURANT
        </div>
        <div style={{ color: style.headerText, opacity: 0.8, fontSize: '11px', marginTop: '2px' }}>
          Delicious Food, Served Fresh
        </div>
      </div>

      {/* Menu content */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {mockCategories.map((cat) => (
          <div key={cat.name}>
            <div style={{
              color: style.accent,
              fontWeight: 700,
              fontSize: '11px',
              textTransform: 'uppercase' as const,
              letterSpacing: '1px',
              borderBottom: `2px solid ${style.accent}`,
              paddingBottom: '4px',
              marginBottom: '10px',
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

export default function Templates() {
  const { token } = useAuthStore();
  const { currentBusiness } = useAppStore();

  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [secondaryColor, setSecondaryColor] = useState('#f1f5f9');
  const [selectedFont, setSelectedFont] = useState('inter');

  // Sync with current business data
  useEffect(() => {
    if (currentBusiness) {
      setPrimaryColor(currentBusiness.primaryColor || '#10b981');
      setSecondaryColor(currentBusiness.secondaryColor || '#f1f5f9');
      setSelectedFont(currentBusiness.fontFamily || 'inter');
    }
  }, [currentBusiness]);

  const currentTemplate = currentBusiness?.templateName || 'modern';

  const applyTemplate = async (templateName: string) => {
    if (!currentBusiness?.id || !token) return;

    setApplying(true);
    try {
      const res = await fetch(`/api/businesses/${currentBusiness.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateName }),
      });

      if (res.ok) {
        toast.success(`"${TEMPLATES.find(t => t.name === templateName)?.label}" template applied!`);
      } else {
        toast.error('Failed to apply template');
      }
    } catch {
      toast.error('Failed to apply template');
    } finally {
      setApplying(false);
      setPreviewTemplate(null);
    }
  };

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
        body: JSON.stringify({
          primaryColor,
          secondaryColor,
          fontFamily: selectedFont,
        }),
      });

      if (res.ok) {
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
      {/* Template Gallery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-emerald-500" />
            Design Templates
          </CardTitle>
          <CardDescription>
            Choose a template for your menu. Click Preview to see how it looks, then Apply to activate it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {TEMPLATES.map((template) => {
              const isActive = currentTemplate === template.name;
              return (
                <div
                  key={template.name}
                  className={`group relative rounded-xl border-2 p-3 transition-all duration-200 hover:shadow-lg cursor-pointer ${
                    isActive
                      ? 'border-emerald-500 shadow-emerald-500/10 bg-emerald-50/50 dark:bg-emerald-950/10'
                      : 'border-border hover:border-emerald-300'
                  }`}
                >
                  {/* Active badge */}
                  {isActive && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-emerald-500 text-white border-0 shadow-sm gap-1 px-2.5">
                        <Check className="h-3 w-3" />
                        Active
                      </Badge>
                    </div>
                  )}

                  {/* Preview */}
                  <div className="flex justify-center mb-3">
                    <TemplateMiniPreview templateName={template.name} width={180} height={230} />
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <div>
                      <h3 className="text-sm font-semibold text-center">{template.label}</h3>
                      <p className="text-xs text-muted-foreground text-center mt-0.5 line-clamp-2">
                        {template.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTemplate(template.name);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className={`flex-1 h-8 text-xs ${
                          isActive
                            ? 'bg-muted text-muted-foreground hover:bg-muted'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                        disabled={isActive || applying}
                        onClick={(e) => {
                          e.stopPropagation();
                          applyTemplate(template.name);
                        }}
                      >
                        {applying && previewTemplate === template.name ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isActive ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : null}
                        {isActive ? 'Applied' : 'Apply'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Customization Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5 text-emerald-500" />
            Customize Design
          </CardTitle>
          <CardDescription>
            Fine-tune your menu&apos;s colors and typography.
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
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

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-emerald-500" />
              {TEMPLATES.find(t => t.name === previewTemplate)?.label} Preview
            </DialogTitle>
            <DialogDescription>
              {TEMPLATES.find(t => t.name === previewTemplate)?.description}
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
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Close
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              disabled={currentTemplate === previewTemplate || applying}
              onClick={() => previewTemplate && applyTemplate(previewTemplate)}
            >
              {applying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Apply This Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
