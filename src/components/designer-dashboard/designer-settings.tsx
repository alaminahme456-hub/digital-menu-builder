'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  Save,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  User,
  ShieldAlert,
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
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { useAuthStore, useAppStore } from '@/lib/store';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmtNaira = (v: number) => '₦' + (v || 0).toLocaleString('en-NG');

/* ------------------------------------------------------------------ */
/*  Loading Skeleton                                                   */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-9 w-full max-w-sm" />
            </div>
          ))}
          <Skeleton className="h-9 w-28" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-80" />
        </CardContent>
      </Card>
      <Card className="border-red-200">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-9 w-36" />
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function DesignerSettings() {
  const { token } = useAuthStore();
  const { navigate } = useAppStore();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* Editable fields */
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  /* Fetch user data */
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load account settings');
        return r.json();
      })
      .then((res) => {
        const u = res.user;
        setUser(u);
        setName(u.name ?? '');
        setPhone(u.phone ?? '');
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  /* Save account settings */
  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to update settings');
      }
      const updated = await res.json();
      setUser(updated.user);
      toast.success('Account settings saved successfully');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  /* Delete account */
  const handleDelete = async () => {
    if (!token) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to delete account');
      }
      toast.success('Account deleted successfully');
      useAuthStore.getState().logout();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gold/10">
          <Settings className="size-5 text-gold-dark" />
        </div>
        <h1 className="text-xl font-semibold text-charcoal">Settings</h1>
      </div>

      {/* ---- Account Settings ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-charcoal">Account Settings</CardTitle>
          <CardDescription className="text-charcoal/50">
            Manage your account details. Your email cannot be changed here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="settings-name" className="text-xs text-charcoal/50">
              Full Name
            </Label>
            <div className="relative max-w-sm">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-charcoal/30" />
              <Input
                id="settings-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-9 border-charcoal/10 focus-visible:ring-gold/30"
                placeholder="Your full name"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <Label htmlFor="settings-email" className="text-xs text-charcoal/50">
              Email Address
            </Label>
            <div className="relative max-w-sm">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-charcoal/30" />
              <Input
                id="settings-email"
                value={user?.email ?? ''}
                disabled
                className="pl-9 border-charcoal/10 bg-charcoal/[0.03] text-charcoal/60 cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-charcoal/30">Email cannot be changed</p>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="settings-phone" className="text-xs text-charcoal/50">
              Phone Number
            </Label>
            <div className="relative max-w-sm">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-charcoal/30" />
              <Input
                id="settings-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-9 border-charcoal/10 focus-visible:ring-gold/30"
                placeholder="e.g. +234 800 000 0000"
              />
            </div>
          </div>

          {/* Save */}
          <div className="pt-2">
            <Button
              className="bg-gold-dark hover:bg-gold-dark/90 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : <><Save className="size-4" /> Save Changes</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ---- Designer Settings ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-charcoal">Designer Settings</CardTitle>
          <CardDescription className="text-charcoal/50">
            Manage your designer profile, specialties, and portfolio information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-gold/20 bg-gold/5 px-4 py-3">
            <p className="text-sm text-charcoal/70">
              Your designer profile is managed from the{' '}
              <span className="font-medium text-charcoal">Profile</span> page.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-gold-dark hover:text-gold-dark/80 hover:bg-gold/10 shrink-0"
              onClick={() => navigate('#/designer/profile')}
            >
              <ExternalLink className="size-4" />
              Go to Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ---- Danger Zone ---- */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <ShieldAlert className="size-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-red-400">
            Irreversible and destructive actions. Proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-red-700">Delete Account</p>
              <p className="text-xs text-red-400 mt-0.5">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 shrink-0"
                >
                  <Trash2 className="size-4" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account, all your templates, earnings data, and remove it from
                    the ALTECH marketplace.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="text-charcoal/60">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Yes, delete my account'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
