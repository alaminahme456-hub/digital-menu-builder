'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  Camera, Upload, Loader2, CheckCircle2, Circle,
  Pencil, Trash2, Plus, Sparkles, ArrowRight,
  BrainCircuit, ChevronRight, ScanLine
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuthStore, useAppStore } from '@/lib/store';
import { formatPrice } from '@/lib/auth';
import { toast } from 'sonner';

interface ScannedItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

type Step = 'upload' | 'scanning' | 'review' | 'save';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_IMAGE_EXTENSIONS = '.jpg,.jpeg,.png,.webp';

const STEPS = [
  { key: 'upload', label: 'Upload', icon: Camera },
  { key: 'scanning', label: 'Scanning', icon: BrainCircuit },
  { key: 'review', label: 'Review', icon: Pencil },
  { key: 'save', label: 'Save', icon: CheckCircle2 },
] as const;

export default function AIScanner() {
  const { token } = useAuthStore();
  const { currentBusiness, navigate } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentStepIndex = STEPS.findIndex(s => s.key === step);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, []);

  const processFile = (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WEBP image.');
      return;
    }
    if (!currentBusiness?.id || !token) {
      toast.error('Please select a business first.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setUploadedImage(imageData);
      startScan(imageData);
    };
    reader.readAsDataURL(file);
  };

  const startScan = async (imageData: string) => {
    setStep('scanning');
    setScanProgress(0);

    // Simulate scanning progress
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 12 + 3;
      });
    }, 300);

    try {
      const res = await fetch('/api/menu/scan', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: currentBusiness!.id,
          imageData,
        }),
      });

      clearInterval(progressInterval);
      setScanProgress(100);

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Scanning failed');
        setStep('upload');
        return;
      }

      // Wait a moment for progress animation to complete
      await new Promise(resolve => setTimeout(resolve, 400));

      const scannedItems: ScannedItem[] = data.items.map((item: { name: string; description: string; price: number; category: string }, index: number) => ({
        id: `scan-${Date.now()}-${index}`,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
      }));

      const extractedCategories = [...new Set(data.items.map((item: { category: string }) => item.category))];

      setItems(scannedItems);
      setCategories(extractedCategories);
      setStep('review');
    } catch {
      clearInterval(progressInterval);
      setError('Failed to scan menu. Please try again.');
      setStep('upload');
    }
  };

  const updateItem = (id: string, field: keyof ScannedItem, value: string | number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        // If category changed and is new, add to categories list
        if (field === 'category' && typeof value === 'string' && !categories.includes(value)) {
          setCategories(prev => [...prev, value]);
        }
        return updated;
      })
    );
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const addItem = () => {
    const newItem: ScannedItem = {
      id: `manual-${Date.now()}`,
      name: '',
      description: '',
      price: 0,
      category: categories[0] || 'Uncategorized',
    };
    setItems(prev => [...prev, newItem]);
  };

  const addNewCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      toast.error('Category already exists');
      return;
    }
    setCategories(prev => [...prev, trimmed]);
    setNewCategory('');
    setShowNewCategory(false);
    toast.success(`Category "${trimmed}" added`);
  };

  const handleSave = async () => {
    if (!currentBusiness?.id || !token) return;

    const validItems = items.filter(item => item.name.trim());
    if (validItems.length === 0) {
      toast.error('No valid items to save');
      return;
    }

    setSaving(true);
    try {
      // Create categories and collect their IDs
      const categoryMap: Record<string, string> = {};

      for (const cat of categories) {
        const itemsInCategory = validItems.filter(i => i.category === cat);
        if (itemsInCategory.length === 0) continue;

        const res = await fetch('/api/menu/categories', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ businessId: currentBusiness.id, name: cat }),
        });

        if (res.ok) {
          const data = await res.json();
          categoryMap[cat] = data.category.id;
        }
      }

      // Create menu items
      for (const item of validItems) {
        const categoryId = categoryMap[item.category];
        if (!categoryId) continue;

        await fetch('/api/menu/items', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessId: currentBusiness.id,
            categoryId,
            name: item.name,
            description: item.description,
            price: item.price,
          }),
        });
      }

      setStep('save');
      toast.success('Menu items saved successfully!');
    } catch {
      toast.error('Failed to save menu items. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const goToMenuManager = () => {
    navigate('#/menu-manager');
  };

  const resetScanner = () => {
    setStep('upload');
    setScanProgress(0);
    setItems([]);
    setCategories([]);
    setUploadedImage(null);
    setError(null);
  };

  if (!currentBusiness) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Camera className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Please select a business first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {STEPS.map((s, index) => {
              const Icon = s.icon;
              const isActive = s.key === step;
              const isCompleted = index < currentStepIndex;
              return (
                <React.Fragment key={s.key}>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                        isActive
                          ? 'border-emerald-500 bg-ivory0 text-white'
                          : isCompleted
                          ? 'border-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 text-charcoal dark:text-emerald-400'
                          : 'border-muted-foreground/25 text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isActive
                          ? 'text-charcoal dark:text-emerald-400'
                          : isCompleted
                          ? 'text-charcoal dark:text-emerald-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors duration-300 ${
                        index < currentStepIndex ? 'bg-ivory0' : 'bg-muted-foreground/15'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-emerald-500" />
              Upload Menu Photo
            </CardTitle>
            <CardDescription>
              Take a photo of your physical menu or upload an image. Our AI will read and extract all menu items.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            <div
              className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer ${
                dragOver
                  ? 'border-emerald-500 bg-ivory dark:bg-emerald-950/20'
                  : 'border-muted-foreground/25 hover:border-emerald-400 hover:bg-muted/50'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragOver(false);
              }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_EXTENSIONS}
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="space-y-4">
                <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Camera className="h-10 w-10 text-charcoal dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-base font-semibold">
                    {dragOver ? 'Drop your menu photo here' : 'Take a photo of your physical menu'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or <span className="text-charcoal dark:text-emerald-400 font-medium underline">browse files</span>
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}>
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supports JPG, PNG, WEBP • Max 10MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Scanning */}
      {step === 'scanning' && (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <BrainCircuit className="h-12 w-12 text-charcoal dark:text-emerald-400 animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <ScanLine className="h-6 w-6 text-emerald-500 animate-bounce" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  AI is reading your menu...
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Our AI is analyzing your menu photo to detect items, prices, and categories.
                  This usually takes a few seconds.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <Progress value={scanProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">Processing... {Math.round(scanProgress)}%</p>
              </div>
              {uploadedImage && (
                <div className="mt-4 w-32 h-32 rounded-lg overflow-hidden border shadow-sm">
                  <img src={uploadedImage} alt="Scanning" className="w-full h-full object-cover opacity-50" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <div className="space-y-4">
          {/* Detection Banner */}
          <Card className="bg-gold/15 dark:border-emerald-800 bg-ivory/50 dark:bg-emerald-950/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-charcoal dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gold-dark dark:text-emerald-300">
                      AI detected {items.length} menu items
                    </p>
                    <p className="text-xs text-charcoal/70 dark:text-emerald-400/70">
                      Review and edit before saving
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-gold-dark dark:bg-emerald-900/40 dark:text-emerald-400 border-0">
                  {categories.length} {categories.length === 1 ? 'category' : 'categories'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Detected Items</CardTitle>
                  <CardDescription>Edit any item details before saving</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={addItem}>
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[180px]">Name</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                      <TableHead className="w-[120px]">Price</TableHead>
                      <TableHead className="w-[150px]">Category</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                            placeholder="Item name"
                            className="h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder="Description"
                            className="h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">₦</span>
                            <Input
                              type="number"
                              value={item.price}
                              onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                              className="h-8 text-sm pl-6"
                              min={0}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.category}
                            onValueChange={(val) => updateItem(item.id, 'category', val)}
                          >
                            <SelectTrigger size="sm" className="h-8 w-full text-sm">
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                              <SelectItem
                                value="__new__"
                                onClick={() => setShowNewCategory(true)}
                                className="text-charcoal"
                              >
                                + New Category
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No items. Click &quot;Add Item&quot; to add manually.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile: Show description below each item */}
              <div className="md:hidden mt-3 space-y-2">
                {items.map((item) => (
                  <div key={`desc-${item.id}`} className="text-xs text-muted-foreground px-1">
                    <span className="font-medium text-foreground">{item.name || 'Unnamed'}</span>
                    {item.description ? ` — ${item.description}` : ''}
                  </div>
                ))}
              </div>

              {/* New Category Input */}
              {showNewCategory && (
                <div className="mt-4 flex items-center gap-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="New category name"
                    className="h-8 text-sm max-w-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addNewCategory();
                      if (e.key === 'Escape') setShowNewCategory(false);
                    }}
                    autoFocus
                  />
                  <Button size="sm" className="h-8 bg-charcoal hover:bg-charcoal-light text-white" onClick={addNewCategory}>
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowNewCategory(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Actions */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={resetScanner}>
              <Camera className="h-4 w-4 mr-2" />
              Scan Another
            </Button>
            <Button
              className="bg-charcoal hover:bg-charcoal-light text-white gap-2"
              onClick={handleSave}
              disabled={saving || items.filter(i => i.name.trim()).length === 0}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Review & Save
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step: Save (Success) */}
      {step === 'save' && (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-charcoal dark:text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Menu Items Saved!</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {items.filter(i => i.name.trim()).length} items across {categories.length} categories have been
                  added to your menu. You can now manage them in the Menu Manager.
                </p>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Button
                  variant="outline"
                  onClick={resetScanner}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Scan Another Menu
                </Button>
                <Button
                  className="bg-charcoal hover:bg-charcoal-light text-white gap-2"
                  onClick={goToMenuManager}
                >
                  Go to Menu Manager
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
