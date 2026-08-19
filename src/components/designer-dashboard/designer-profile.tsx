'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  UserCircle,
  Star,
  Pencil,
  Save,
  X,
  MapPin,
  Link as LinkIcon,
  LayoutTemplate,
  Download,
  Wallet,
  Check,
  Plus,
  Globe,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Designer {
  displayName: string;
  username: string;
  avatar: string;
  bio: string;
  country: string;
  specialties: string[];
  portfolioLink: string;
  socialLinks: Record<string, string>;
  totalTemplates: number;
  totalUses: number;
  totalEarnings: number;
  ratingSum: number;
  ratingCount: number;
  status: string;
}

interface ApiData {
  designer: Designer;
  stats: Record<string, number>;
  recentTemplates: unknown[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmtNaira = (v: number) => '₦' + (v || 0).toLocaleString('en-NG');

const SPECIALTY_OPTIONS = [
  'Menu Design',
  'Branding',
  'Logo Design',
  'Print Design',
  'Social Media',
  'Illustration',
  'Typography',
  'Photography',
  'Packaging',
  'UI/UX Design',
];

/* ------------------------------------------------------------------ */
/*  Loading Skeleton                                                   */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <Card className="max-w-3xl mx-auto">
      <CardContent className="space-y-6 pt-8 pb-8">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="size-24 rounded-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Separator />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <Skeleton className="h-5 w-16 mx-auto" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function DesignerProfile() {
  const { token } = useAuthStore();
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Editable form state */
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [portfolioLink, setPortfolioLink] = useState('');

  /* Fetch data */
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch('/api/marketplace/designers/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load profile');
        return r.json();
      })
      .then((res: ApiData) => {
        setData(res);
        const d = res.designer;
        setDisplayName(d.displayName ?? '');
        setBio(d.bio ?? '');
        setCountry(d.country ?? '');
        setSpecialties(d.specialties ?? []);
        setPortfolioLink(d.portfolioLink ?? '');
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  /* Toggle a specialty */
  const toggleSpecialty = useCallback((s: string) => {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }, []);

  /* Save profile */
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/marketplace/designers/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName,
          bio,
          country,
          specialties,
          portfolioLink,
          socialLinks: data?.designer.socialLinks ?? {},
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to update profile');
      }
      const updated = await res.json();
      setData(updated);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  /* Cancel edit */
  const handleCancel = () => {
    const d = data?.designer;
    setDisplayName(d?.displayName ?? '');
    setBio(d?.bio ?? '');
    setCountry(d?.country ?? '');
    setSpecialties(d?.specialties ?? []);
    setPortfolioLink(d?.portfolioLink ?? '');
    setEditing(false);
  };

  if (loading) return <LoadingSkeleton />;

  const d = data?.designer;
  if (!d) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-charcoal/50">Unable to load profile data.</p>
        </CardContent>
      </Card>
    );
  }

  const initials = d.displayName
    ?.split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??';

  const avgRating =
    d.ratingCount > 0
      ? (d.ratingSum / d.ratingCount).toFixed(1)
      : '0.0';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gold/10">
            <UserCircle className="size-5 text-gold-dark" />
          </div>
          <h1 className="text-xl font-semibold text-charcoal">Profile</h1>
        </div>
        {!editing ? (
          <Button
            variant="outline"
            size="sm"
            className="text-charcoal/70 hover:text-gold-dark hover:border-gold/40"
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-charcoal/50 hover:text-charcoal"
              onClick={handleCancel}
              disabled={saving}
            >
              <X className="size-4" />
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-gold-dark hover:bg-gold-dark/90 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="size-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="space-y-6 pt-8 pb-8">
          {/* Avatar + Name + Username */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              {d.avatar ? (
                <img
                  src={d.avatar}
                  alt={d.displayName}
                  className="size-24 rounded-full object-cover ring-4 ring-champagne/50"
                />
              ) : (
                <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-gold/20 to-champagne ring-4 ring-champagne/50">
                  <span className="text-2xl font-bold text-gold-dark">{initials}</span>
                </div>
              )}
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-charcoal/40 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Edit profile"
                >
                  <Pencil className="size-5 text-white" />
                </button>
              )}
            </div>

            {editing ? (
              <div className="w-full max-w-xs space-y-2">
                <Label htmlFor="displayName" className="text-xs text-charcoal/50">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="border-charcoal/10 focus-visible:ring-gold/30 text-center"
                  placeholder="Your display name"
                />
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-charcoal">{d.displayName}</h2>
                <p className="text-sm text-charcoal/50">@{d.username}</p>
                <Badge className="bg-gold/10 text-gold-dark border-gold/20 hover:bg-gold/15 gap-1">
                  <Star className="size-3 fill-gold-dark" />
                  Verified Designer
                </Badge>
              </>
            )}
          </div>

          <Separator className="bg-charcoal/[0.06]" />

          {/* Bio */}
          <div className="space-y-2">
            {editing ? (
              <>
                <Label htmlFor="bio" className="text-xs text-charcoal/50">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="border-charcoal/10 focus-visible:ring-gold/30 min-h-[100px] resize-none"
                  placeholder="Tell restaurants about yourself..."
                />
              </>
            ) : (
              <>
                <p className="text-xs font-medium text-charcoal/40 uppercase tracking-wider">
                  Bio
                </p>
                <p className="text-sm text-charcoal/70 leading-relaxed">
                  {d.bio || (
                    <span className="italic text-charcoal/30">No bio yet</span>
                  )}
                </p>
              </>
            )}
          </div>

          {/* Country */}
          <div className="space-y-2">
            {editing ? (
              <>
                <Label htmlFor="country" className="text-xs text-charcoal/50">
                  Country
                </Label>
                <div className="relative max-w-xs">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-charcoal/30" />
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="pl-9 border-charcoal/10 focus-visible:ring-gold/30"
                    placeholder="e.g. Nigeria"
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="size-4 text-charcoal/40" />
                <span className="text-charcoal/70">
                  {d.country || (
                    <span className="italic text-charcoal/30">Not specified</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Specialties */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-charcoal/40 uppercase tracking-wider">
              Specialties
            </p>
            {editing ? (
              <div className="flex flex-wrap gap-2">
                {SPECIALTY_OPTIONS.map((s) => {
                  const active = specialties.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSpecialty(s)}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors ${
                        active
                          ? 'border-gold/40 bg-gold/10 text-gold-dark'
                          : 'border-charcoal/10 text-charcoal/50 hover:border-charcoal/20 hover:text-charcoal/70'
                      }`}
                    >
                      {active && <Check className="size-3" />}
                      {s}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {d.specialties?.length > 0 ? (
                  d.specialties.map((s: string) => (
                    <Badge
                      key={s}
                      variant="outline"
                      className="border-gold/30 bg-gold/10 text-gold-dark text-xs"
                    >
                      {s}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm italic text-charcoal/30">No specialties listed</span>
                )}
              </div>
            )}
          </div>

          {/* Portfolio Link */}
          <div className="space-y-2">
            {editing ? (
              <>
                <Label htmlFor="portfolioLink" className="text-xs text-charcoal/50">
                  Portfolio Link
                </Label>
                <div className="relative max-w-md">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-charcoal/30" />
                  <Input
                    id="portfolioLink"
                    value={portfolioLink}
                    onChange={(e) => setPortfolioLink(e.target.value)}
                    className="pl-9 border-charcoal/10 focus-visible:ring-gold/30"
                    placeholder="https://yourportfolio.com"
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <LinkIcon className="size-4 text-charcoal/40" />
                {d.portfolioLink ? (
                  <a
                    href={d.portfolioLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold-dark hover:underline truncate"
                  >
                    {d.portfolioLink}
                  </a>
                ) : (
                  <span className="italic text-charcoal/30">No portfolio link</span>
                )}
              </div>
            )}
          </div>

          <Separator className="bg-charcoal/[0.06]" />

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <p className="text-lg font-bold text-charcoal">{d.totalTemplates ?? 0}</p>
              <p className="text-xs text-charcoal/40 mt-0.5">Templates</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-charcoal">{(d.totalUses ?? 0).toLocaleString()}</p>
              <p className="text-xs text-charcoal/40 mt-0.5">Total Uses</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-charcoal">{fmtNaira(d.totalEarnings ?? 0)}</p>
              <p className="text-xs text-charcoal/40 mt-0.5">Earnings</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="size-4 fill-gold text-gold" />
                <p className="text-lg font-bold text-charcoal">{avgRating}</p>
              </div>
              <p className="text-xs text-charcoal/40 mt-0.5">Rating</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
