'use client';

import React, { useState } from 'react';
import {
  QrCode,
  Smartphone,
  Palette,
  BarChart3,
  MessageSquare,
  Camera,
  Sparkles,
  Menu,
  ArrowRight,
  Check,
  Zap,
  Star,
  Globe,
  ChevronRight,
  Users,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Templates', href: '#templates' },
  { label: 'Pricing', href: '#pricing' },
];

const FEATURES = [
  {
    icon: Smartphone,
    title: 'Mobile-Friendly Menus',
    description:
      'Beautiful menus that look perfect on any device. Your customers will love the smooth, touch-optimized experience.',
  },
  {
    icon: QrCode,
    title: 'QR Code Generation',
    description:
      'Instantly generate branded QR codes that link directly to your digital menu. Print-ready for tables and flyers.',
  },
  {
    icon: Camera,
    title: 'AI Menu Scanner',
    description:
      'Snap a photo of your physical menu and let AI extract every item, price, and description automatically.',
  },
  {
    icon: Palette,
    title: 'Beautiful Templates',
    description:
      'Choose from 10+ professionally designed templates. Customize colors, fonts, and layouts to match your brand.',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Ordering',
    description:
      'Let customers place orders directly through WhatsApp. Seamless integration with your existing workflow.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description:
      'Track QR scans, page views, and popular items. Make data-driven decisions to grow your business.',
  },
];

const STEPS = [
  {
    number: 1,
    title: 'Create Account',
    description: 'Sign up for free in seconds. No credit card required to get started.',
    icon: Users,
  },
  {
    number: 2,
    title: 'Build Your Menu',
    description: 'Add items, categories, and photos. Or scan your existing menu with AI.',
    icon: Menu,
  },
  {
    number: 3,
    title: 'Share QR Code',
    description: 'Print your QR code and place it on tables. Customers scan and browse instantly.',
    icon: QrCode,
  },
];

const TEMPLATE_PREVIEWS = [
  {
    name: 'Modern',
    description: 'Clean and contemporary design',
    colors: ['#10b981', '#059669', '#f0fdf4'],
    pattern: 'grid',
  },
  {
    name: 'Classic Restaurant',
    description: 'Traditional elegant styling',
    colors: ['#78350f', '#92400e', '#fef3c7'],
    pattern: 'list',
  },
  {
    name: 'Luxury',
    description: 'Premium gold and dark theme',
    colors: ['#1f2937', '#d97706', '#fbbf24'],
    pattern: 'cards',
  },
  {
    name: 'Minimal',
    description: 'Whitespace-focused simplicity',
    colors: ['#ffffff', '#f3f4f6', '#111827'],
    pattern: 'simple',
  },
];

const PRICING_TIERS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      '1 Business',
      'Up to 25 menu items',
      '1 QR code',
      'Basic template',
      'Mobile-responsive menu',
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For growing restaurants',
    features: [
      '5 Businesses',
      'Unlimited menu items',
      'Unlimited QR codes',
      'All premium templates',
      'WhatsApp ordering',
      'AI menu scanner',
      'Analytics dashboard',
      'Custom domain support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$49',
    period: '/month',
    description: 'For restaurant chains',
    features: [
      'Unlimited businesses',
      'Unlimited everything',
      'All templates & features',
      'White-label branding',
      'API access',
      'Priority support',
      'Team collaboration',
      'Advanced analytics & exports',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function LandingPage() {
  const navigate = useAppStore((s) => s.navigate);
  const { isSignedIn, isLoaded } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (href: string) => {
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
              <QrCode className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Menu<span className="text-emerald-600">QR</span>
            </span>
          </button>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-emerald-600"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden items-center gap-3 md:flex">
            {isSignedIn ? (
              <>
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button
                    variant="ghost"
                    className="text-gray-600 hover:text-emerald-600"
                  >
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </SignUpButton>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden rounded-md p-2 text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className="rounded-md px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-emerald-600"
                >
                  {link.label}
                </button>
              ))}
              <hr className="border-gray-100" />
              {isSignedIn ? (
                <>
                  <Button
                    onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <div className="flex justify-start pt-2">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <Button
                      variant="ghost"
                      className="justify-start text-gray-600"
                    >
                      Sign In
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </SignUpButton>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="pointer-events-none absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full bg-emerald-50/80 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8 lg:pt-32">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Hero text */}
            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
                <Sparkles className="h-4 w-4" />
                AI-Powered Menu Builder
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Create Your Digital Menu in{' '}
                <span className="text-emerald-600">Minutes</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-gray-600 sm:text-xl">
                Build stunning QR code menus for your restaurant. No design skills needed.
                Scan your existing menu with AI, customize with beautiful templates, and share instantly.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                {isSignedIn ? (
                  <Button
                    size="lg"
                    onClick={() => navigate('/dashboard')}
                    className="h-12 bg-emerald-600 px-8 text-base font-semibold text-white hover:bg-emerald-700"
                  >
                    Go to Dashboard
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                ) : (
                  <>
                    <SignUpButton mode="modal">
                      <Button
                        size="lg"
                        className="h-12 bg-emerald-600 px-8 text-base font-semibold text-white hover:bg-emerald-700"
                      >
                        Sign Up Free
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </SignUpButton>
                    <SignInButton mode="modal">
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-12 px-8 text-base font-semibold border-gray-300 hover:border-emerald-300 hover:text-emerald-600"
                      >
                        See Demo
                      </Button>
                    </SignInButton>
                  </>
                )}
              </div>
              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500 lg:justify-start">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500" />
                  Free forever plan
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500" />
                  No credit card
                </span>
              </div>
            </div>

            {/* Hero visual - Phone mockup */}
            <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
              <div className="relative">
                {/* Phone frame */}
                <div className="mx-auto w-[280px] rounded-[2.5rem] border-[8px] border-gray-800 bg-gray-800 p-2 shadow-2xl sm:w-[320px]">
                  <div className="overflow-hidden rounded-[2rem] bg-white">
                    {/* Status bar mock */}
                    <div className="flex items-center justify-between bg-emerald-600 px-5 py-2">
                      <span className="text-xs font-medium text-white">9:41</span>
                      <div className="flex gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-white/40" />
                        <div className="h-2.5 w-2.5 rounded-full bg-white/40" />
                        <div className="h-2.5 w-2.5 rounded-full bg-white/40" />
                      </div>
                    </div>
                    {/* Menu header mock */}
                    <div className="bg-emerald-600 px-5 pb-6 pt-3">
                      <h3 className="text-lg font-bold text-white">La Bella Cucina</h3>
                      <p className="text-xs text-emerald-100">Italian Restaurant</p>
                    </div>
                    {/* Menu items mock */}
                    <div className="space-y-3 bg-gray-50 p-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 rounded-lg bg-white p-3 shadow-sm">
                          <div className="h-14 w-14 shrink-0 rounded-lg bg-emerald-100" />
                          <div className="flex-1">
                            <div className="h-3.5 w-24 rounded bg-gray-200" />
                            <div className="mt-1.5 h-2.5 w-32 rounded bg-gray-100" />
                            <div className="mt-2 h-3 w-12 rounded bg-emerald-100" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Floating QR code badge */}
                <div className="absolute -right-4 bottom-20 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-white shadow-lg sm:-right-6 sm:h-24 sm:w-24">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-600 sm:h-16 sm:w-16">
                    <QrCode className="h-8 w-8 text-white sm:h-10 sm:w-10" />
                  </div>
                </div>
                {/* Floating stats badge */}
                <div className="absolute -left-4 top-24 flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-lg sm:-left-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">2.4k</p>
                    <p className="text-xs text-gray-500">QR Scans</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
              <Zap className="h-4 w-4" />
              Features
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything You Need to Go Digital
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Powerful tools to create, manage, and share your digital menu with ease.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="group border-gray-200 bg-white py-0 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
                >
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-600">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
              <Globe className="h-4 w-4" />
              How It Works
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Up and Running in 3 Simple Steps
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              No technical skills required. Get your digital menu live in under 10 minutes.
            </p>
          </div>

          <div className="relative mt-16">
            {/* Connecting line (desktop) */}
            <div className="absolute left-0 right-0 top-16 hidden h-0.5 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200 md:block" />

            <div className="grid gap-8 md:grid-cols-3 md:gap-6">
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="relative text-center">
                    <div className="relative z-10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-emerald-600 shadow-lg">
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                      {step.number}
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-gray-900">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Templates Preview Section */}
      <section id="templates" className="bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
              <Palette className="h-4 w-4" />
              Templates
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Beautiful Templates for Every Style
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Choose a template that matches your restaurant&#39;s vibe, then make it yours.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEMPLATE_PREVIEWS.map((template) => (
              <Card
                key={template.name}
                className="group cursor-pointer border-gray-200 bg-white py-0 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
              >
                <CardContent className="p-0">
                  {/* Template preview */}
                  <div
                    className="relative flex h-44 items-end p-4"
                    style={{
                      background: `linear-gradient(135deg, ${template.colors[0]} 0%, ${template.colors[1]} 100%)`,
                    }}
                  >
                    {/* Mock menu items */}
                    <div className="w-full space-y-2">
                      <div className="h-2.5 w-20 rounded-full bg-white/30" />
                      <div className="h-2 w-32 rounded-full bg-white/20" />
                      <div className="mt-3 h-2.5 w-16 rounded-full bg-white/30" />
                      <div className="h-2 w-28 rounded-full bg-white/20" />
                    </div>
                  </div>
                  {/* Template info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                    <button className="mt-3 flex items-center gap-1 text-sm font-medium text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100">
                      Preview
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
              <Star className="h-4 w-4" />
              Pricing
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Start free and scale as your business grows. No hidden fees.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {PRICING_TIERS.map((tier) => (
              <Card
                key={tier.name}
                className={
                  tier.highlighted
                    ? 'relative border-emerald-300 bg-white py-0 shadow-xl'
                    : 'border-gray-200 bg-white py-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg'
                }
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{tier.description}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">{tier.price}</span>
                    <span className="text-sm text-gray-500">{tier.period}</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <SignUpButton mode="modal">
                    <Button
                      className={
                        tier.highlighted
                          ? 'mt-8 w-full bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'mt-8 w-full'
                      }
                      variant={tier.highlighted ? 'default' : 'outline'}
                    >
                      {tier.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </SignUpButton>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTMwVjBoLTEydjRoMTJ6TTI0IDI0aDEydi0ySDI0djJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Ready to Ditch Your Paper Menu?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-emerald-100">
            Join thousands of restaurants that have gone digital with MenuQR.
            Start your free account today and see the difference.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isSignedIn ? (
              <Button
                size="lg"
                onClick={() => navigate('/dashboard')}
                className="h-12 bg-white px-8 text-base font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                Go to Dashboard
                <ArrowRight className="h-5 w-5" />
              </Button>
            ) : (
              <SignUpButton mode="modal">
                <Button
                  size="lg"
                  className="h-12 bg-white px-8 text-base font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  Start Building for Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </SignUpButton>
            )}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-emerald-200">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              SSL Secured
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4" />
              Setup in minutes
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                  <QrCode className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">
                  Menu<span className="text-emerald-600">QR</span>
                </span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-500">
                Create beautiful, scannable digital menus for your restaurant in minutes.
                Powered by AI.
              </p>
            </div>

            {/* Product links */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Product</h4>
              <ul className="mt-4 space-y-3">
                {['Features', 'Templates', 'Pricing', 'AI Scanner'].map((item) => (
                  <li key={item}>
                    <button className="text-sm text-gray-500 transition-colors hover:text-emerald-600">
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company links */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Company</h4>
              <ul className="mt-4 space-y-3">
                {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                  <li key={item}>
                    <button className="text-sm text-gray-500 transition-colors hover:text-emerald-600">
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal links */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Legal</h4>
              <ul className="mt-4 space-y-3">
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                  <li key={item}>
                    <button className="text-sm text-gray-500 transition-colors hover:text-emerald-600">
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 sm:flex-row">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} MenuQR. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              Made with
              <span className="text-emerald-500" aria-label="love">
                &hearts;
              </span>{' '}
              for restaurants everywhere
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
