'use client';

import React, { useState, type FormEvent } from 'react';
import {
  BookOpen,
  Loader2,
  ArrowLeft,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

interface RegisterPageProps {
  isDesigner?: boolean;
}

export default function RegisterPage({ isDesigner = false }: RegisterPageProps) {
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
    if (!category && !isDesigner) {
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

      if (data.requiresConfirmation || !data.token) {
        toast.success('Account created! Please check your email to verify your account.');
        navigate('/login');
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

      toast.success('Account created successfully!');
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
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              <span className="text-[11px] font-medium tracking-widest uppercase text-gold-light">
                Get Started Free
              </span>
            </div>
            <h1 className="text-4xl font-bold leading-tight text-white font-editorial">
              Create Your{' '}
              <span className="text-gradient-gold">Digital Experience</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/40">
              Join thousands of businesses that have upgraded to digital experiences. No credit card required.
            </p>

            <ul className="mt-10 space-y-4">
              {[
                'Create your experience in minutes',
                'Choose from premium templates',
                'Scan existing content with AI',
                'Track performance with analytics',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold/60" />
                  <span className="text-sm text-white/40">{item}</span>
                </li>
              ))}
            </ul>
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
            {/* Logo */}
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
                {isDesigner ? 'Create your designer account' : 'Create your account'}
              </h2>
              <p className="mt-2 text-sm text-charcoal/40">
                {isDesigner ? 'Start sharing your designs with the world' : 'Start building your digital experience'}
              </p>
            </div>

            <Card className="border-black/[0.06] shadow-premium bg-white">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[12px] font-medium tracking-wide uppercase text-charcoal/50">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      disabled={loading}
                      className="h-11 bg-ivory border-black/[0.06] focus:border-charcoal/20"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-[12px] font-medium tracking-wide uppercase text-charcoal/50">
                      Email
                    </Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      disabled={loading}
                      className="h-11 bg-ivory border-black/[0.06] focus:border-charcoal/20"
                    />
                  </div>

                  {/* Business Category — hidden for designer registration */}
                  {!isDesigner && (
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-[12px] font-medium tracking-wide uppercase text-charcoal/50">
                      Business Category
                    </Label>
                    <Select value={category} onValueChange={setCategory} disabled={loading}>
                      <SelectTrigger id="category" className="w-full h-11 bg-ivory border-black/[0.06]">
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
                  )}

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-[12px] font-medium tracking-wide uppercase text-charcoal/50">
                      Password
                    </Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      disabled={loading}
                      className="h-11 bg-ivory border-black/[0.06] focus:border-charcoal/20"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-[12px] font-medium tracking-wide uppercase text-charcoal/50">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      disabled={loading}
                      className="h-11 bg-ivory border-black/[0.06] focus:border-charcoal/20"
                    />
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-2 pt-1">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                      disabled={loading}
                      className="mt-0.5"
                    />
                    <Label htmlFor="terms" className="cursor-pointer text-sm leading-snug text-charcoal/40">
                      I agree to the{' '}
                      <button type="button" className="font-medium text-charcoal/60 hover:text-charcoal">
                        Terms of Service
                      </button>{' '}
                      and{' '}
                      <button type="button" className="font-medium text-charcoal/60 hover:text-charcoal">
                        Privacy Policy
                      </button>
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
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Sign in link */}
            <p className="mt-8 text-center text-sm text-charcoal/40">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="font-semibold text-charcoal hover:text-charcoal/70"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
