'use client';

import React, { useState, type FormEvent } from 'react';
import { QrCode, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore, useAppStore } from '@/lib/store';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useAppStore((s) => s.navigate);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setBusinesses = useAppStore((s) => s.setBusinesses);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Invalid email or password');
        return;
      }

      // Store auth state
      setAuth(data.token, data.user);

      // Fetch businesses
      try {
        const bizRes = await fetch('/api/businesses', {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        if (bizRes.ok) {
          const bizData = await bizRes.json();
          setBusinesses(bizData);
        }
      } catch {
        // Non-critical, continue navigation
      }

      toast.success('Welcome back!');
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
          <div className="pointer-events-none absolute right-20 bottom-32 h-32 w-32 rounded-full bg-white/5" />

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
              <QrCode className="h-4 w-4" />
              Digital Menu Platform
            </div>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Your Digital Menu,{' '}
              <span className="text-emerald-200">One Scan Away</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-emerald-100 lg:text-lg">
              Create beautiful QR code menus, track analytics, and delight your customers with a seamless dining experience.
            </p>
            {/* Feature pills */}
            <div className="mt-8 flex flex-wrap gap-3">
              {['QR Code Menus', 'AI Scanner', 'WhatsApp Orders', 'Analytics'].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white/10 px-4 py-1.5 text-sm text-white"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
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
              {/* Logo for desktop only (on form side) */}
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
              <CardTitle className="text-2xl font-bold text-gray-900">Welcome back</CardTitle>
              <CardDescription className="text-gray-500">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={loading}
                  />
                </div>

                {/* Remember me */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    disabled={loading}
                  />
                  <Label htmlFor="remember" className="cursor-pointer text-sm text-gray-600">
                    Remember me
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
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              {/* Sign up link */}
              <p className="mt-6 text-center text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Sign up
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
