'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Palette, Plus, X, Loader2, ImageIcon, Code2, ArrowLeft, Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { useAuthStore, useAppStore } from '@/lib/store';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  'Menu Covers', 'Menu Templates', 'Food Menus', 'Drinks Menus',
  'QR Menu Designs', 'Promotional Menu Designs',
];

const DESIGN_STYLES = ['modern', 'classic', 'luxury', 'minimal', 'colorful', 'elegant'];

const RECOMMENDED_OPTIONS = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cafe', label: 'Café' },
  { value: 'bar', label: 'Bar' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'food_truck', label: 'Food Truck' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'pizzeria', label: 'Pizzeria' },
  { value: 'fast_food', label: 'Fast Food' },
  { value: 'catering', label: 'Catering' },
];

const buildDefaultConfig = (type: string) => {
  if (type === 'book_cover') {
    return JSON.stringify({
      layout: 'centered',
      fontFamily: 'Playfair Display',
      colors: { primary: '#1a1a1a', accent: '#c9a96e', background: '#faf8f5' },
      showLogo: true, showTagline: true, showContact: false,
    }, null, 2);
  }
  return JSON.stringify({
    layout: 'single_page',
    fontFamily: 'Inter',
    colors: { primary: '#1a1a1a', secondary: '#c9a96e', background: '#faf8f5' },
    sections: [
      { title: 'Starters', items: [] },
      { title: 'Mains', items: [] },
      { title: 'Desserts', items: [] },
    ],
    showPrices: true, showDescriptions: true,
  }, null, 2);
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DesignerCreateDesign() {
  const { token } = useAuthStore();
  const { navigate } = useAppStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [templateType, setTemplateType] = useState('menu');
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [designStyle, setDesignStyle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [licenseType, setLicenseType] = useState('free');
  const [recommendedFor, setRecommendedFor] = useState<string[]>([]);
  const [config, setConfig] = useState(buildDefaultConfig('menu'));
  const [submitting, setSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => { setConfig(buildDefaultConfig(templateType)); }, [templateType]);

  /* ---- helpers ---- */
  const addImage = useCallback(() => {
    const url = imageUrl.trim();
    if (!url) return;
    if (previewImages.length >= 5) { toast.error('Maximum 5 preview images allowed'); return; }
    if (previewImages.includes(url)) { toast.error('Image URL already added'); return; }
    setPreviewImages((p) => [...p, url]);
    setImageUrl('');
  }, [imageUrl, previewImages]);

  const removeImage = useCallback((idx: number) => {
    setPreviewImages((p) => p.filter((_, i) => i !== idx));
  }, []);

  const addTag = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const tag = tagInput.trim().toLowerCase();
    if (!tag) return;
    if (tags.includes(tag)) { toast.error('Tag already added'); return; }
    setTags((p) => [...p, tag]);
    setTagInput('');
  }, [tagInput, tags]);

  const removeTag = useCallback((tag: string) => {
    setTags((p) => p.filter((t) => t !== tag));
  }, []);

  const toggleRecommended = useCallback((value: string) => {
    setRecommendedFor((p) => p.includes(value) ? p.filter((v) => v !== value) : [...p, value]);
  }, []);

  const canSubmit = !!(name.trim() && category && templateType && designStyle);

  /* ---- submit ---- */
  const handleSubmit = async () => {
    if (!canSubmit || !token) return;
    let parsedConfig: Record<string, unknown>;
    try { parsedConfig = JSON.parse(config); }
    catch { toast.error('Invalid JSON in Template Configuration'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/marketplace/templates', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType, name: name.trim(), description: description.trim(),
          category, tags, previewImages, templateConfiguration: parsedConfig,
          recommendedFor, designStyle, licenseType,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(err.message || `Error ${res.status}`);
      }
      toast.success('Design created successfully!');
      navigate('#/designer/my-designs');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setSubmitting(false); }
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="size-9 text-charcoal/50 hover:text-charcoal" onClick={() => navigate('#/designer/my-designs')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex size-10 items-center justify-center rounded-xl bg-gold/10">
          <Palette className="size-5 text-gold-dark" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-charcoal">Create Design</h1>
          <p className="text-sm text-charcoal/50">Add a new template to the marketplace</p>
        </div>
      </div>

      {/* 2-column: form left, preview right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* ========== LEFT: Form ========== */}
        <div className="space-y-5">
          <Card>
            <CardContent className="space-y-5 pt-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="tmpl-name">Template Name <span className="text-red-500">*</span></Label>
                <Input id="tmpl-name" placeholder="e.g. Elegant Brunch Menu" value={name} onChange={(e) => setName(e.target.value)} className="border-charcoal/10 focus-visible:ring-gold/30" />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="tmpl-desc">Description</Label>
                <Textarea id="tmpl-desc" rows={3} placeholder="Briefly describe your template design..." value={description} onChange={(e) => setDescription(e.target.value)} className="border-charcoal/10 focus-visible:ring-gold/30 resize-none" />
              </div>

              {/* Category + Template Type */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category <span className="text-red-500">*</span></Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full border-charcoal/10"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Template Type <span className="text-red-500">*</span></Label>
                  <Select value={templateType} onValueChange={setTemplateType}>
                    <SelectTrigger className="w-full border-charcoal/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="menu">Menu</SelectItem>
                      <SelectItem value="book_cover">Book Cover</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Design Style + License Type */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Design Style <span className="text-red-500">*</span></Label>
                  <Select value={designStyle} onValueChange={setDesignStyle}>
                    <SelectTrigger className="w-full border-charcoal/10"><SelectValue placeholder="Select style" /></SelectTrigger>
                    <SelectContent>{DESIGN_STYLES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>License Type</Label>
                  <Select value={licenseType} onValueChange={setLicenseType}>
                    <SelectTrigger className="w-full border-charcoal/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Preview Images */}
              <div className="space-y-2">
                <Label>Preview Images ({previewImages.length}/5)</Label>
                <div className="flex gap-2">
                  <Input placeholder="Paste image URL and click Add" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImage(); } }} className="flex-1 border-charcoal/10 focus-visible:ring-gold/30" />
                  <Button type="button" variant="outline" onClick={addImage} className="border-gold/30 text-gold-dark hover:bg-gold/10"><Plus className="size-4" />Add</Button>
                </div>
                {previewImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {previewImages.map((img, idx) => (
                      <div key={idx} className="group relative size-20 overflow-hidden rounded-lg border border-charcoal/10">
                        <img src={img} alt={`Preview ${idx + 1}`} className="size-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <button type="button" onClick={() => removeImage(idx)} className="absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-charcoal/60 text-white opacity-0 transition-opacity group-hover:opacity-100"><X className="size-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <Input placeholder="Type a tag and press Enter" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} className="border-charcoal/10 focus-visible:ring-gold/30" />
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="gap-1 border-gold/30 bg-gold/5 text-gold-dark cursor-pointer hover:bg-gold/10" onClick={() => removeTag(tag)}>{tag}<X className="size-3" /></Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Recommended For */}
              <div className="space-y-3">
                <Label>Recommended For</Label>
                <div className="grid grid-cols-3 gap-x-4 gap-y-2.5">
                  {RECOMMENDED_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-charcoal/70">
                      <Checkbox checked={recommendedFor.includes(opt.value)} onCheckedChange={() => toggleRecommended(opt.value)} className="data-[state=checked]:bg-gold-dark data-[state=checked]:border-gold-dark" />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Template Configuration (Advanced) */}
              <div className="space-y-2">
                <button type="button" className="flex items-center gap-2 text-sm font-medium text-charcoal/70 hover:text-charcoal transition-colors" onClick={() => setShowAdvanced(!showAdvanced)}>
                  <Code2 className="size-4" />
                  Template Configuration
                  <span className="text-xs text-charcoal/40">(Advanced)</span>
                  <span className={`text-charcoal/30 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {showAdvanced && (
                  <Textarea rows={10} value={config} onChange={(e) => setConfig(e.target.value)} className="font-mono text-xs border-charcoal/10 focus-visible:ring-gold/30 resize-y" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" className="border-charcoal/10 text-charcoal/60 hover:text-charcoal" onClick={() => navigate('#/designer/my-designs')}>Cancel</Button>
            <Button disabled={!canSubmit || submitting} onClick={handleSubmit} className="bg-gold-dark hover:bg-gold-dark/90 text-white min-w-[140px]">
              {submitting ? (<><Loader2 className="size-4 animate-spin" />Creating…</>) : (<><Sparkles className="size-4" />Create Design</>)}
            </Button>
          </div>
        </div>

        {/* ========== RIGHT: Live Preview ========== */}
        <div className="lg:sticky lg:top-6 lg:self-start space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-charcoal/40">Marketplace Preview</p>
          <Card className="overflow-hidden">
            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-champagne/40 to-ivory">
              {previewImages[0] ? (
                <img src={previewImages[0]} alt={name || 'Preview'} className="size-full object-cover" />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-2">
                  <ImageIcon className="size-10 text-charcoal/15" />
                  <span className="text-xs text-charcoal/30">No preview image</span>
                </div>
              )}
              <div className="absolute top-2.5 left-2.5">
                <Badge className="bg-gold-dark text-white border-0 text-[11px]">{licenseType === 'premium' ? '★ Premium' : 'Free'}</Badge>
              </div>
            </div>
            <CardContent className="space-y-3 pt-4 pb-5">
              <h3 className="text-sm font-semibold text-charcoal truncate">{name.trim() || 'Untitled Design'}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[11px] border-charcoal/10 text-charcoal/60">{category || 'Uncategorized'}</Badge>
                <Badge variant="outline" className="text-[11px] border-gold/30 bg-gold/10 text-gold-dark capitalize">{templateType.replace('_', ' ')}</Badge>
                {designStyle && <Badge variant="outline" className="text-[11px] border-charcoal/10 text-charcoal/50 capitalize">{designStyle}</Badge>}
              </div>
              {description.trim() && <p className="text-xs text-charcoal/50 line-clamp-2">{description.trim()}</p>}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.slice(0, 4).map((t) => <span key={t} className="rounded-full bg-charcoal/5 px-2 py-0.5 text-[10px] text-charcoal/50">{t}</span>)}
                  {tags.length > 4 && <span className="text-[10px] text-charcoal/40">+{tags.length - 4}</span>}
                </div>
              )}
              {recommendedFor.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {recommendedFor.slice(0, 3).map((v) => <span key={v} className="rounded bg-ivory px-1.5 py-0.5 text-[10px] text-charcoal/50 capitalize">{v.replace('_', ' ')}</span>)}
                  {recommendedFor.length > 3 && <span className="text-[10px] text-charcoal/40">+{recommendedFor.length - 3}</span>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
