'use client';

import React, { useState, type FormEvent } from 'react';
import {
  QrCode,
  Loader2,
  ArrowLeft,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore, useAppStore } from '@/lib/store';
import { BUSINESS_CATEGORIES } from '@/lib/types';
import { toast } from 'sonner';

export default function RegisterPage() {
  const navigate = useAppStore((s) => s.navigate);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setBusinesses = useAppStore((s) => s.setBusinesses);
  const setCurrentBusiness = useAppStore((s) => s.setCurrentBusiness);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [category, setCategory] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    if (!name.trim()) {
      toast.error('Please enter your full name');
      return false;
    }
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!password) {
      toast.error('Please enter a password');
      return false;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    if (!category) {
      toast.error('Please select a business category');
      return false;
    }
    if (!acceptTerms) {
      toast.error('Please accept the terms and conditions');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Registration failed. Please try again.');
        return;
      }

      // Auto-login after registration
      setAuth(data.token, data.user);

      // Fetch businesses and set current
      try {
        const bizRes = await fetch('/api/businesses', {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        if (bizRes.ok) {
          const bizResult = await bizRes.json();
          const bizList = bizResult.businesses.map((b: { id: string; slug: string; name: string; logo: string | null; status: string }) => ({
            id: b.id,
            slug: b.slug,
            name: b.name,
            logo: b.logo,
            status: b.status,
          }));
          setBusinesses(bizList);
          if (bizList.length > 0) {
            setCurrentBusiness(bizList[0]);
          }
        }
      } catch {
        // Non-critical
      }

      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Left branding panel */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 px-6 py-10 text-white lg:w-1/2 lg:px-12 lg:py-12">
          {/* Decorative elements */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute right-24 bottom-40 h-24 w-24 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute left-20 top-40 h-20 w-20 rounded-full bg-white/5" />

          {/* Top logo */}
          <div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
                <QrCode className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">
                Menu<span className="text-emerald-200">QR</span>
              </span>
            </button>
          </div>

          {/* Center content */}
          <div className="relative z-10 my-auto max-w-md lg:my-0 lg:py-16">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-emerald-100">
              <Sparkles className="h-4 w-4" />
              Get Started Free
            </div>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Start Building Your{' '}
              <span className="text-emerald-200">Digital Menu</span>{' '}
              Today
            </h1>
            <p className="mt-4 text-base leading-relaxed text-emerald-100 lg:text-lg">
              Join thousands of restaurants that have upgraded to QR code menus. No credit card required.
            </p>

            {/* Benefits list */}
            <ul className="mt-8 space-y-4">
              {[
                'Create your first menu in minutes',
                'Choose from 10+ beautiful templates',
                'Scan existing menus with AI',
                'Track performance with analytics',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                  <span className="text-sm text-emerald-100">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom trust indicator */}
          <div className="relative z-10 hidden items-center gap-2 text-sm text-emerald-200 lg:flex">
            <span className="text-base">&#9733;</span>
            <span>Trusted by 2,000+ restaurants worldwide</span>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
          {/* Back link (mobile) */}
          <button
            onClick={() => navigate('/')}
            className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-emerald-600 lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </button>

          <Card className="w-full max-w-md border-gray-200 shadow-sm">
            <CardHeader className="text-center">
              {/* Logo for desktop only */}
              <div className="mb-2 hidden justify-center lg:flex">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 transition-opacity hover:opacity-80"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                    <QrCode className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    Menu<span className="text-emerald-600">QR</span>
                  </span>
                </button>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Create your account
              </CardTitle>
              <CardDescription className="text-gray-500">
                Get started with your free MenuQR account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>

                {/* Business Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Business Category</Label>
                  <Select value={category} onValueChange={setCategory} disabled={loading}>
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue placeholder="Select your business type" />
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

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>

                {/* Terms checkbox */}
                <div className="flex items-start gap-2 pt-1">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                    disabled={loading}
                    className="mt-0.5"
                  />
                  <Label htmlFor="terms" className="cursor-pointer text-sm leading-snug text-gray-600">
                    I agree to the{' '}
                    <button
                      type="button"
                      className="font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      Terms of Service
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      className="font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      Privacy Policy
                    </button>
                  </Label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>

              {/* Sign in link */}
              <p className="mt-6 text-center text-sm text-gray-500">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Sign in
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
