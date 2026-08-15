'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  UtensilsCrossed,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  List,
  Copy,
  GripVertical,
  ImageIcon,
  Loader2,
  X,
  Upload,
  Check,
  FolderOpen,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuthStore, useAppStore } from '@/lib/store';
import { formatPrice } from '@/lib/auth';
import type { MenuCategory, MenuItem } from '@/lib/types';
import { CATEGORIES_PRESETS } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ============================================================
// Types
// ============================================================

type ViewMode = 'grid' | 'list';

interface ItemFormData {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  image: string | null;
  available: boolean;
}

const EMPTY_ITEM_FORM: ItemFormData = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  image: null,
  available: true,
};

// ============================================================
// Helper: API request with auth
// ============================================================

function authHeaders(token: string, json = true): HeadersInit {
  const h: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

// ============================================================
// Sub-components
// ============================================================

function CategorySkeleton() {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-5 w-5 rounded" />
    </div>
  );
}

function ItemCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}

function ItemRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-3">
      <Skeleton className="size-12 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-64" />
      </div>
      <Skeleton className="h-5 w-16" />
    </div>
  );
}

function EmptyCategoriesState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-ivory dark:bg-emerald-950/40">
        <FolderOpen className="size-8 text-charcoal dark:text-emerald-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">
          No categories yet
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first menu category to get started
        </p>
      </div>
      <Button onClick={onAdd} className="gap-2 bg-charcoal hover:bg-charcoal-light">
        <Plus className="size-4" />
        Add Category
      </Button>
    </div>
  );
}

function EmptyItemsState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <UtensilsCrossed className="size-8 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">No items yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first menu item to this category
        </p>
      </div>
      <Button onClick={onAdd} className="gap-2 bg-charcoal hover:bg-charcoal-light">
        <Plus className="size-4" />
        Add Item
      </Button>
    </div>
  );
}

// ============================================================
// Add Category Dialog
// ============================================================

function AddCategoryDialog({
  open,
  onOpenChange,
  businessId,
  token,
  existingNames,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  token: string;
  existingNames: string[];
  onSuccess?: () => void;
}) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const availablePresets = CATEGORIES_PRESETS.filter(
    (p) => !existingNames.some((e) => e.toLowerCase() === p.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/menu/categories', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ businessId, name: name.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create category');
      }
      toast.success(`Category "${name.trim()}" created`);
      setName('');
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setName(''); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>
            Type a name or pick from suggestions below
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Category Name</Label>
            <Input
              id="cat-name"
              placeholder="e.g. Main Meals"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              autoFocus
            />
          </div>
          {availablePresets.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Suggestions</Label>
              <div className="flex flex-wrap gap-2">
                {availablePresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setName(preset)}
                    className="inline-flex items-center rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setName(''); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || loading}
            className="bg-charcoal hover:bg-charcoal-light"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Create Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Add/Edit Item Sheet (Dialog on mobile)
// ============================================================

function ItemFormDialog({
  open,
  onOpenChange,
  item,
  categories,
  businessId,
  token,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem | null;
  categories: MenuCategory[];
  businessId: string;
  token: string;
}) {
  const isEditing = !!item;
  const [form, setForm] = useState<ItemFormData>(EMPTY_ITEM_FORM);
  const [loading, setLoading] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (open) {
      if (item) {
        setForm({
          name: item.name,
          description: item.description || '',
          price: String(item.price),
          categoryId: item.categoryId,
          image: item.image,
          available: item.available,
        });
      } else {
        setForm({
          ...EMPTY_ITEM_FORM,
          categoryId: categories.length > 0 ? categories[0].id : '',
        });
      }
    }
  }, [open, item, categories]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'item-image');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setForm((f) => ({ ...f, image: data.url }));
      toast.success('Image uploaded');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) uploadFile(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragOver(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.price || !form.categoryId) return;
    setLoading(true);
    try {
      const body = {
        businessId,
        categoryId: form.categoryId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: Number(form.price),
        image: form.image,
        available: form.available,
      };

      let res: Response;
      if (isEditing) {
        res = await fetch('/api/menu/items', {
          method: 'PUT',
          headers: authHeaders(token),
          body: JSON.stringify({ id: item!.id, ...body }),
        });
      } else {
        res = await fetch('/api/menu/items', {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} item`);
      }

      toast.success(`Item ${isEditing ? 'updated' : 'created'} successfully`);
      if (isEditing) {
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 px-6 pb-4 pt-6">
          <DialogTitle>{isEditing ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the menu item details below'
              : 'Fill in the details to add a new menu item'}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <ScrollArea className="flex-1">
          <div className="space-y-5 px-6 py-5">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Food Image</Label>
              <div
                onDrop={handleDrop}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors ${
                  dragOver
                    ? 'border-emerald-500 bg-ivory dark:bg-emerald-950/30'
                    : form.image
                      ? 'border-transparent bg-muted/50'
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50'
                }`}
              >
                {form.image ? (
                  <div className="relative w-full">
                    <img
                      src={form.image}
                      alt="Preview"
                      className="mx-auto max-h-48 rounded-lg object-contain"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setForm((f) => ({ ...f, image: null }));
                      }}
                      className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                      <Upload className="size-5 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        Drop image here or click to browse
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        PNG, JPG, WebP up to 5MB
                      </p>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="item-name">
                Item Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="item-name"
                placeholder="e.g. Jollof Rice"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="item-desc">Description</Label>
              <Textarea
                id="item-desc"
                placeholder="Brief description of the dish..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Price + Category Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-price">
                  Price <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                    ₦
                  </span>
                  <Input
                    id="item-price"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Availability */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Available</Label>
                <p className="text-xs text-muted-foreground">
                  Item will be visible on the public menu
                </p>
              </div>
              <Switch
                checked={form.available}
                onCheckedChange={(v) => setForm((f) => ({ ...f, available: v }))}
              />
            </div>
          </div>
        </ScrollArea>

        <Separator />

        <DialogFooter className="shrink-0 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.name.trim() || !form.price || !form.categoryId || loading}
            className={
              isEditing
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
                : 'bg-charcoal hover:bg-charcoal-light'
            }
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : justSaved ? (
              <Check className="size-4" />
            ) : isEditing ? (
              <Save className="size-4" />
            ) : null}
            {loading
              ? 'Saving...'
              : justSaved
                ? 'Saved!'
                : isEditing
                  ? 'Save Changes'
                  : 'Add Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Delete Confirmation Dialog
// ============================================================

function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============================================================
// Main Menu Manager
// ============================================================

export default function MenuManager() {
  const token = useAuthStore((s) => s.token);
  const businessId = useAppStore((s) => s.currentBusiness?.id);

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [mobileTab, setMobileTab] = useState('categories');

  // Dialog states
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{
      type: 'category' | 'item';
      id: string;
      name: string;
    } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Derived
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) || null;
  const items = selectedCategory?.items || [];

  // =========================================================
  // Data fetching
  // =========================================================

  const fetchCategories = useCallback(async () => {
    if (!token || !businessId) return;
    try {
      const res = await fetch(`/api/menu/categories?businessId=${businessId}`, {
        headers: authHeaders(token),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error('Fetch categories failed:', res.status, errBody);
        throw new Error(errBody?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setCategories(data.categories || []);
      // Auto-select first category if none selected
      setSelectedCategoryId((prev) => {
        if (!prev && data.categories?.length > 0) {
          return data.categories[0].id;
        }
        // If selected category was deleted, pick first
        if (prev && !data.categories?.find((c: MenuCategory) => c.id === prev)) {
          return data.categories?.[0]?.id || null;
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to load menu data:', err);
      toast.error(`Failed to load menu data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [token, businessId]);

  useEffect(() => {
    setLoading(true);
    fetchCategories();
  }, [fetchCategories]);

  // =========================================================
  // Category operations
  // =========================================================

  const handleRenameCategory = async () => {
    if (!editingCategory || !renameValue.trim() || !token) return;
    try {
      const res = await fetch(`/api/menu/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      if (!res.ok) throw new Error('Rename failed');
      toast.success('Category renamed');
      setEditingCategory(null);
      fetchCategories();
    } catch {
      toast.error('Failed to rename category');
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/menu/categories/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success(`Category "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      fetchCategories();
    } catch {
      toast.error('Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  const handleMoveCategory = async (cat: MenuCategory, direction: 'up' | 'down') => {
    if (!token) return;
    const idx = categories.findIndex((c) => c.id === cat.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;

    const swapCat = categories[swapIdx];
    const newSortOrder = swapCat.sortOrder;

    try {
      // Update the moved category's sort order
      const res = await fetch(`/api/menu/categories/${cat.id}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ sortOrder: newSortOrder }),
      });
      if (!res.ok) throw new Error('Move failed');
      fetchCategories();
    } catch {
      toast.error('Failed to reorder categories');
    }
  };

  // =========================================================
  // Item operations
  // =========================================================

  const openAddItem = () => {
    setEditingItem(null);
    setItemFormOpen(true);
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemFormOpen(true);
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    if (!token) return;
    try {
      const res = await fetch('/api/menu/items', {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ id: item.id, available: !item.available }),
      });
      if (!res.ok) throw new Error('Toggle failed');
      fetchCategories();
    } catch {
      toast.error('Failed to update availability');
    }
  };

  const handleDuplicateItem = async (item: MenuItem) => {
    if (!token || !businessId) return;
    try {
      const res = await fetch('/api/menu/items', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          businessId,
          categoryId: item.categoryId,
          name: `${item.name} (Copy)`,
          description: item.description,
          price: item.price,
          image: item.image,
        }),
      });
      if (!res.ok) throw new Error('Duplicate failed');
      toast.success(`"${item.name}" duplicated`);
      fetchCategories();
    } catch {
      toast.error('Failed to duplicate item');
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/menu/items?id=${deleteTarget.id}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      fetchCategories();
    } catch {
      toast.error('Failed to delete item');
    } finally {
      setDeleting(false);
    }
  };

  const handleMoveItem = async (item: MenuItem, direction: 'up' | 'down') => {
    if (!token || !selectedCategory) return;
    const idx = items.findIndex((i) => i.id === item.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;

    const swapItem = items[swapIdx];
    try {
      const res = await fetch('/api/menu/items', {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ id: item.id, sortOrder: swapItem.sortOrder }),
      });
      if (!res.ok) throw new Error('Move failed');
      fetchCategories();
    } catch {
      toast.error('Failed to reorder items');
    }
  };

  // =========================================================
  // Render: Category item in sidebar
  // =========================================================

  const renderCategoryItem = (cat: MenuCategory, idx: number) => {
    const isActive = cat.id === selectedCategoryId;
    const isEditing = editingCategory?.id === cat.id;
    const itemCount = cat.items?.length || 0;

    return (
      <div
        key={cat.id}
        className={`group relative flex items-center gap-2 rounded-lg px-3 py-2.5 transition-colors ${
          isActive
            ? 'bg-ivory text-gold-dark dark:bg-emerald-950/40 dark:text-emerald-400'
            : 'text-foreground hover:bg-muted'
        }`}
      >
        {/* Active indicator */}
        {isActive && (
          <div className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-charcoal" />
        )}

        {/* Reorder buttons */}
        <div className="flex shrink-0 flex-col gap-0 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => handleMoveCategory(cat, 'up')}
            disabled={idx === 0}
            className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
          >
            <ChevronUp className="size-3" />
          </button>
          <button
            type="button"
            onClick={() => handleMoveCategory(cat, 'down')}
            disabled={idx === categories.length - 1}
            className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
          >
            <ChevronDown className="size-3" />
          </button>
        </div>

        {/* Name / edit input */}
        {isEditing ? (
          <div className="flex flex-1 items-center gap-1.5">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameCategory();
                if (e.key === 'Escape') setEditingCategory(null);
              }}
              className="h-7 border-gold/20 bg-white text-sm dark:border-emerald-700 dark:bg-background"
              autoFocus
            />
            <button
              type="button"
              onClick={handleRenameCategory}
              className="rounded p-1 text-charcoal hover:bg-gold/10 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
            >
              <Check className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setEditingCategory(null)}
              className="rounded p-1 text-muted-foreground hover:bg-accent"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSelectedCategoryId(cat.id)}
            className="flex flex-1 items-center gap-2 overflow-hidden text-left"
          >
            <FolderOpen className="size-4 shrink-0" />
            <span className="truncate text-sm font-medium">{cat.name}</span>
          </button>
        )}

        {/* Item count badge */}
        {!isEditing && (
          <Badge
            variant={isActive ? 'default' : 'secondary'}
            className={`shrink-0 text-[10px] px-1.5 py-0 ${
              isActive
                ? 'bg-charcoal text-white hover:bg-charcoal'
                : ''
            }`}
          >
            {itemCount}
          </Badge>
        )}

        {/* Action buttons */}
        {!isEditing && (
          <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => {
                setEditingCategory(cat);
                setRenameValue(cat.name);
              }}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Pencil className="size-3" />
            </button>
            <button
              type="button"
              onClick={() =>
                setDeleteTarget({
                  type: 'category',
                  id: cat.id,
                  name: cat.name,
                })
              }
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  // =========================================================
  // Render: Item card (grid view)
  // =========================================================

  const renderItemCard = (item: MenuItem, idx: number) => (
    <div
      key={item.id}
      className={`group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md ${
        !item.available ? 'opacity-60' : ''
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="size-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <UtensilsCrossed className="size-10 text-muted-foreground/40" />
          </div>
        )}

        {/* Unavailable badge */}
        {!item.available && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-black/70 text-white backdrop-blur-sm">
              Unavailable
            </Badge>
          </div>
        )}

        {/* Hover actions overlay */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => openEditItem(item)}
            className="flex size-8 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm backdrop-blur-sm hover:bg-white"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDuplicateItem(item)}
            className="flex size-8 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm backdrop-blur-sm hover:bg-white"
          >
            <Copy className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              setDeleteTarget({
                type: 'item',
                id: item.id,
                name: item.name,
              })
            }
            className="flex size-8 items-center justify-center rounded-full bg-white/90 text-destructive shadow-sm backdrop-blur-sm hover:bg-white"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 overflow-hidden">
            <h4 className="truncate text-sm font-semibold text-foreground">
              {item.name}
            </h4>
            {item.description && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {item.description}
              </p>
            )}
          </div>
          <span className="shrink-0 text-sm font-bold text-charcoal dark:text-emerald-400">
            {formatPrice(item.price)}
          </span>
        </div>

        {/* Bottom row: reorder + availability */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-0.5">
            <button
              type="button"
              onClick={() => handleMoveItem(item, 'up')}
              disabled={idx === 0}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
            >
              <ChevronUp className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleMoveItem(item, 'down')}
              disabled={idx === items.length - 1}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
            >
              <ChevronDown className="size-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">
              {item.available ? 'Available' : 'Hidden'}
            </span>
            <Switch
              checked={item.available}
              onCheckedChange={() => handleToggleAvailability(item)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // =========================================================
  // Render: Item row (list view)
  // =========================================================

  const renderItemRow = (item: MenuItem, idx: number) => (
    <div
      key={item.id}
      className={`group flex items-center gap-4 rounded-lg border bg-card p-3 transition-all hover:shadow-sm ${
        !item.available ? 'opacity-60' : ''
      }`}
    >
      {/* Reorder handle */}
      <div className="flex shrink-0 flex-col gap-0 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => handleMoveItem(item, 'up')}
          disabled={idx === 0}
          className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
        >
          <ChevronUp className="size-3" />
        </button>
        <button
          type="button"
          onClick={() => handleMoveItem(item, 'down')}
          disabled={idx === items.length - 1}
          className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
        >
          <ChevronDown className="size-3" />
        </button>
      </div>

      {/* Thumbnail */}
      <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <UtensilsCrossed className="size-5 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <h4 className="truncate text-sm font-semibold text-foreground">
            {item.name}
          </h4>
          {!item.available && (
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              Unavailable
            </Badge>
          )}
        </div>
        {item.description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>

      {/* Price */}
      <span className="shrink-0 text-sm font-bold text-charcoal dark:text-emerald-400">
        {formatPrice(item.price)}
      </span>

      {/* Availability toggle */}
      <Switch
        checked={item.available}
        onCheckedChange={() => handleToggleAvailability(item)}
      />

      {/* Action buttons */}
      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => openEditItem(item)}
          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleDuplicateItem(item)}
          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Copy className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() =>
            setDeleteTarget({
              type: 'item',
              id: item.id,
              name: item.name,
            })
          }
          className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );

  // =========================================================
  // Main render
  // =========================================================

  if (!token || !businessId) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Select a business to manage menu</p>
      </div>
    );
  }

  const existingCatNames = categories.map((c) => c.name);

  return (
    <div className="flex h-full flex-col">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Menu Manager</h2>
          <p className="text-sm text-muted-foreground">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'},{''}
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddCatOpen(true)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add Category</span>
            <span className="sm:hidden">Category</span>
          </Button>
          <Button
            size="sm"
            onClick={openAddItem}
            disabled={!selectedCategoryId}
            className="gap-1.5 bg-charcoal hover:bg-charcoal-light"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add Item</span>
            <span className="sm:hidden">Item</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* ========== DESKTOP: Two-panel layout ========== */}
        <div className="hidden md:flex md:flex-1">
          {/* Categories Sidebar */}
          <div className="flex w-[280px] shrink-0 flex-col border-r">
            <div className="px-4 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Categories
              </h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-1 px-2 pb-4">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <CategorySkeleton key={i} />
                    ))
                  : categories.length === 0
                    ? null
                    : categories.map((cat, idx) => renderCategoryItem(cat, idx))}
              </div>
            </ScrollArea>
            {!loading && categories.length === 0 && (
              <div className="px-2 pb-4">
                <EmptyCategoriesState onAdd={() => setAddCatOpen(true)} />
              </div>
            )}
          </div>

          {/* Items Panel */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {selectedCategory ? (
              <>
                {/* Items toolbar */}
                <div className="flex items-center justify-between border-b px-6 py-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {selectedCategory.name}
                    </h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border bg-muted p-0.5">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`rounded-md p-1.5 transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <LayoutGrid className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`rounded-md p-1.5 transition-colors ${
                        viewMode === 'list'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <List className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Items content */}
                <ScrollArea className="flex-1">
                  <div className="p-6">
                    {loading ? (
                      <div className={
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
                          : 'space-y-3'
                      }>
                        {Array.from({ length: 6 }).map((_, i) =>
                          viewMode === 'grid' ? (
                            <ItemCardSkeleton key={i} />
                          ) : (
                            <ItemRowSkeleton key={i} />
                          )
                        )}
                      </div>
                    ) : items.length === 0 ? (
                      <EmptyItemsState onAdd={openAddItem} />
                    ) : viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((item, idx) => renderItemCard(item, idx))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {items.map((item, idx) => renderItemRow(item, idx))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="mx-auto h-8 w-48" />
                    <Skeleton className="mx-auto h-4 w-32" />
                  </div>
                ) : categories.length > 0 ? (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Select a category to view items
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* ========== MOBILE: Tabbed layout ========== */}
        <div className="flex flex-1 flex-col md:hidden">
          <Tabs value={mobileTab} onValueChange={setMobileTab} className="flex flex-1 flex-col">
            <TabsList className="mx-4 mt-3 grid w-auto grid-cols-2">
              <TabsTrigger value="categories" className="gap-1.5">
                <FolderOpen className="size-3.5" />
                Categories
              </TabsTrigger>
              <TabsTrigger value="items" className="gap-1.5">
                <UtensilsCrossed className="size-3.5" />
                Items
              </TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-1 p-4">
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <CategorySkeleton key={i} />
                      ))
                    : categories.length === 0
                      ? <EmptyCategoriesState onAdd={() => setAddCatOpen(true)} />
                      : categories.map((cat, idx) => renderCategoryItem(cat, idx))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="items" className="flex flex-1 flex-col overflow-hidden">
              {selectedCategory ? (
                <>
                  <div className="flex items-center justify-between border-b px-4 py-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        {selectedCategory.name}
                      </h3>
                      <Badge variant="secondary" className="text-[10px]">
                        {items.length}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg border bg-muted p-0.5">
                      <button
                        type="button"
                        onClick={() => setViewMode('grid')}
                        className={`rounded-md p-1.5 transition-colors ${
                          viewMode === 'grid'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <LayoutGrid className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`rounded-md p-1.5 transition-colors ${
                          viewMode === 'list'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <List className="size-4" />
                      </button>
                    </div>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-4">
                      {loading ? (
                        <div className={
                          viewMode === 'grid'
                            ? 'grid grid-cols-1 gap-3 sm:grid-cols-2'
                            : 'space-y-3'
                        }>
                          {Array.from({ length: 4 }).map((_, i) =>
                            viewMode === 'grid' ? (
                              <ItemCardSkeleton key={i} />
                            ) : (
                              <ItemRowSkeleton key={i} />
                            )
                          )}
                        </div>
                      ) : items.length === 0 ? (
                        <EmptyItemsState onAdd={openAddItem} />
                      ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {items.map((item, idx) => renderItemCard(item, idx))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {items.map((item, idx) => renderItemRow(item, idx))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Select a category first
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setMobileTab('categories')}
                    >
                      Go to Categories
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ========== Dialogs ========== */}
      <AddCategoryDialog
        open={addCatOpen}
        onOpenChange={setAddCatOpen}
        businessId={businessId}
        token={token}
        existingNames={existingCatNames}
        onSuccess={fetchCategories}
      />

      <ItemFormDialog
        open={itemFormOpen}
        onOpenChange={setItemFormOpen}
        item={editingItem}
        categories={categories}
        businessId={businessId}
        token={token}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={
          deleteTarget?.type === 'category'
            ? 'Delete Category'
            : 'Delete Item'
        }
        description={
          deleteTarget?.type === 'category'
            ? `This will permanently delete "${deleteTarget?.name}" and all its items. This action cannot be undone.`
            : `This will permanently delete "${deleteTarget?.name}". This action cannot be undone.`
        }
        onConfirm={
          deleteTarget?.type === 'category'
            ? handleDeleteCategory
            : handleDeleteItem
        }
        loading={deleting}
      />
    </div>
  );
}