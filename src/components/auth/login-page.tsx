'use client';

import React, { useState, type FormEvent } from 'react';
import { BookOpen, Loader2, ArrowLeft } from 'lucide-react';
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
  const setCurrentBusiness = useAppStore((s) => s.setCurrentBusiness);

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

      setAuth(data.token, data.user);

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

      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory">
      <div className="flex min-h-screen">
        {/* Left branding panel */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-charcoal flex-col justify-between px-12 py-12">
          {/* Decorative */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gold/[0.02] blur-[100px]" />

          {/* Logo */}
          <div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <BookOpen className="h-4 w-4 text-gold" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                BIZFLIP
              </span>
            </button>
          </div>

          {/* Center */}
          <div className="relative z-10 max-w-md">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.06] px-4 py-1.5">
              <BookOpen className="h-3.5 w-3.5 text-gold" />
              <span className="text-[11px] font-medium tracking-widest uppercase text-gold-light">
                Digital Experience Platform
              </span>
            </div>
            <h1 className="text-4xl font-bold leading-tight text-white font-editorial">
              Your Digital Experience,{' '}
              <span className="text-gradient-gold">One Scan Away</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/40">
              Create stunning digital experiences, track analytics, and delight your customers with a seamless interface.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {['QR Experiences', 'AI Scanner', 'WhatsApp Orders', 'Analytics'].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-[12px] font-medium text-white/50"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="relative z-10 flex items-center gap-2 text-[12px] text-white/25">
            <span className="text-gold/60">&#9733;</span>
            <span>Trusted by businesses worldwide</span>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
          {/* Back link (mobile) */}
          <button
            onClick={() => navigate('/')}
            className="mb-8 flex items-center gap-1.5 text-[13px] text-charcoal/40 transition-colors hover:text-charcoal lg:hidden self-start"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="w-full max-w-sm">
            {/* Logo (mobile + desktop form side) */}
            <div className="flex justify-center mb-8">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-charcoal">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight text-charcoal">
                  BIZFLIP
                </span>
              </button>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-charcoal tracking-tight font-editorial">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-charcoal/40">
                Sign in to your workspace
              </p>
            </div>

            <Card className="border-black/[0.06] shadow-premium bg-white">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[12px] font-medium tracking-wide uppercase text-charcoal/50">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      disabled={loading}
                      className="h-11 bg-ivory border-black/[0.06] focus:border-charcoal/20"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-[12px] font-medium tracking-wide uppercase text-charcoal/50">
                        Password
                      </Label>
                      <button
                        type="button"
                        className="text-[12px] font-medium text-charcoal/40 hover:text-charcoal"
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
                      className="h-11 bg-ivory border-black/[0.06] focus:border-charcoal/20"
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
                    <Label htmlFor="remember" className="cursor-pointer text-sm text-charcoal/50">
                      Remember me
                    </Label>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 w-full bg-charcoal hover:bg-charcoal-light text-white text-[13px] font-semibold tracking-wide"
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
              </CardContent>
            </Card>

            {/* Sign up link */}
            <p className="mt-8 text-center text-sm text-charcoal/40">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="font-semibold text-charcoal hover:text-charcoal/70"
              >
                Create one
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
