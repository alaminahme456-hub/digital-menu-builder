'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Save,
  Upload,
  Trash2,
  Loader2,
  ImageIcon,
  AlertTriangle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuthStore, useAppStore } from '@/lib/store';
import type { Business } from '@/lib/types';
import { BUSINESS_CATEGORIES } from '@/lib/types';
import { toast } from 'sonner';

export default function SettingsPanel() {
  const { token, user } = useAuthStore();
  const { currentBusiness, setCurrentBusiness } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Business form state
  const [bizForm, setBizForm] = useState({
    name: '',
    category: '',
    phone: '',
    whatsapp: '',
    address: '',
    openingHours: '',
    description: '',
    status: 'draft' as string,
    whatsappOrder: false,
    seoEnabled: false,
  });
  const [bizLoading, setBizLoading] = useState(false);
  const [bizSaving, setBizSaving] = useState(false);
  const [bizInitial, setBizInitial] = useState<Business | null>(null);

  // Account form state
  const [accForm, setAccForm] = useState({
    name: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [accSaving, setAccSaving] = useState(false);
  const [accLoading, setAccLoading] = useState(true);

  // Upload state
  const [uploading, setUploading] = useState(false);

  // Fetch business data
  useEffect(() => {
    if (!currentBusiness?.id || !token) return;
    setBizLoading(true);
    async function fetchBusiness() {
      try {
        const res = await fetch(`/api/businesses/${currentBusiness.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const b: Business = data.business;
          setBizInitial(b);
          setBizForm({
            name: b.name || '',
            category: b.category || '',
            phone: b.phone || '',
            whatsapp: b.whatsapp || '',
            address: b.address || '',
            openingHours: b.openingHours || '',
            description: b.description || '',
            status: b.status || 'draft',
            whatsappOrder: b.whatsappOrder ?? false,
            seoEnabled: b.seoEnabled ?? false,
          });
        }
      } catch {
        toast.error('Failed to load business settings');
      } finally {
        setBizLoading(false);
      }
    }
    fetchBusiness();
  }, [currentBusiness?.id, token]);

  // Fetch user data
  useEffect(() => {
    if (!user || !token) return;
    setAccForm({
      name: user.name || '',
      phone: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setAccLoading(false);
  }, [user, token]);

  // Save business settings
  const handleSaveBusiness = async () => {
    if (!currentBusiness?.id || !token) return;
    setBizSaving(true);
    try {
      const res = await fetch(`/api/businesses/${currentBusiness.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bizForm),
      });
      if (res.ok) {
        const data = await res.json();
        const updated: Business = data.business;
        setBizInitial(updated);
        setCurrentBusiness({
          id: updated.id,
          slug: updated.slug,
          name: updated.name,
          logo: updated.logo,
          status: updated.status,
        });
        toast.success('Business settings saved');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to save settings');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setBizSaving(false);
    }
  };

  // Save account settings
  const handleSaveAccount = async () => {
    if (!token) return;
    const updateData: Record<string, string> = {};
    if (accForm.name) updateData.name = accForm.name;
    if (accForm.phone) updateData.phone = accForm.phone;

    // Password change validation
    if (accForm.newPassword) {
      if (!accForm.currentPassword) {
        toast.error('Current password is required to change password');
        return;
      }
      if (accForm.newPassword !== accForm.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
      if (accForm.newPassword.length < 8) {
        toast.error('Password must be at least 8 characters');
        return;
      }
      updateData.currentPassword = accForm.currentPassword;
      updateData.newPassword = accForm.newPassword;
    }

    if (Object.keys(updateData).length === 0) {
      toast.error('No changes to save');
      return;
    }

    setAccSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      if (res.ok) {
        toast.success('Account settings saved');
        setAccForm((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to save account');
      }
    } catch {
      toast.error('Failed to save account');
    } finally {
      setAccSaving(false);
    }
  };

  // Logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentBusiness?.id || !token) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('businessId', currentBusiness.id);
      formData.append('type', 'logo');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setCurrentBusiness({
            ...currentBusiness,
            logo: data.url,
          });
          toast.success('Logo uploaded');
        }
      } else {
        toast.error('Failed to upload logo');
      }
    } catch {
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Account deleted');
        useAuthStore.getState().logout();
      } else {
        toast.error('Failed to delete account');
      }
    } catch {
      toast.error('Failed to delete account');
    }
  };

  if (!currentBusiness) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
        <p>Select a business to manage settings</p>
      </div>
    );
  }

  const hasBizChanges =
    bizInitial &&
    (bizForm.name !== bizInitial.name ||
      bizForm.category !== (bizInitial.category || '') ||
      bizForm.phone !== (bizInitial.phone || '') ||
      bizForm.whatsapp !== (bizInitial.whatsapp || '') ||
      bizForm.address !== (bizInitial.address || '') ||
      bizForm.openingHours !== (bizInitial.openingHours || '') ||
      bizForm.description !== (bizInitial.description || '') ||
      bizForm.status !== bizInitial.status ||
      bizForm.whatsappOrder !== (bizInitial.whatsappOrder ?? false) ||
      bizForm.seoEnabled !== (bizInitial.seoEnabled ?? false));

  return (
    <Tabs defaultValue="business" className="space-y-6">
      <TabsList>
        <TabsTrigger value="business">Business Settings</TabsTrigger>
        <TabsTrigger value="account">Account Settings</TabsTrigger>
      </TabsList>

      {/* Business Settings Tab */}
      <TabsContent value="business" className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update your business details and branding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {bizLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="h-9 rounded-md bg-muted" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    {currentBusiness.logo ? (
                      <img
                        src={currentBusiness.logo}
                        alt="Logo"
                        className="h-16 w-16 rounded-xl object-cover ring-1 ring-border"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-1.5 h-4 w-4" />
                        )}
                        {uploading ? 'Uploading...' : 'Upload Logo'}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG up to 2MB
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Business Name */}
                <div className="space-y-2">
                  <Label htmlFor="biz-name">Business Name</Label>
                  <Input
                    id="biz-name"
                    value={bizForm.name}
                    onChange={(e) =>
                      setBizForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Enter business name"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={bizForm.category}
                    onValueChange={(v) =>
                      setBizForm((p) => ({ ...p, category: v }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Phone & WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="biz-phone">Phone</Label>
                    <Input
                      id="biz-phone"
                      value={bizForm.phone}
                      onChange={(e) =>
                        setBizForm((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="biz-whatsapp">WhatsApp</Label>
                    <Input
                      id="biz-whatsapp"
                      value={bizForm.whatsapp}
                      onChange={(e) =>
                        setBizForm((p) => ({ ...p, whatsapp: e.target.value }))
                      }
                      placeholder="WhatsApp number"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="biz-address">Address</Label>
                  <Input
                    id="biz-address"
                    value={bizForm.address}
                    onChange={(e) =>
                      setBizForm((p) => ({ ...p, address: e.target.value }))
                    }
                    placeholder="Business address"
                  />
                </div>

                {/* Opening Hours */}
                <div className="space-y-2">
                  <Label htmlFor="biz-hours">Opening Hours</Label>
                  <Input
                    id="biz-hours"
                    value={bizForm.openingHours}
                    onChange={(e) =>
                      setBizForm((p) => ({ ...p, openingHours: e.target.value }))
                    }
                    placeholder="e.g. Mon-Fri 9AM-10PM, Sat-Sun 10AM-11PM"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="biz-desc">Description</Label>
                  <Textarea
                    id="biz-desc"
                    value={bizForm.description}
                    onChange={(e) =>
                      setBizForm((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="Brief description of your business"
                    rows={3}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Menu Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Menu Settings</CardTitle>
            <CardDescription>
              Control how your menu is published and accessed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {bizLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="h-4 w-32 rounded bg-muted" />
                      <div className="h-3 w-48 rounded bg-muted" />
                    </div>
                    <div className="h-5 w-10 rounded-full bg-muted" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Menu Status */}
                <div className="space-y-2">
                  <Label>Menu Status</Label>
                  <Select
                    value={bizForm.status}
                    onValueChange={(v) =>
                      setBizForm((p) => ({ ...p, status: v }))
                    }
                  >
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="unpublished">Unpublished</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Only published menus are accessible via QR code
                  </p>
                </div>

                <Separator />

                {/* WhatsApp Ordering */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label>WhatsApp Ordering</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow customers to place orders via WhatsApp
                    </p>
                  </div>
                  <Switch
                    checked={bizForm.whatsappOrder}
                    onCheckedChange={(v) =>
                      setBizForm((p) => ({ ...p, whatsappOrder: v }))
                    }
                  />
                </div>

                <Separator />

                {/* SEO */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label>SEO Indexing</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow search engines to index your menu page
                    </p>
                  </div>
                  <Switch
                    checked={bizForm.seoEnabled}
                    onCheckedChange={(v) =>
                      setBizForm((p) => ({ ...p, seoEnabled: v }))
                    }
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveBusiness}
            disabled={bizSaving || bizLoading || !hasBizChanges}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {bizSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </TabsContent>

      {/* Account Settings Tab */}
      <TabsContent value="account" className="space-y-6">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {accLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-20 rounded bg-muted" />
                    <div className="h-9 rounded-md bg-muted" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="acc-email">Email</Label>
                  <Input
                    id="acc-email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acc-name">Full Name</Label>
                  <Input
                    id="acc-name"
                    value={accForm.name}
                    onChange={(e) =>
                      setAccForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acc-phone">Phone</Label>
                  <Input
                    id="acc-phone"
                    value={accForm.phone}
                    onChange={(e) =>
                      setAccForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="Your phone number"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Leave blank to keep current password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-pw">Current Password</Label>
              <Input
                id="current-pw"
                type="password"
                value={accForm.currentPassword}
                onChange={(e) =>
                  setAccForm((p) => ({ ...p, currentPassword: e.target.value }))
                }
                placeholder="Enter current password"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-pw">New Password</Label>
                <Input
                  id="new-pw"
                  type="password"
                  value={accForm.newPassword}
                  onChange={(e) =>
                    setAccForm((p) => ({ ...p, newPassword: e.target.value }))
                  }
                  placeholder="Min. 8 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pw">Confirm Password</Label>
                <Input
                  id="confirm-pw"
                  type="password"
                  value={accForm.confirmPassword}
                  onChange={(e) =>
                    setAccForm((p) => ({ ...p, confirmPassword: e.target.value }))
                  }
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Account Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveAccount}
            disabled={accSaving || accLoading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {accSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
        </div>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-900/50">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that affect your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-medium text-sm">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data.
                  This action cannot be undone.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="flex-shrink-0">
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your account and remove all of your businesses, menus, and
                      analytics data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
