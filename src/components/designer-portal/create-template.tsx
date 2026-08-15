'use client';

import React, { useState } from 'react';
import {
  ChevronLeft, ChevronRight, BookOpen, UtensilsCrossed, Palette,
  ImagePlus, Eye, Check, Loader2, Star, Layers, Briefcase,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuthStore, useAppStore } from '@/lib/store';
import { toast } from 'sonner';

// ─── Constants ─────────────────────────────────────────────────────
const CATEGORIES = ['Luxury', 'Minimal', 'Modern', 'Editorial', 'Classic', 'Creative'];
const RECOMMENDED_FOR = ['Restaurant', 'Hotel', 'Fashion', 'Retail', 'Café', 'Salon', 'Real Estate', 'Events', 'Services'];
const FONT_OPTIONS = ['Playfair Display', 'Cormorant Garamond', 'Lora', 'Merriweather', 'Montserrat', 'Raleway', 'Inter', 'DM Sans'];
const COVER_POSITIONS = ['Center', 'Top', 'Bottom', 'Left', 'Right'];
const COVER_SHAPES = ['Rectangle', 'Circle', 'Rounded Rectangle', 'Parallax'];
const BUTTON_STYLES = ['Solid', 'Outline', 'Ghost', 'Rounded', 'Pill'];
const OVERLAY_TYPES = ['None', 'Gradient Dark', 'Gradient Light', 'Solid Dark', 'Glass'];
const PATTERN_OPTIONS = ['None', 'Dots', 'Lines', 'Grid', 'Diagonal', 'Waves', 'Texture'];
const TAG_STYLES = ['Pill', 'Rectangle', 'Outline', 'Minimal'];
const DECO_ELEMENTS = ['Corner Ornaments', 'Dividers', 'Frame', 'Badge', 'Watermark', 'Sparkle'];

interface BookCoverConfig {
  bgColor: string;
  textColor: string;
  accentColor: string;
  titleFont: string;
  subtitleFont: string;
  coverImagePosition: string;
  coverImageShape: string;
  buttonStyle: string;
  overlayType: string;
  pattern: string;
  tagStyle: string;
  decorativeElements: string[];
}

interface MenuConfig {
  pageBgColor: string;
  cardStyle: string;
  layout: string;
  headingFont: string;
  bodyFont: string;
  primaryColor: string;
  accentColor: string;
  buttonStyle: string;
  showHeader: boolean;
  showFooter: boolean;
  headerStyle: string;
}

const defaultBookConfig: BookCoverConfig = {
  bgColor: '#1a1a2e', textColor: '#ffffff', accentColor: '#C9A84C',
  titleFont: 'Playfair Display', subtitleFont: 'Raleway',
  coverImagePosition: 'Center', coverImageShape: 'Rectangle',
  buttonStyle: 'Solid', overlayType: 'Gradient Dark', pattern: 'None',
  tagStyle: 'Pill', decorativeElements: [],
};

const defaultMenuConfig: MenuConfig = {
  pageBgColor: '#ffffff', cardStyle: 'Elevated', layout: 'List',
  headingFont: 'Playfair Display', bodyFont: 'Inter',
  primaryColor: '#1a1a2e', accentColor: '#C9A84C',
  buttonStyle: 'Solid', showHeader: true, showFooter: true, headerStyle: 'Centered',
};

// ─── Step Indicator ────────────────────────────────────────────────
function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className="flex shrink-0 items-center gap-2">
            <div className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${i <= current ? 'bg-charcoal text-white' : 'bg-slate-200 text-slate-500'}`}>
              {i < current ? <Check className="size-4" /> : i + 1}
            </div>
            <span className={`hidden text-sm sm:inline ${i <= current ? 'text-charcoal font-medium' : 'text-slate-400'}`}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`mx-1 h-px w-6 shrink-0 ${i < current ? 'bg-charcoal' : 'bg-slate-200'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────
export default function CreateTemplate() {
  const { token } = useAuthStore();
  const { navigate } = useAppStore();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Type
  const [templateType, setTemplateType] = useState<string>('');

  // Step 2: Details
  const [details, setDetails] = useState({ name: '', description: '', category: '', tags: '', designStyle: '', licenseType: 'standard', recommendedFor: [] as string[] });

  // Step 3: Configuration
  const [bookConfig, setBookConfig] = useState<BookCoverConfig>(defaultBookConfig);
  const [menuConfig, setMenuConfig] = useState<MenuConfig>(defaultMenuConfig);

  // Step 4: Images
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const steps = ['Type', 'Details', 'Configuration', 'Images', 'Review'];

  const toggleRecommended = (item: string) => {
    setDetails((p) => ({
      ...p,
      recommendedFor: p.recommendedFor.includes(item) ? p.recommendedFor.filter((x) => x !== item) : [...p.recommendedFor, item],
    }));
  };

  const toggleDecoElement = (item: string) => {
    setBookConfig((p) => ({
      ...p,
      decorativeElements: p.decorativeElements.includes(item) ? p.decorativeElements.filter((x) => x !== item) : [...p.decorativeElements, item],
    }));
  };

  const canProceed = () => {
    if (step === 0) return !!templateType;
    if (step === 1) return !!details.name && !!details.description;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const body: any = {
        templateType, name: details.name, description: details.description,
        category: details.category || null, tags: details.tags ? details.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        designStyle: details.designStyle || null, licenseType: details.licenseType,
        recommendedFor: details.recommendedFor, previewImages,
        templateConfiguration: templateType === 'book_cover' ? bookConfig : menuConfig,
      };
      const res = await fetch('/api/marketplace/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Template submitted for review!');
      navigate('#/designer-portal');
    } catch (err: any) {
      toast.error(err.message);
    } finally { setSubmitting(false); }
  };

  const ColorPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div className="flex items-center gap-3">
      <Label className="w-28 shrink-0 text-sm">{label}</Label>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="size-9 cursor-pointer rounded-md border border-slate-200" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-9 flex-1 font-mono text-xs" />
    </div>
  );

  const SelectField = ({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) => (
    <div className="flex items-center gap-3">
      <Label className="w-28 shrink-0 text-sm">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 flex-1"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('#/designer-portal')}><ChevronLeft className="size-5" /></Button>
        <div>
          <h2 className="text-2xl font-bold text-charcoal">Create Template</h2>
          <p className="text-sm text-slate-500">Design a new template for the marketplace</p>
        </div>
      </div>

      <StepIndicator steps={steps} current={step} />

      <Card>
        <CardContent className="p-6">

          {/* ─── Step 0: Template Type ─── */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="text-center mb-8">
                <h3 className="text-lg font-semibold text-charcoal">Choose Template Type</h3>
                <p className="text-sm text-slate-500">What kind of template are you creating?</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-lg mx-auto">
                {[
                  { type: 'book_cover', icon: BookOpen, label: 'Book Cover', desc: 'Design stunning book covers with customizable layouts' },
                  { type: 'menu', icon: UtensilsCrossed, label: 'Menu Template', desc: 'Create beautiful menu designs for restaurants and cafes' },
                ].map(({ type, icon: Icon, label, desc }) => (
                  <button key={type} onClick={() => setTemplateType(type)}
                    className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all ${templateType === type ? 'border-charcoal bg-champagne/20 shadow-md' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <div className={`flex size-14 items-center justify-center rounded-xl ${templateType === type ? 'bg-charcoal' : 'bg-slate-100'}`}>
                      <Icon className={`size-7 ${templateType === type ? 'text-gold' : 'text-slate-500'}`} />
                    </div>
                    <div><p className="font-semibold text-charcoal">{label}</p><p className="mt-1 text-xs text-slate-500">{desc}</p></div>
                    {templateType === type && <div className="absolute top-3 right-3"><Badge className="bg-charcoal text-white text-[10px]">Selected</Badge></div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Step 1: Details ─── */}
          {step === 1 && (
            <div className="space-y-5 max-w-2xl mx-auto">
              <div className="text-center mb-2">
                <h3 className="text-lg font-semibold text-charcoal">Template Details</h3>
                <p className="text-sm text-slate-500">Provide the basic information about your template</p>
              </div>
              <div className="space-y-4">
                <div><Label>Template Name *</Label><Input placeholder="e.g. Elegant Noir" value={details.name} onChange={(e) => setDetails((p) => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>Description *</Label><Textarea placeholder="Describe your template..." rows={3} value={details.description} onChange={(e) => setDetails((p) => ({ ...p, description: e.target.value }))} /></div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div><Label>Category</Label><Select value={details.category} onValueChange={(v) => setDetails((p) => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select></div>
                  <div><Label>License Type</Label><Select value={details.licenseType} onValueChange={(v) => setDetails((p) => ({ ...p, licenseType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="standard">Standard</SelectItem><SelectItem value="extended">Extended</SelectItem></SelectContent>
                  </Select></div>
                </div>
                <div><Label>Tags (comma-separated)</Label><Input placeholder="luxury, dark, elegant" value={details.tags} onChange={(e) => setDetails((p) => ({ ...p, tags: e.target.value }))} /></div>
                <div><Label>Design Style</Label><Input placeholder="e.g. Minimalist Dark" value={details.designStyle} onChange={(e) => setDetails((p) => ({ ...p, designStyle: e.target.value }))} /></div>
                <div>
                  <Label className="mb-2 block">Recommended For</Label>
                  <div className="flex flex-wrap gap-2">
                    {RECOMMENDED_FOR.map((item) => (
                      <Badge key={item} variant={details.recommendedFor.includes(item) ? 'default' : 'outline'}
                        className={`cursor-pointer transition-colors ${details.recommendedFor.includes(item) ? 'bg-charcoal text-white hover:bg-charcoal-light' : 'border-gold/20 text-slate-600 hover:bg-gold/10'}`}
                        onClick={() => toggleRecommended(item)}>{item}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 2: Configuration ─── */}
          {step === 2 && (
            <div className="space-y-5 max-w-2xl mx-auto">
              <div className="text-center mb-2">
                <h3 className="text-lg font-semibold text-charcoal">Template Configuration</h3>
                <p className="text-sm text-slate-500">{templateType === 'book_cover' ? 'Configure your book cover design settings' : 'Configure your menu design settings'}</p>
              </div>

              {templateType === 'book_cover' && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Colors</p>
                  <div className="space-y-3 rounded-lg border p-4 bg-slate-50/50">
                    <ColorPicker label="Background" value={bookConfig.bgColor} onChange={(v) => setBookConfig((p) => ({ ...p, bgColor: v }))} />
                    <ColorPicker label="Text Color" value={bookConfig.textColor} onChange={(v) => setBookConfig((p) => ({ ...p, textColor: v }))} />
                    <ColorPicker label="Accent" value={bookConfig.accentColor} onChange={(v) => setBookConfig((p) => ({ ...p, accentColor: v }))} />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Typography</p>
                  <div className="space-y-3 rounded-lg border p-4 bg-slate-50/50">
                    <SelectField label="Title Font" value={bookConfig.titleFont} options={FONT_OPTIONS} onChange={(v) => setBookConfig((p) => ({ ...p, titleFont: v }))} />
                    <SelectField label="Subtitle Font" value={bookConfig.subtitleFont} options={FONT_OPTIONS} onChange={(v) => setBookConfig((p) => ({ ...p, subtitleFont: v }))} />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cover Image</p>
                  <div className="space-y-3 rounded-lg border p-4 bg-slate-50/50">
                    <SelectField label="Position" value={bookConfig.coverImagePosition} options={COVER_POSITIONS} onChange={(v) => setBookConfig((p) => ({ ...p, coverImagePosition: v }))} />
                    <SelectField label="Shape" value={bookConfig.coverImageShape} options={COVER_SHAPES} onChange={(v) => setBookConfig((p) => ({ ...p, coverImageShape: v }))} />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Style</p>
                  <div className="space-y-3 rounded-lg border p-4 bg-slate-50/50">
                    <SelectField label="Button Style" value={bookConfig.buttonStyle} options={BUTTON_STYLES} onChange={(v) => setBookConfig((p) => ({ ...p, buttonStyle: v }))} />
                    <SelectField label="Overlay" value={bookConfig.overlayType} options={OVERLAY_TYPES} onChange={(v) => setBookConfig((p) => ({ ...p, overlayType: v }))} />
                    <SelectField label="Pattern" value={bookConfig.pattern} options={PATTERN_OPTIONS} onChange={(v) => setBookConfig((p) => ({ ...p, pattern: v }))} />
                    <SelectField label="Tag Style" value={bookConfig.tagStyle} options={TAG_STYLES} onChange={(v) => setBookConfig((p) => ({ ...p, tagStyle: v }))} />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Decorative Elements</p>
                  <div className="flex flex-wrap gap-2 rounded-lg border p-4 bg-slate-50/50">
                    {DECO_ELEMENTS.map((item) => (
                      <Badge key={item} variant={bookConfig.decorativeElements.includes(item) ? 'default' : 'outline'}
                        className={`cursor-pointer transition-colors ${bookConfig.decorativeElements.includes(item) ? 'bg-charcoal text-white hover:bg-charcoal-light' : 'border-gold/20 text-slate-600 hover:bg-gold/10'}`}
                        onClick={() => toggleDecoElement(item)}>{item}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {templateType === 'menu' && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Colors</p>
                  <div className="space-y-3 rounded-lg border p-4 bg-slate-50/50">
                    <ColorPicker label="Page Background" value={menuConfig.pageBgColor} onChange={(v) => setMenuConfig((p) => ({ ...p, pageBgColor: v }))} />
                    <ColorPicker label="Primary" value={menuConfig.primaryColor} onChange={(v) => setMenuConfig((p) => ({ ...p, primaryColor: v }))} />
                    <ColorPicker label="Accent" value={menuConfig.accentColor} onChange={(v) => setMenuConfig((p) => ({ ...p, accentColor: v }))} />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Layout</p>
                  <div className="space-y-3 rounded-lg border p-4 bg-slate-50/50">
                    <SelectField label="Card Style" value={menuConfig.cardStyle} options={['Elevated', 'Flat', 'Bordered', 'Glass', 'Shadow']} onChange={(v) => setMenuConfig((p) => ({ ...p, cardStyle: v }))} />
                    <SelectField label="Layout" value={menuConfig.layout} options={['List', 'Grid', 'Masonry', 'Compact']} onChange={(v) => setMenuConfig((p) => ({ ...p, layout: v }))} />
                    <SelectField label="Button Style" value={menuConfig.buttonStyle} options={BUTTON_STYLES} onChange={(v) => setMenuConfig((p) => ({ ...p, buttonStyle: v }))} />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Typography</p>
                  <div className="space-y-3 rounded-lg border p-4 bg-slate-50/50">
                    <SelectField label="Heading Font" value={menuConfig.headingFont} options={FONT_OPTIONS} onChange={(v) => setMenuConfig((p) => ({ ...p, headingFont: v }))} />
                    <SelectField label="Body Font" value={menuConfig.bodyFont} options={FONT_OPTIONS} onChange={(v) => setMenuConfig((p) => ({ ...p, bodyFont: v }))} />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Header & Footer</p>
                  <div className="space-y-3 rounded-lg border p-4 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <Label className="w-28 shrink-0 text-sm">Show Header</Label>
                      <Checkbox checked={menuConfig.showHeader} onCheckedChange={(v) => setMenuConfig((p) => ({ ...p, showHeader: !!v }))} />
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="w-28 shrink-0 text-sm">Show Footer</Label>
                      <Checkbox checked={menuConfig.showFooter} onCheckedChange={(v) => setMenuConfig((p) => ({ ...p, showFooter: !!v }))} />
                    </div>
                    <SelectField label="Header Style" value={menuConfig.headerStyle} options={['Centered', 'Left Aligned', 'Full Width', 'Minimal']} onChange={(v) => setMenuConfig((p) => ({ ...p, headerStyle: v }))} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Step 3: Preview Images ─── */}
          {step === 3 && (
            <div className="space-y-5 max-w-2xl mx-auto">
              <div className="text-center mb-2">
                <h3 className="text-lg font-semibold text-charcoal">Preview Images</h3>
                <p className="text-sm text-slate-500">Upload up to 5 preview images of your template</p>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label>Image URL</Label>
                  <div className="flex gap-2">
                    <Input placeholder="https://example.com/image.png" className="flex-1" id="img-url-input" />
                    <Button variant="outline" className="border-gold/20 text-charcoal hover:bg-gold/10 shrink-0" disabled={previewImages.length >= 5}
                      onClick={() => {
                        const input = document.getElementById('img-url-input') as HTMLInputElement;
                        if (input?.value) { setPreviewImages((p) => [...p, input.value]); input.value = ''; }
                      }}>
                      <ImagePlus className="size-4" />Add
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-slate-400">Enter image URLs (up to 5). First image will be the primary preview.</p>
                {previewImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {previewImages.map((url, i) => (
                      <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border bg-slate-100">
                        <img src={url} alt={`Preview ${i + 1}`} className="size-full object-cover" />
                        <button onClick={() => setPreviewImages((p) => p.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100">
                          ✕
                        </button>
                        {i === 0 && <Badge className="absolute bottom-1 left-1 bg-charcoal text-white text-[10px]">Primary</Badge>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Step 4: Review & Submit ─── */}
          {step === 4 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="text-center mb-2">
                <h3 className="text-lg font-semibold text-charcoal">Review & Submit</h3>
                <p className="text-sm text-slate-500">Review your template before submitting for review</p>
              </div>

              {/* Mockup Preview */}
              <div className="overflow-hidden rounded-xl border bg-slate-50">
                <div className="flex items-center gap-2 border-b bg-white px-4 py-2">
                  <div className="size-3 rounded-full bg-red-400" /><div className="size-3 rounded-full bg-amber-400" /><div className="size-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs text-slate-400">Preview</span>
                </div>
                <div className="relative flex items-center justify-center p-8 min-h-48" style={{ background: templateType === 'book_cover' ? bookConfig.bgColor : menuConfig.pageBgColor }}>
                  {templateType === 'book_cover' ? (
                    <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-lg p-6 shadow-lg" style={{ background: bookConfig.bgColor, color: bookConfig.textColor }}>
                      <div className="h-32 w-full rounded bg-white/10" />
                      <h4 className="text-center text-lg font-bold" style={{ fontFamily: bookConfig.titleFont }}>{details.name || 'Template Name'}</h4>
                      <p className="text-center text-xs opacity-60" style={{ fontFamily: bookConfig.subtitleFont }}>{details.description?.substring(0, 60) || 'Your subtitle here'}</p>
                      <div className="mt-2 rounded-full px-4 py-1.5 text-xs font-medium" style={{ background: bookConfig.accentColor, color: bookConfig.bgColor }}>Preview Button</div>
                    </div>
                  ) : (
                    <div className="w-full max-w-sm space-y-3">
                      <div className="rounded-lg border p-3 text-center" style={{ background: menuConfig.pageBgColor }}>
                        <h4 className="text-lg font-bold" style={{ fontFamily: menuConfig.headingFont, color: menuConfig.primaryColor }}>{details.name || 'Menu Title'}</h4>
                      </div>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg border p-3" style={{ background: menuConfig.pageBgColor }}>
                          <div className="size-10 shrink-0 rounded bg-slate-200" />
                          <div className="flex-1 space-y-1">
                            <div className="h-3 w-24 rounded bg-slate-200" />
                            <div className="h-2 w-16 rounded bg-slate-100" />
                          </div>
                          <span className="text-xs font-medium" style={{ color: menuConfig.accentColor }}>₦{(i * 500 + 1000).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-lg border p-5 space-y-3">
                <h4 className="font-semibold text-charcoal">Template Summary</h4>
                <Separator />
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-slate-500">Type</span><span className="font-medium text-charcoal">{templateType?.replace('_', ' ')}</span>
                  <span className="text-slate-500">Name</span><span className="font-medium text-charcoal">{details.name}</span>
                  <span className="text-slate-500">Category</span><span className="font-medium text-charcoal">{details.category || '—'}</span>
                  <span className="text-slate-500">License</span><span className="font-medium text-charcoal capitalize">{details.licenseType}</span>
                  <span className="text-slate-500">Style</span><span className="font-medium text-charcoal">{details.designStyle || '—'}</span>
                  <span className="text-slate-500">Tags</span><span className="font-medium text-charcoal">{details.tags || '—'}</span>
                  <span className="text-slate-500">Recommended For</span><span className="font-medium text-charcoal">{details.recommendedFor.length > 0 ? details.recommendedFor.join(', ') : '—'}</span>
                  <span className="text-slate-500">Preview Images</span><span className="font-medium text-charcoal">{previewImages.length} image(s)</span>
                </div>
              </div>
            </div>
          )}

          {/* ─── Navigation ─── */}
          <Separator className="my-6" />
          <div className="flex items-center justify-between">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)} className="border-gold/20 text-charcoal hover:bg-gold/10">
              <ChevronLeft className="size-4" />Back
            </Button>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              Step {step + 1} of {steps.length}
            </div>
            {step < steps.length - 1 ? (
              <Button disabled={!canProceed()} onClick={() => setStep((s) => s + 1)} className="bg-charcoal hover:bg-charcoal-light text-white">
                Next<ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button disabled={submitting} onClick={handleSubmit} className="bg-charcoal hover:bg-charcoal-light text-white">
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
