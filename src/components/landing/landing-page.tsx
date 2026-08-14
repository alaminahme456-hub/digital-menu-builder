'use client';

import React, { useState, useRef } from 'react';
import {
  ArrowRight,
  Check,
  QrCode,
  Sparkles,
  BookOpen,
  Palette,
  BarChart3,
  Globe,
  Shield,
  Zap,
  Star,
  ChevronRight,
  UtensilsCrossed,
  ShoppingBag,
  Building2,
  Scissors,
  Store,
  Hotel,
  CalendarDays,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Templates', href: '#templates' },
  { label: 'Pricing', href: '#pricing' },
];

const BUSINESS_TYPES = [
  {
    icon: UtensilsCrossed,
    name: 'Restaurants',
    description: 'Menus and online ordering.',
    accent: '#C9A84C',
  },
  {
    icon: ShoppingBag,
    name: 'Fashion',
    description: 'Collections and product catalogs.',
    accent: '#8B6F47',
  },
  {
    icon: Hotel,
    name: 'Hotels',
    description: 'Rooms, facilities and services.',
    accent: '#6B8E6B',
  },
  {
    icon: Scissors,
    name: 'Salons',
    description: 'Services and pricing.',
    accent: '#B07AA1',
  },
  {
    icon: Store,
    name: 'Retail',
    description: 'Digital product catalogs.',
    accent: '#7A8EB0',
  },
  {
    icon: Building2,
    name: 'Real Estate',
    description: 'Property showcases.',
    accent: '#8B8B6B',
  },
  {
    icon: CalendarDays,
    name: 'Events',
    description: 'Programs and packages.',
    accent: '#B07A7A',
  },
  {
    icon: Briefcase,
    name: 'Services',
    description: 'Professional service catalogs.',
    accent: '#6B8B8B',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Create',
    description: 'Create your business experience in minutes.',
  },
  {
    number: '02',
    title: 'Customize',
    description: 'Choose a premium template and add your content.',
  },
  {
    number: '03',
    title: 'Publish',
    description: 'Generate your public URL and QR code.',
  },
  {
    number: '04',
    title: 'Share',
    description: 'Customers scan, explore and interact.',
  },
];

const TEMPLATE_SHOWCASE = [
  { name: 'AURELIA', style: 'Luxury / Elegant', color: '#1A1A1A', accent: '#C9A84C' },
  { name: 'NOIR', style: 'Dark / Editorial', color: '#0D0D0D', accent: '#FFFFFF' },
  { name: 'MONO', style: 'Minimal / Modern', color: '#FFFFFF', accent: '#1A1A1A' },
  { name: 'FORMA', style: 'Architectural / Premium', color: '#F5F0EB', accent: '#2D2D2D' },
];

export default function LandingPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-ivory overflow-x-hidden">
      {/* ── NAVIGATION ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-black/[0.06]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-charcoal text-white">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-charcoal">
                BIZFLIP
              </span>
            </button>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="text-[13px] font-medium tracking-wide uppercase text-charcoal/60 hover:text-charcoal transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
                className="hidden sm:flex text-[13px] font-medium text-charcoal/70 hover:text-charcoal"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate('/register')}
                className="bg-charcoal hover:bg-charcoal-light text-white text-[13px] font-medium h-9 px-5 rounded-lg"
              >
                Create Your Experience
              </Button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex flex-col gap-1.5 p-2"
                aria-label="Toggle menu"
              >
                <span className={`block h-[1.5px] w-5 bg-charcoal transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-[4px]' : ''}`} />
                <span className={`block h-[1.5px] w-5 bg-charcoal transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-[2px]' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-black/[0.06] bg-white px-6 py-4">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="block w-full text-left py-3 text-sm font-medium text-charcoal/70 border-b border-black/[0.04] last:border-0"
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="relative min-h-screen flex items-center noise-bg bg-charcoal overflow-hidden pt-16">
        {/* Subtle radial light */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-gold/[0.03] blur-[120px]" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/10 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left: Copy */}
            <div className="max-w-xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight text-white font-editorial">
                Your Business,{' '}
                <span className="text-gradient-gold">Beautifully</span>{' '}
                Presented.
              </h1>

              <p className="mt-6 text-lg text-white/50 leading-relaxed max-w-md">
                Create a stunning digital menu, catalog, portfolio, service list or product showcase.
                Share it instantly with one QR code.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Button
                  onClick={() => navigate('/register')}
                  className="bg-white hover:bg-white/90 text-charcoal text-[14px] font-semibold h-12 px-8 rounded-xl shadow-premium-lg group"
                >
                  Create Your Experience
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => scrollTo('#how-it-works')}
                  className="text-white/60 hover:text-white text-[14px] font-medium h-12 px-6"
                >
                  Explore Demo
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              {/* Trust line */}
              <div className="mt-12 flex items-center gap-6 text-sm text-white/30">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>SSL Secured</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>Instant Setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>Works Everywhere</span>
                </div>
              </div>
            </div>

            {/* Right: 3D Book Preview */}
            <div className="hidden lg:flex justify-center">
              <div className="relative" style={{ perspective: '1200px' }}>
                {/* Book shadow */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[280px] h-[20px] bg-black/30 rounded-[50%] blur-xl" />

                {/* Book */}
                <div
                  className="relative w-[320px] h-[420px] rounded-lg overflow-hidden shadow-2xl"
                  style={{
                    transform: 'rotateY(-12deg) rotateX(2deg)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Book cover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2D2D2D] to-[#1A1A1A]">
                    {/* Gold line accent */}
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-gold/40 via-gold to-gold/40" />
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-gold/40 via-gold to-gold/40" />

                    {/* Cover content */}
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      {/* Logo circle */}
                      <div className="w-16 h-16 rounded-full border border-gold/30 flex items-center justify-center mb-6 bg-gold/[0.06]">
                        <BookOpen className="h-7 w-7 text-gold" />
                      </div>

                      <h3 className="text-white text-xl font-bold tracking-wider font-editorial">
                        BIZFLIP
                      </h3>
                      <p className="text-white/30 text-[10px] tracking-[0.3em] uppercase mt-2">
                        Digital Experience
                      </p>

                      {/* Decorative line */}
                      <div className="w-12 h-px bg-gold/30 my-8" />

                      {/* Mock business content */}
                      <div className="space-y-4 w-full">
                        <div className="h-2 w-3/4 mx-auto bg-white/[0.06] rounded-full" />
                        <div className="h-2 w-1/2 mx-auto bg-white/[0.04] rounded-full" />
                        <div className="grid grid-cols-2 gap-2 mt-6">
                          <div className="aspect-square rounded bg-white/[0.04] flex items-center justify-center">
                            <div className="w-6 h-6 rounded bg-gold/10" />
                          </div>
                          <div className="aspect-square rounded bg-white/[0.04] flex items-center justify-center">
                            <div className="w-6 h-6 rounded bg-gold/10" />
                          </div>
                        </div>
                        <div className="space-y-2 mt-4">
                          <div className="h-1.5 w-full bg-white/[0.04] rounded-full" />
                          <div className="h-1.5 w-2/3 mx-auto bg-white/[0.04] rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Page edge effect (right side) */}
                  <div className="absolute top-2 right-0 w-[3px] h-[calc(100%-16px)] rounded-l bg-white/[0.03]" />
                  <div className="absolute top-3 right-[3px] w-[2px] h-[calc(100%-24px)] rounded-l bg-white/[0.02]" />
                  <div className="absolute top-4 right-[5px] w-[1px] h-[calc(100%-32px)] rounded-l bg-white/[0.01]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-ivory to-transparent" />
      </section>

      {/* ── BUILT FOR EVERY BUSINESS ── */}
      <section id="features" className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gold mb-4">
              Versatile Platform
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-charcoal font-editorial">
              One Platform. Every Business.
            </h2>
            <p className="mt-4 text-charcoal/50 text-lg leading-relaxed">
              From restaurants to real estate, BizFlip adapts to your industry.
            </p>
          </div>

          {/* Business cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BUSINESS_TYPES.map((biz) => {
              const Icon = biz.icon;
              return (
                <div
                  key={biz.name}
                  className="group relative bg-white rounded-xl p-6 border border-black/[0.06] hover:border-black/[0.12] transition-all duration-300 hover:shadow-premium cursor-pointer"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${biz.accent}10` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: biz.accent }} />
                  </div>
                  <h3 className="text-base font-semibold text-charcoal tracking-tight">
                    {biz.name}
                  </h3>
                  <p className="mt-1.5 text-sm text-charcoal/40 leading-relaxed">
                    {biz.description}
                  </p>
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-4 w-4 text-charcoal/30" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 lg:py-32 bg-white border-y border-black/[0.04]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gold mb-4">
              Simple Process
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-charcoal font-editorial">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {STEPS.map((step, i) => (
              <div key={step.number} className="relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gradient-to-r from-charcoal/10 to-transparent" />
                )}

                <div className="text-center">
                  <div className="text-5xl font-bold text-charcoal/[0.06] font-editorial mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold text-charcoal tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-charcoal/40 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEMPLATE SHOWCASE ── */}
      <section id="templates" className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gold mb-4">
              Premium Design
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-charcoal font-editorial">
              Designed to Make an Impression.
            </h2>
            <p className="mt-4 text-charcoal/50 text-lg leading-relaxed">
              Every template is crafted to elevate your brand and captivate your audience.
            </p>
          </div>

          {/* Template cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEMPLATE_SHOWCASE.map((tpl) => (
              <div
                key={tpl.name}
                className="group relative bg-white rounded-xl overflow-hidden border border-black/[0.06] hover:shadow-premium-lg transition-all duration-500 cursor-pointer"
              >
                {/* Template preview */}
                <div
                  className="aspect-[4/3] flex flex-col items-center justify-center relative"
                  style={{ backgroundColor: tpl.color }}
                >
                  {/* Mock header */}
                  <div className="absolute top-0 left-0 right-0 h-12 opacity-10"
                    style={{ backgroundColor: tpl.accent }}
                  />
                  {/* Mock content lines */}
                  <div className="space-y-2">
                    <div className="h-2 w-16 rounded-full" style={{ backgroundColor: `${tpl.accent}30` }} />
                    <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: `${tpl.accent}20` }} />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: `${tpl.accent}15` }} />
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: `${tpl.accent}15` }} />
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium flex items-center gap-2">
                      Preview <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold tracking-wider text-charcoal">
                        {tpl.name}
                      </h3>
                      <p className="text-[11px] text-charcoal/40 mt-0.5">
                        {tpl.style}
                      </p>
                    </div>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tpl.accent }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 lg:py-32 bg-charcoal noise-bg relative">
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gold mb-4">
              Powerful Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-editorial">
              Everything You Need.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Palette, title: 'Premium Templates', desc: 'Professionally designed templates for every industry.' },
              { icon: QrCode, title: 'QR Code Generation', desc: 'Instant branded QR codes, print-ready.' },
              { icon: BarChart3, title: 'Analytics', desc: 'Track views, scans, and customer engagement.' },
              { icon: Globe, title: 'Public URLs', desc: 'Custom shareable links for your business.' },
              { icon: Shield, title: 'Secure & Reliable', desc: 'Enterprise-grade security and uptime.' },
              { icon: Zap, title: 'Instant Updates', desc: 'Changes go live the moment you save.' },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group p-6 rounded-xl border border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300"
                >
                  <Icon className="h-5 w-5 text-gold mb-4" />
                  <h3 className="text-base font-semibold text-white tracking-tight">{feature.title}</h3>
                  <p className="mt-2 text-sm text-white/40 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-gold text-gold" />
            ))}
          </div>
          <blockquote className="text-xl sm:text-2xl text-charcoal/70 font-medium leading-relaxed max-w-2xl mx-auto font-editorial">
            &ldquo;BizFlip transformed how we present our menu. Our customers love the elegant digital experience.&rdquo;
          </blockquote>
          <div className="mt-6">
            <p className="text-sm font-semibold text-charcoal">Alexandra Chen</p>
            <p className="text-sm text-charcoal/40">The Grand Hotel</p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 lg:py-32 bg-charcoal noise-bg relative">
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-editorial max-w-2xl mx-auto">
            Turn Every Scan Into{' '}
            <span className="text-gradient-gold">an Experience.</span>
          </h2>
          <p className="mt-6 text-lg text-white/40 max-w-lg mx-auto">
            Join thousands of businesses creating stunning digital experiences.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={() => navigate('/register')}
              className="bg-white hover:bg-white/90 text-charcoal text-[14px] font-semibold h-12 px-8 rounded-xl shadow-premium-lg group"
            >
              Start Free Today
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="text-white/60 hover:text-white text-[14px] font-medium h-12 px-6"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-black/[0.06] py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-charcoal text-white">
                <BookOpen className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-bold tracking-tight text-charcoal">BIZFLIP</span>
            </div>
            <p className="text-[12px] text-charcoal/30">
              Your business, beautifully presented.
            </p>
            <p className="text-[12px] text-charcoal/30">
              &copy; {new Date().getFullYear()} BizFlip. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
